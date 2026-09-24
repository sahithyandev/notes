import { test, expect } from "bun:test";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { ClaudeStreamAdapter, type AgentEvent } from "./agent.ts";

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
