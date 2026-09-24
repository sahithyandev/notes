import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { randomUUID } from "node:crypto";
import readline from "node:readline";
import { SYSTEM_PROMPT } from "./prompt.ts";

export type AgentEvent =
  | { type: "session"; sessionId: string }
  | { type: "progress"; label: string }
  | { type: "result"; text: string; isError: boolean; costUsd?: number }
  | { type: "process-error"; message: string };

export interface AgentAdapter {
  send(prompt: string): AsyncIterable<AgentEvent>;
  // Drops the running process and its session, so the next send() starts a
  // brand-new conversation instead of resuming.
  reset(): void;
  dispose(): void;
}

// Bash is intentionally absent from ALLOWED_TOOLS and explicit in
// DISALLOWED_TOOLS: verified (via a raw stream-json probe against the
// `claude` CLI, 2.1.281) that a scoped pattern like
// "Bash(bun run check-notes-style*)" in --allowedTools does NOT actually
// restrict Bash to that command - it grants Bash access outright in
// headless/print mode, with the pattern silently unenforced (permission
// engine's per-command scoping is a settings.json/interactive-approval
// feature, not something --allowedTools honors here). The relay itself
// already runs check-notes-style as a follow-up after every apply
// (index.ts's runStyleCheckFollowup), so the agent never actually needed
// direct Bash access for that.
const ALLOWED_TOOLS = ["Read", "Glob", "Grep", "Skill"];
const DISALLOWED_TOOLS = ["Bash", "Edit", "Write", "MultiEdit", "NotebookEdit"];

export interface ClaudeStreamAdapterOptions {
  cwd: string;
  model?: string;
  spawnFn?: typeof spawn;
  // A previously-persisted session id to resume instead of starting fresh
  // (e.g. after a dev-server restart).
  initialSessionId?: string;
  // Routed through index.ts to the Astro integration logger, so this
  // module's output (spawn events, the claude child's stderr, a bad exit
  // code) is timestamped and labeled the same as the rest of `astro dev`'s
  // terminal output, not a differently-formatted bare console.log. Defaults
  // to console.log/console.error for direct use outside that context (e.g.
  // this module's own tests).
  log?: (message: string) => void;
  logError?: (message: string) => void;
}

type Waiter = {
  resolve: (line: unknown) => void;
  reject: (err: Error) => void;
};

// A minimal async queue: handleLine() can push before anyone is waiting
// (e.g. several NDJSON lines arriving in one stdout chunk, faster than the
// consumer processes each yielded event), and nextLine() can wait before
// anything has arrived. Neither side drops data.
class LineQueue {
  private buffered: unknown[] = [];
  private waiter: Waiter | null = null;

  push(line: unknown): void {
    if (this.waiter) {
      const w = this.waiter;
      this.waiter = null;
      w.resolve(line);
    } else {
      this.buffered.push(line);
    }
  }

  failAll(err: Error): void {
    if (this.waiter) {
      const w = this.waiter;
      this.waiter = null;
      w.reject(err);
    }
  }

  next(): Promise<unknown> {
    if (this.buffered.length > 0) {
      return Promise.resolve(this.buffered.shift());
    }
    return new Promise((resolve, reject) => {
      this.waiter = { resolve, reject };
    });
  }
}

// Runs one long-lived `claude -p --input-format stream-json --output-format
// stream-json` process and feeds it one user message per send() call over
// its stdin, so the conversation (and prompt cache) is shared across
// requests instead of rebuilt from scratch every time. Verified against
// claude-code 2.1.281: the process stays alive across multiple `result`
// events as long as stdin isn't closed, and each `result` line ends a turn.
export class ClaudeStreamAdapter implements AgentAdapter {
  private readonly cwd: string;
  private readonly model: string | undefined;
  private readonly spawnFn: typeof spawn;

  private child: ChildProcessWithoutNullStreams | null = null;
  private sessionId: string | null = null;
  private busy = false;
  private queue = new LineQueue();
  private readonly log: (message: string) => void;
  private readonly logError: (message: string) => void;

  constructor(opts: ClaudeStreamAdapterOptions) {
    this.cwd = opts.cwd;
    this.model = opts.model;
    this.spawnFn = opts.spawnFn ?? spawn;
    this.sessionId = opts.initialSessionId ?? null;
    this.log = opts.log ?? ((m) => console.log(`[edit-feedback] ${m}`));
    this.logError =
      opts.logError ?? ((m) => console.error(`[edit-feedback] ${m}`));
  }

  reset(): void {
    this.killChild();
    this.sessionId = null;
  }

  dispose(): void {
    this.killChild();
  }

  private killChild(): void {
    if (this.child && !this.child.killed) {
      this.child.kill();
    }
    this.child = null;
    // Fail any turn waiting on this child synchronously, rather than
    // relying on its (async, possibly delayed) "exit" event: that event's
    // handler is guarded against firing for a child this method has
    // already superseded (see ensureChild()), so it alone can't be counted
    // on to unblock a turn reset()/dispose() interrupts mid-flight.
    this.queue.failAll(new Error("claude process was reset"));
  }

  private ensureChild(): ChildProcessWithoutNullStreams {
    if (this.child) return this.child;

    const args = [
      "-p",
      "--input-format",
      "stream-json",
      "--output-format",
      "stream-json",
      "--verbose",
    ];
    args.push("--permission-mode", "default");
    args.push("--allowedTools", ...ALLOWED_TOOLS);
    args.push("--disallowedTools", ...DISALLOWED_TOOLS);
    args.push("--append-system-prompt", SYSTEM_PROMPT);
    if (this.model) args.push("--model", this.model);

    let resuming = false;
    if (this.sessionId) {
      resuming = true;
      args.push("--resume", this.sessionId);
    } else {
      this.sessionId = randomUUID();
      args.push("--session-id", this.sessionId);
    }

    this.log(
      `spawning claude (${resuming ? "resuming" : "new"} session ${this.sessionId.slice(0, 8)}${this.model ? `, model ${this.model}` : ""})`,
    );

    const child = this.spawnFn("claude", args, {
      cwd: this.cwd,
      stdio: ["pipe", "pipe", "pipe"],
    }) as ChildProcessWithoutNullStreams;

    const rl = readline.createInterface({ input: child.stdout });
    rl.on("line", (line) => {
      // Guards against a stale event from a child that reset()/a respawn
      // has already superseded: without this, a delayed line or exit from
      // the old process (e.g. its kill() signal still in flight when a new
      // turn spawns a replacement) would land on `this.queue`, which is
      // shared across respawns, and corrupt the new child's turn.
      if (this.child !== child) return;
      if (!line.trim()) return;
      let obj: unknown;
      try {
        obj = JSON.parse(line);
      } catch {
        return;
      }
      this.queue.push(obj);
    });

    child.stderr.on("data", (data) => {
      if (this.child !== child) return;
      // Surfaced to the terminal so a setup problem (claude not on PATH,
      // an auth error, a bad flag) is visible immediately rather than only
      // as a generic "process exited unexpectedly" on the next turn.
      for (const line of data.toString().split("\n")) {
        if (line.trim()) this.logError(`claude: ${line}`);
      }
    });

    child.on("exit", (code) => {
      if (this.child !== child) return;
      this.child = null;
      if (code !== 0) {
        this.logError(`claude process exited with code ${code}`);
      }
      this.queue.failAll(
        new Error(`claude process exited unexpectedly (code ${code})`),
      );
    });

    this.child = child;
    return child;
  }

  async *send(prompt: string): AsyncIterable<AgentEvent> {
    if (this.busy) {
      throw new Error(
        "ClaudeStreamAdapter.send() called while a turn is already in flight",
      );
    }
    this.busy = true;
    try {
      const child = this.ensureChild();
      if (this.sessionId) {
        yield { type: "session", sessionId: this.sessionId };
      }

      child.stdin.write(
        JSON.stringify({
          type: "user",
          message: { role: "user", content: [{ type: "text", text: prompt }] },
        }) + "\n",
      );

      while (true) {
        let line: unknown;
        try {
          line = await this.queue.next();
        } catch (err) {
          yield {
            type: "process-error",
            message: err instanceof Error ? err.message : String(err),
          };
          return;
        }
        const event = mapLine(line);
        if (event) yield event;
        if (event?.type === "result") return;
      }
    } finally {
      this.busy = false;
    }
  }
}

function mapLine(line: unknown): AgentEvent | null {
  if (typeof line !== "object" || line === null) return null;
  const obj = line as Record<string, unknown>;

  if (obj.type === "system" && obj.subtype === "init") {
    const sessionId = obj.session_id;
    if (typeof sessionId === "string") {
      return { type: "session", sessionId };
    }
    return null;
  }

  if (obj.type === "assistant") {
    const message = obj.message as { content?: unknown[] } | undefined;
    const content = message?.content;
    if (Array.isArray(content)) {
      for (const block of content) {
        const b = block as Record<string, unknown>;
        if (b.type === "tool_use") {
          return { type: "progress", label: describeToolUse(b) };
        }
      }
    }
    return null;
  }

  if (obj.type === "result") {
    return {
      type: "result",
      text: typeof obj.result === "string" ? obj.result : "",
      isError: obj.is_error === true,
      costUsd:
        typeof obj.total_cost_usd === "number" ? obj.total_cost_usd : undefined,
    };
  }

  return null;
}

function describeToolUse(block: Record<string, unknown>): string {
  const name = typeof block.name === "string" ? block.name : "tool";
  const input = block.input as Record<string, unknown> | undefined;
  const target =
    (typeof input?.file_path === "string" && input.file_path) ||
    (typeof input?.pattern === "string" && input.pattern) ||
    (typeof input?.command === "string" && input.command) ||
    "";
  return target ? `${name}: ${target}` : name;
}
