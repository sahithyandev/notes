import { test, expect } from "bun:test";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import liveEdit from "./index.ts";

// Fakes just enough of the ChildProcess shape agent.ts's ClaudeStreamAdapter
// and index.ts's runCliCapture()/runCheckNotesStyle() touch - mirrors
// agent.test.ts's makeFakeChild(), not a real process anywhere in this file.
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

function makeClosingChild(code: number | null = 0) {
  const emitter = new EventEmitter();
  const child = Object.assign(emitter, {
    stdout: new PassThrough(),
    stderr: new PassThrough(),
  });
  queueMicrotask(() => emitter.emit("close", code));
  return child;
}

function line(obj: unknown): string {
  return JSON.stringify(obj) + "\n";
}

// One spawnFn stands in for every child process liveEdit() would otherwise
// spawn for real (claude, opencode, bun) - dispatched by bin/args so the
// whole integration (backend availability checks, the agent's own process,
// the style-check follow-up) can be driven end to end against fakes.
function makeFakeSpawn() {
  const claudeSpawns: { args: string[]; stdout: PassThrough }[] = [];
  const spawnFn = ((bin: string, args: string[] = []) => {
    if (args.includes("--version")) return makeClosingChild(0);
    if (bin === "claude") {
      const { child, stdout } = makeFakeChild();
      claudeSpawns.push({ args, stdout });
      return child;
    }
    if (bin === "opencode") return makeClosingChild(0);
    if (bin === "bun") return makeClosingChild(0);
    throw new Error(`unexpected spawn in test: ${bin} ${args.join(" ")}`);
  }) as any;
  return { spawnFn, claudeSpawns };
}

function makeReq(url: string, body: unknown): any {
  const bytes = Buffer.from(JSON.stringify(body));
  async function* gen() {
    yield bytes;
  }
  const req = gen() as any;
  req.method = "POST";
  req.url = url;
  req.on = () => {};
  return req;
}

function makeRes(): any {
  return {
    statusCode: 200,
    body: "",
    setHeader() {},
    end(data?: string) {
      if (data) this.body += data;
    },
  };
}

// Several of the routes under test do real (temp-dir) filesystem I/O
// (persistBackend/loadPersistedSessionId), not just microtask-resolved
// fakes, so waiting a fixed number of ticks is flaky - poll instead.
async function waitFor(
  predicate: () => boolean,
  timeoutMs = 2000,
): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error("waitFor() timed out");
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

test("switching to a backend used earlier resumes its persisted session instead of starting fresh", async () => {
  const root = await mkdtemp(join(tmpdir(), "live-edit-index-test-"));
  try {
    const tmpDir = join(root, ".tmp");
    await mkdir(tmpDir, { recursive: true });
    // Simulates a session id left over from a previous dev-server run on the
    // claude backend (agent.ts/index.ts's own persistSessionId() would have
    // written this).
    await writeFile(
      join(tmpDir, "live-edit-session-claude"),
      "sess-old-claude",
      "utf-8",
    );
    // Forces startup to pick opencode first, so switching to claude below
    // exercises the POST /__live-edit/backend path rather than the
    // astro:server:setup startup path (which already resumed correctly).
    await writeFile(join(tmpDir, "live-edit-backend"), "opencode", "utf-8");

    const { spawnFn, claudeSpawns } = makeFakeSpawn();
    const integration = liveEdit({ spawnFn });

    (integration.hooks["astro:config:setup"] as any)({
      config: { root: { pathname: root } },
      addDevToolbarApp: () => {},
    });

    let middleware: (req: any, res: any, next: () => void) => void;
    const server = {
      middlewares: { use: (fn: any) => (middleware = fn) },
      httpServer: { on: () => {} },
    };
    await (integration.hooks["astro:server:setup"] as any)({
      server,
      logger: { info: () => {}, warn: () => {}, error: () => {} },
    });

    // Switch from the startup-selected opencode backend to claude.
    const switchRes = makeRes();
    middleware!(
      makeReq("/__live-edit/backend", { backend: "claude" }),
      switchRes,
      () => {},
    );
    await waitFor(() => switchRes.body.length > 0);
    expect(JSON.parse(switchRes.body)).toEqual({ ok: true, backend: "claude" });

    // Drive a feedback request through so the adapter actually spawns its
    // child process, and inspect what args it was spawned with.
    const feedbackReq = makeReq("/__live-edit/request", {
      kind: "whole-note",
      files: ["docs/x.md"],
      comment: "tighten this",
    });
    const feedbackRes = makeRes();
    middleware!(feedbackReq, feedbackRes, () => {});
    await waitFor(() => claudeSpawns.length > 0);

    expect(claudeSpawns.length).toBe(1);
    expect(claudeSpawns[0].args).toContain("--resume");
    expect(claudeSpawns[0].args).toContain("sess-old-claude");
    expect(claudeSpawns[0].args).not.toContain("--session-id");

    // Let the turn finish cleanly (no proposal block -> item just errors)
    // instead of leaving the queue's drain() loop permanently awaiting.
    claudeSpawns[0].stdout.write(
      line({ type: "result", result: "no changes needed", is_error: false }),
    );
    await waitFor(() => feedbackRes.body.length > 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
