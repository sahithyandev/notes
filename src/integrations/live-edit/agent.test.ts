import { test, expect } from "bun:test";
import { EventEmitter } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough } from "node:stream";
import {
  ClaudeStreamAdapter,
  LineQueue,
  OpenCodeAdapter,
  type AgentEvent,
} from "./agent.ts";
import { SYSTEM_PROMPT } from "./prompt.ts";

// A fake `claude` child process: no real binary involved. stdout is a
// PassThrough we push NDJSON lines into to simulate agent output; stdin
// writes are recorded so tests can assert what was sent (e.g. --resume on
// respawn). Mirrors just enough of ChildProcess for agent.ts's usage.
function makeFakeChild() {
  const stdout = new PassThrough();
  const stderr = new PassThrough();
  const writes: string[] = [];
  const emitter = new EventEmitter();
  const child = Object.assign(emitter, {
    stdout,
    stderr,
    stdin: { write: (data: string) => writes.push(data) },
    killed: false,
    kill: () => {
      child.killed = true;
      emitter.emit("exit", null);
    },
  });
  return { child, stdout, writes };
}

// Like makeFakeChild(), but kill() doesn't auto-emit "exit" - the test
// fires it manually, to simulate the OS's exit notification arriving late
// (after the adapter has already moved on to a new child).
function makeFakeChildManualExit() {
  const stdout = new PassThrough();
  const stderr = new PassThrough();
  const writes: string[] = [];
  const emitter = new EventEmitter();
  const child = Object.assign(emitter, {
    stdout,
    stderr,
    stdin: { write: (data: string) => writes.push(data) },
    killed: false,
    kill: () => {
      child.killed = true;
    },
  });
  return { child, stdout, writes };
}

function line(obj: unknown): string {
  return JSON.stringify(obj) + "\n";
}

async function collect(iter: AsyncIterable<AgentEvent>): Promise<AgentEvent[]> {
  const out: AgentEvent[] = [];
  for await (const e of iter) out.push(e);
  return out;
}

test("send() yields session then result for a simple turn", async () => {
  const { child, stdout } = makeFakeChild();
  const adapter = new ClaudeStreamAdapter({
    cwd: "/repo",
    spawnFn: (() => child) as any,
  });

  const eventsPromise = collect(adapter.send("hello"));

  // Simulate the process's own stream-json output.
  stdout.write(
    line({ type: "system", subtype: "init", session_id: "abc-123" }),
  );
  stdout.write(
    line({
      type: "assistant",
      message: {
        content: [
          { type: "tool_use", name: "Read", input: { file_path: "docs/x.md" } },
        ],
      },
    }),
  );
  stdout.write(
    line({
      type: "result",
      result: "done",
      is_error: false,
      total_cost_usd: 0.01,
    }),
  );

  const events = await eventsPromise;
  expect(events[0]).toEqual({
    type: "session",
    sessionId: expect.any(String),
  } as any);
  expect(
    events.some((e) => e.type === "progress" && e.label === "Read: docs/x.md"),
  ).toBe(true);
  const result = events.find((e) => e.type === "result");
  expect(result).toEqual({
    type: "result",
    text: "done",
    isError: false,
    costUsd: 0.01,
  });

  adapter.dispose();
});

test("LineQueue.drainStale() clears and returns whatever was buffered", async () => {
  // The claude CLI can keep emitting lines after a turn's own "result" -
  // observed directly: the Skill tool (in ALLOWED_TOOLS) can dispatch a
  // background subagent whose belated completion arrives once the main
  // reply has already ended the turn, landing here with nothing waiting to
  // consume it. Without draining it before the next turn writes a new
  // prompt, the next send() would hand this stale line out first, as if it
  // were the reply to the brand new prompt.
  const queue = new LineQueue();
  expect(queue.drainStale()).toEqual([]);

  queue.push({ type: "assistant", text: "stray" });
  queue.push({ type: "result", result: "stray result" });
  expect(queue.drainStale()).toEqual([
    { type: "assistant", text: "stray" },
    { type: "result", result: "stray result" },
  ]);

  // Draining empties it - a second call has nothing left to return.
  expect(queue.drainStale()).toEqual([]);

  // A pending waiter (a send() awaiting the *next* real line) is untouched:
  // drainStale() only ever clears what's already buffered, never cancels an
  // in-flight wait.
  const pending = queue.next();
  expect(queue.drainStale()).toEqual([]);
  queue.push({ type: "result", result: "real" });
  expect(await pending).toEqual({ type: "result", result: "real" });
});

test("send() discards a stale line left over from the previous turn before starting the next one", async () => {
  const { child, stdout } = makeFakeChild();
  const adapter = new ClaudeStreamAdapter({
    cwd: "/repo",
    spawnFn: (() => child) as any,
  });

  const first = collect(adapter.send("first"));
  stdout.write(line({ type: "result", result: "ok1", is_error: false }));
  await first;

  // Arrives late, after the first turn already returned - nothing is
  // waiting on the queue at this point, so it just sits buffered until
  // something calls next() (or, before this fix, until the next send()'s
  // own loop wrongly picked it up as that turn's reply). setImmediate
  // (not just a microtask) gives the real stream/readline pipeline a full
  // event-loop turn to actually deliver it.
  stdout.write(
    line({
      type: "assistant",
      message: {
        content: [{ type: "text", text: "stray background agent notice" }],
      },
    }),
  );
  await new Promise((resolve) => setImmediate(resolve));

  const second = collect(adapter.send("second"));
  // Real IPC can't deliver a reply before the request that provoked it was
  // actually sent - give send() a full turn to run past its own
  // drainStale() and reach child.stdin.write() before simulating the CLI's
  // response, or this write could race ahead of drainStale() and get
  // swept up as if it were itself the stale leftover.
  await new Promise((resolve) => setImmediate(resolve));
  stdout.write(line({ type: "result", result: "ok2", is_error: false }));
  const events = await second;

  const result = events.find((e) => e.type === "result");
  expect(result).toEqual({
    type: "result",
    text: "ok2",
    isError: false,
    costUsd: undefined,
  });

  adapter.dispose();
});

test("send() shortens an absolute file_path to a cwd-relative one in progress labels", async () => {
  // Real Claude tool calls always give an absolute file_path (unlike the
  // shorthand relative path used above) - a raw absolute path overflows
  // live-edit-bar.astro's fixed-width status strip, so this must come back
  // shortened, not passed through as-is.
  const { child, stdout } = makeFakeChild();
  const adapter = new ClaudeStreamAdapter({
    cwd: "/repo",
    spawnFn: (() => child) as any,
  });

  const eventsPromise = collect(adapter.send("hello"));

  stdout.write(
    line({ type: "system", subtype: "init", session_id: "abc-123" }),
  );
  stdout.write(
    line({
      type: "assistant",
      message: {
        content: [
          {
            type: "tool_use",
            name: "Read",
            input: { file_path: "/repo/docs/s1/x.md" },
          },
        ],
      },
    }),
  );
  stdout.write(line({ type: "result", result: "done", is_error: false }));

  const events = await eventsPromise;
  expect(
    events.some(
      (e) => e.type === "progress" && e.label === "Read: docs/s1/x.md",
    ),
  ).toBe(true);

  adapter.dispose();
});

test("send() caps an overly long progress label", async () => {
  const { child, stdout } = makeFakeChild();
  const adapter = new ClaudeStreamAdapter({
    cwd: "/repo",
    spawnFn: (() => child) as any,
  });

  const eventsPromise = collect(adapter.send("hello"));

  stdout.write(
    line({ type: "system", subtype: "init", session_id: "abc-123" }),
  );
  stdout.write(
    line({
      type: "assistant",
      message: {
        content: [
          {
            type: "tool_use",
            name: "Bash",
            input: { command: "x".repeat(200) },
          },
        ],
      },
    }),
  );
  stdout.write(line({ type: "result", result: "done", is_error: false }));

  const events = await eventsPromise;
  const progress = events.find((e) => e.type === "progress");
  expect(progress?.type).toBe("progress");
  expect((progress as { label: string }).label.length).toBeLessThanOrEqual(70);
  expect((progress as { label: string }).label.endsWith("…")).toBe(true);

  adapter.dispose();
});

test("send() passes --session-id on first spawn and --resume afterwards", async () => {
  const spawnCalls: string[][] = [];
  const children = [makeFakeChild(), makeFakeChild()];
  let spawnIdx = 0;
  const spawnFn = ((_cmd: string, args: string[]) => {
    spawnCalls.push(args);
    return children[spawnIdx++].child;
  }) as any;

  const adapter = new ClaudeStreamAdapter({ cwd: "/repo", spawnFn });

  const first = collect(adapter.send("first"));
  children[0].stdout.write(
    line({ type: "result", result: "ok1", is_error: false }),
  );
  await first;

  expect(spawnCalls[0]).toContain("--session-id");
  expect(spawnCalls[0]).not.toContain("--resume");

  // Simulate the process dying between turns.
  (children[0].child as any).emit("exit", 1);

  const second = collect(adapter.send("second"));
  children[1].stdout.write(
    line({ type: "result", result: "ok2", is_error: false }),
  );
  await second;

  expect(spawnCalls[1]).toContain("--resume");

  adapter.dispose();
});

test("send() reports a process-error when the child dies mid-turn", async () => {
  const { child } = makeFakeChild();
  const adapter = new ClaudeStreamAdapter({
    cwd: "/repo",
    spawnFn: (() => child) as any,
  });

  const eventsPromise = collect(adapter.send("hello"));
  // Let the generator run far enough to attach its exit listener (via
  // ensureChild()) before the process "dies".
  await Promise.resolve();
  await Promise.resolve();
  (child as any).emit("exit", 1);

  const events = await eventsPromise;
  expect(events.some((e) => e.type === "process-error")).toBe(true);

  adapter.dispose();
});

test("reset() drops the session so the next send starts fresh", async () => {
  const spawnCalls: string[][] = [];
  const children = [makeFakeChild(), makeFakeChild()];
  let spawnIdx = 0;
  const spawnFn = ((_cmd: string, args: string[]) => {
    spawnCalls.push(args);
    return children[spawnIdx++].child;
  }) as any;

  const adapter = new ClaudeStreamAdapter({ cwd: "/repo", spawnFn });

  const first = collect(adapter.send("first"));
  children[0].stdout.write(
    line({ type: "result", result: "ok1", is_error: false }),
  );
  await first;

  adapter.reset();

  const second = collect(adapter.send("second"));
  children[1].stdout.write(
    line({ type: "result", result: "ok2", is_error: false }),
  );
  await second;

  expect(spawnCalls[1]).toContain("--session-id");
  expect(spawnCalls[1]).not.toContain("--resume");

  adapter.dispose();
});

test("a stale exit from a reset() child doesn't corrupt the next turn", async () => {
  const childA = makeFakeChildManualExit();
  const childB = makeFakeChild();
  const children = [childA, childB];
  let spawnIdx = 0;
  const spawnFn = (() => children[spawnIdx++].child) as any;

  const adapter = new ClaudeStreamAdapter({ cwd: "/repo", spawnFn });

  const first = collect(adapter.send("first"));
  childA.stdout.write(line({ type: "result", result: "ok1", is_error: false }));
  await first;

  // reset() kills child A, but (per makeFakeChildManualExit) its "exit"
  // event hasn't fired yet - mirrors the real ChildProcess.kill()/"exit"
  // gap that let a stale event clobber a newer child's state.
  adapter.reset();

  const second = collect(adapter.send("second"));

  // Child A's delayed exit arrives while the second turn (on child B) is
  // already in flight. It must not be mistaken for child B dying.
  (childA.child as any).emit("exit", null);

  childB.stdout.write(line({ type: "result", result: "ok2", is_error: false }));
  const events = await second;

  expect(events.some((e) => e.type === "process-error")).toBe(false);
  const result = events.find((e) => e.type === "result");
  expect(result).toEqual({ type: "result", text: "ok2", isError: false });

  adapter.dispose();
});

// --- OpenCodeAdapter ----------------------------------------------------
//
// A fake `opencode` child: no real binary involved. Unlike Claude's
// long-lived process, OpenCodeAdapter spawns one child per send() call (a
// `run`, then an `export`), so tests supply one fake child per expected
// spawn via an index-based spawnFn instead of writing to a single shared
// child. `close()` (not `exit()`) is what the adapter listens for, since
// real ChildProcess instances emit "close" once stdio is fully flushed -
// that's what guarantees every stdout line has already reached the
// adapter's line queue before it sees the process as done.
function makeFakeOpenCodeChild() {
  const stdout = new PassThrough();
  const stderr = new PassThrough();
  const emitter = new EventEmitter();
  const child = Object.assign(emitter, { stdout, stderr });
  return {
    child,
    stdout,
    stderr,
    close: (code: number | null) => emitter.emit("close", code),
  };
}

// live-edit's own scratchpad, not the project root, so these tests never
// touch the real .opencode/ directory.
async function withScratchCwd<T>(fn: (cwd: string) => Promise<T>): Promise<T> {
  const cwd = await mkdtemp(join(tmpdir(), "live-edit-opencode-test-"));
  try {
    return await fn(cwd);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
}

// Writing to a fake child's stdout right after collect(send()) would race
// the adapter attaching its own listeners over that child: spawnFn returns
// the child synchronously, but the async generator only wires up its "close"
// handler once the turn starts, and collect() awaits that. This wraps
// spawnFn so a test can await the moment each child actually gets spawned
// before touching its streams.
function makeSequentialSpawn(
  children: ReturnType<typeof makeFakeOpenCodeChild>[],
) {
  let idx = 0;
  const waiters: Array<() => void> = [];
  const pending: ReturnType<typeof makeFakeOpenCodeChild>[] = [];
  const spawnCalls: string[][] = [];
  const spawnFn = ((_cmd: string, args: string[]) => {
    spawnCalls.push(args);
    const current = children[idx++];
    const waiter = waiters.shift();
    if (waiter) waiter(current);
    else pending.push(current);
    return current.child;
  }) as any;
  function nextSpawned(): Promise<ReturnType<typeof makeFakeOpenCodeChild>> {
    const current = pending.shift();
    if (current) return Promise.resolve(current);
    return new Promise((resolve) => waiters.push(resolve));
  }
  return { spawnFn, nextSpawned, spawnCalls };
}

test("OpenCodeAdapter: send() runs then exports the result", async () =>
  withScratchCwd(async (cwd) => {
    const run = makeFakeOpenCodeChild();
    const exp = makeFakeOpenCodeChild();
    const { spawnFn, nextSpawned } = makeSequentialSpawn([run, exp]);

    const adapter = new OpenCodeAdapter({ cwd, spawnFn });
    const eventsPromise = collect(adapter.send("hello"));

    await nextSpawned();
    run.stdout.write(
      line({
        type: "tool_use",
        sessionID: "ses_abc123",
        part: {
          type: "tool",
          tool: "read",
          callID: "call_1",
          state: { status: "completed", input: { filePath: "docs/x.md" } },
        },
      }),
    );
    run.close(0);

    await nextSpawned();
    exp.stdout.write(
      JSON.stringify({
        messages: [
          {
            info: { role: "assistant", cost: 0.01 },
            parts: [{ type: "text", text: "done" }],
          },
        ],
      }),
    );
    exp.close(0);

    const events = await eventsPromise;
    expect(events).toContainEqual({
      type: "session",
      sessionId: "ses_abc123",
    });
    expect(events).toContainEqual({
      type: "progress",
      label: "read: docs/x.md",
    });
    expect(events.find((e) => e.type === "result")).toEqual({
      type: "result",
      text: "done",
      isError: false,
      costUsd: 0.01,
    });

    adapter.dispose();
  }));

test("OpenCodeAdapter: send() still surfaces progress for the legacy event shapes", async () =>
  withScratchCwd(async (cwd) => {
    const run = makeFakeOpenCodeChild();
    const exp = makeFakeOpenCodeChild();
    const { spawnFn, nextSpawned } = makeSequentialSpawn([run, exp]);

    const adapter = new OpenCodeAdapter({ cwd, spawnFn });
    const eventsPromise = collect(adapter.send("hello"));

    await nextSpawned();
    run.stdout.write(
      line({
        type: "tool",
        tool: "read",
        sessionID: "ses_abc123",
        state: { input: { filePath: "docs/a.md" } },
      }),
    );
    run.stdout.write(
      line({
        type: "message.part.updated",
        sessionID: "ses_abc123",
        properties: {
          part: {
            type: "tool",
            tool: "glob",
            state: { input: { pattern: "**/*.md" } },
          },
        },
      }),
    );
    run.close(0);

    await nextSpawned();
    exp.stdout.write(
      JSON.stringify({
        messages: [{ info: { role: "assistant" }, parts: [] }],
      }),
    );
    exp.close(0);

    const events = await eventsPromise;
    expect(events).toContainEqual({
      type: "progress",
      label: "read: docs/a.md",
    });
    expect(events).toContainEqual({
      type: "progress",
      label: "glob: **/*.md",
    });

    adapter.dispose();
  }));

test("OpenCodeAdapter: spawns the default agent with SYSTEM_PROMPT inlined on a new session only", async () =>
  withScratchCwd(async (cwd) => {
    const children = [
      makeFakeOpenCodeChild(),
      makeFakeOpenCodeChild(),
      makeFakeOpenCodeChild(),
      makeFakeOpenCodeChild(),
    ];
    const { spawnFn, nextSpawned, spawnCalls } = makeSequentialSpawn(children);

    const adapter = new OpenCodeAdapter({ cwd, spawnFn });

    const first = collect(adapter.send("first"));
    await nextSpawned();
    children[0].stdout.write(line({ sessionID: "ses_123" }));
    children[0].close(0);
    await nextSpawned();
    children[1].stdout.write(
      JSON.stringify({
        messages: [{ info: { role: "assistant" }, parts: [] }],
      }),
    );
    children[1].close(0);
    await first;

    const second = collect(adapter.send("second"));
    await nextSpawned();
    children[2].stdout.write(line({ sessionID: "ses_123" }));
    children[2].close(0);
    await nextSpawned();
    children[3].stdout.write(
      JSON.stringify({
        messages: [{ info: { role: "assistant" }, parts: [] }],
      }),
    );
    children[3].close(0);
    await second;

    // Never passes --agent: the free tier only serves the default agent.
    expect(spawnCalls[0]).not.toContain("--agent");
    expect(spawnCalls[2]).not.toContain("--agent");
    // The SYSTEM_PROMPT rides along in the first message of a session, and
    // the bare prompt on resumed turns (opencode persists messages
    // server-side, so a resumed session already carries it).
    expect(spawnCalls[0].at(-1)).toContain(SYSTEM_PROMPT);
    expect(spawnCalls[0].at(-1)).toContain("first");
    expect(spawnCalls[2].at(-1)).toBe("second");

    adapter.dispose();
  }));

test("OpenCodeAdapter: send() passes --session on the next turn", async () =>
  withScratchCwd(async (cwd) => {
    const children = [
      makeFakeOpenCodeChild(),
      makeFakeOpenCodeChild(),
      makeFakeOpenCodeChild(),
      makeFakeOpenCodeChild(),
    ];
    const { spawnFn, nextSpawned, spawnCalls } = makeSequentialSpawn(children);

    const adapter = new OpenCodeAdapter({ cwd, spawnFn });

    const first = collect(adapter.send("first"));
    await nextSpawned();
    children[0].stdout.write(line({ sessionID: "ses_111" }));
    children[0].close(0);
    await nextSpawned();
    children[1].stdout.write(
      JSON.stringify({
        messages: [{ info: { role: "assistant" }, parts: [] }],
      }),
    );
    children[1].close(0);
    await first;

    const second = collect(adapter.send("second"));
    await nextSpawned();
    children[2].stdout.write(line({ sessionID: "ses_111" }));
    children[2].close(0);
    await nextSpawned();
    children[3].stdout.write(
      JSON.stringify({
        messages: [{ info: { role: "assistant" }, parts: [] }],
      }),
    );
    children[3].close(0);
    await second;

    expect(spawnCalls[0]).not.toContain("--session");
    expect(spawnCalls[2]).toContain("--session");
    expect(spawnCalls[2]).toContain("ses_111");

    adapter.dispose();
  }));

test("OpenCodeAdapter: send() reports a process-error when no session ever starts", async () =>
  withScratchCwd(async (cwd) => {
    const run = makeFakeOpenCodeChild();
    const { spawnFn, nextSpawned } = makeSequentialSpawn([run]);

    const adapter = new OpenCodeAdapter({ cwd, spawnFn });
    const eventsPromise = collect(adapter.send("hello"));

    await nextSpawned();
    run.stderr.write("opencode: agent config error\n");
    run.close(1);

    const events = await eventsPromise;
    expect(events).toEqual([
      {
        type: "process-error",
        message: "opencode: agent config error",
      },
    ]);

    adapter.dispose();
  }));
