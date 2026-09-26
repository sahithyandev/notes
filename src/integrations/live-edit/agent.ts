import {
  spawn,
  type ChildProcess,
  type ChildProcessWithoutNullStreams,
} from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
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

// Shared constructor shape for every backend's adapter - see
// BACKEND_DEFINITIONS at the bottom of this file, the single place that
// wires a backend's CLI binary to its createAdapter(options: this).
export interface AgentAdapterOptions {
  cwd: string;
  model?: string;
  spawnFn?: typeof spawn;
  // A previously-persisted session id to resume instead of starting fresh
  // (e.g. after a dev-server restart).
  initialSessionId?: string;
  // Routed through index.ts to the Astro integration logger, so this
  // module's output (spawn events, the child's stderr, a bad exit code) is
  // timestamped and labeled the same as the rest of `astro dev`'s terminal
  // output, not a differently-formatted bare console.log. Defaults to
  // console.log/console.error for direct use outside that context (e.g.
  // this module's own tests).
  log?: (message: string) => void;
  logError?: (message: string) => void;
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

type Waiter = {
  resolve: (line: unknown) => void;
  reject: (err: Error) => void;
};

// A minimal async queue: handleLine() can push before anyone is waiting
// (e.g. several NDJSON lines arriving in one stdout chunk, faster than the
// consumer processes each yielded event), and nextLine() can wait before
// anything has arrived. Neither side drops data.
export class LineQueue {
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

  // Discards anything sitting in the buffer, returning it so the caller can
  // log it. A turn's send() always returns as soon as it sees its own
  // "result" line, but the underlying claude CLI can keep emitting lines
  // after that - observed directly: the Skill tool (in ALLOWED_TOOLS) can
  // itself dispatch a background subagent, whose belated completion arrives
  // as its own line(s) once the main reply's turn has already ended. With
  // nothing waiting at that point, those land here and would otherwise sit
  // until the *next* send() call, whose next() would hand them out first -
  // stale content (including a stray "result") getting mistaken for the
  // reply to a brand new prompt. Call this before writing a new prompt so
  // every turn starts from a clean buffer.
  drainStale(): unknown[] {
    if (this.buffered.length === 0) return [];
    const stale = this.buffered;
    this.buffered = [];
    return stale;
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

  constructor(opts: AgentAdapterOptions) {
    this.cwd = opts.cwd;
    this.model = opts.model;
    this.spawnFn = opts.spawnFn ?? spawn;
    this.sessionId = opts.initialSessionId ?? null;
    this.log = opts.log ?? ((m) => console.log(`[live-edit] ${m}`));
    this.logError = opts.logError ?? ((m) => console.error(`[live-edit] ${m}`));
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

    // Without this, a spawn failure (claude removed from PATH, EACCES, ...)
    // emits an unhandled "error" event - Node's default behavior for that is
    // to throw, crashing the whole `astro dev` process rather than just
    // failing this one turn. OpenCodeAdapter already handles this on both of
    // its spawns; this backend's long-lived child was missing the same.
    child.on("error", (err) => {
      if (this.child !== child) return;
      this.child = null;
      this.logError(`claude process failed to start: ${err.message}`);
      this.queue.failAll(
        new Error(`claude process failed to start: ${err.message}`),
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
      // Only a child that's already running could possibly have a stale
      // trailing line sitting in the queue (see drainStale()'s comment) - a
      // freshly-spawned one hasn't been sent anything yet, so anything
      // already queued for it is that child's own first real output, not
      // leftovers, and draining here would discard it out from under this
      // very turn.
      const isExistingChild = this.child !== null;
      const child = this.ensureChild();
      if (this.sessionId) {
        yield { type: "session", sessionId: this.sessionId };
      }

      if (isExistingChild) {
        const stale = this.queue.drainStale();
        if (stale.length > 0) {
          this.log(
            `discarding ${stale.length} stale line(s) left over from the previous turn (likely a background subagent finishing late)`,
          );
        }
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
        const event = mapLine(line, this.cwd);
        if (event) yield event;
        if (event?.type === "result") return;
      }
    } finally {
      this.busy = false;
    }
  }
}

function mapLine(line: unknown, cwd: string): AgentEvent | null {
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
          return { type: "progress", label: describeToolUse(b, cwd) };
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

// The progress label this returns is rendered inline in live-edit-bar.astro's
// fixed-position status strip (.le-item-status), with no width constraint of
// its own - a raw absolute path or a long bash command/grep pattern blows
// out that layout (observed directly: a real Claude turn's "Read: /Users/...
// /some-note.mdx" overflowed the whole dock). Shortening file_path to be
// relative to the project root fixes the common case; the length cap is a
// backstop for whatever's still too long after that (long commands/patterns
// have no such shortening available).
const PROGRESS_LABEL_MAX_LEN = 70;

function describeToolUse(block: Record<string, unknown>, cwd: string): string {
  const name = typeof block.name === "string" ? block.name : "tool";
  const input = block.input as Record<string, unknown> | undefined;
  const filePath = typeof input?.file_path === "string" ? input.file_path : "";
  const target =
    // Claude's own tool calls always give an absolute file_path; path.relative
    // treats a non-absolute `to` as relative to process.cwd() instead of
    // `cwd`, so only shorten it when it's actually absolute - anything else
    // is passed through as-is rather than mis-resolved.
    (filePath && (isAbsolute(filePath) ? relative(cwd, filePath) : filePath)) ||
    (typeof input?.pattern === "string" && input.pattern) ||
    (typeof input?.command === "string" && input.command) ||
    "";
  if (!target) return name;
  const label = `${name}: ${target}`;
  return label.length > PROGRESS_LABEL_MAX_LEN
    ? `${label.slice(0, PROGRESS_LABEL_MAX_LEN - 1)}…`
    : label;
}

// --- OpenCode backend -------------------------------------------------
//
// Used when the `claude` CLI isn't installed (or the developer picks it
// explicitly from the web UI when both are available). Mirrors
// ClaudeStreamAdapter's public shape (AgentAdapter) but not its internals:
// opencode's `run` command takes the message as an argv and persists
// conversation state server-side keyed by a --session id, rather than
// reading one message per line from a long-lived process's stdin. So each
// send() here spawns and exits its own one-shot `opencode run` process
// instead of feeding a shared child.
//
// It runs the default agent rather than a custom one: opencode's built-in
// free "opencode/*" models refuse (403) any session whose agent carries a
// `deny` permission entry (verified against 1.18.32), which a restricted
// live-edit agent necessarily would - so no custom agent means no hard
// tool restrictions. Tool discipline for opencode is instruction-only, the
// SYSTEM_PROMPT inlined into the first message of each session (see send()
// below), a weaker guard than ClaudeStreamAdapter's --allowedTools but the
// only one the free tier will serve.

const EXIT_MARKER = Symbol("opencode-process-exit");

interface ExitMarker {
  [EXIT_MARKER]: true;
  code: number | null;
  error?: Error;
}

function isExitMarker(value: unknown): value is ExitMarker {
  return typeof value === "object" && value !== null && EXIT_MARKER in value;
}

// `opencode run --format json`'s NDJSON stream isn't as fully documented
// as Claude's --output-format stream-json, but the event shapes the CLI
// actually emits (verified against 1.18.32) are a flat top-level `tool`
// event, the run command's `{ type: "tool_use", part: { type: "tool",
// ... } }` records, and the SSE-style "message.part.updated" event (part
// nested under `properties`). This recognizes all three and silently
// ignores anything else. A miss here only means a step doesn't show up in
// the "Working: ..." trail - it can never affect the final result, which
// always comes from `opencode export` instead (see exportResult() below).
function describeOpenCodeProgress(obj: Record<string, unknown>): string | null {
  const part =
    obj.type === "tool"
      ? obj
      : ((obj.part ??
          (obj.properties as Record<string, unknown> | undefined)?.part) as
          Record<string, unknown> | undefined);
  if (!part || part.type !== "tool") return null;

  const tool = typeof part.tool === "string" ? part.tool : "tool";
  const state = part.state as Record<string, unknown> | undefined;
  const input = state?.input as Record<string, unknown> | undefined;
  const target =
    (typeof input?.filePath === "string" && input.filePath) ||
    (typeof input?.file_path === "string" && input.file_path) ||
    (typeof input?.pattern === "string" && input.pattern) ||
    (typeof input?.command === "string" && input.command) ||
    "";
  return target ? `${tool}: ${target}` : tool;
}

// Reads back the final assistant reply via `opencode export` rather than
// trusting the run stream to carry it reliably: export's job is exactly
// "give me this session's messages", so it's a steadier source of truth
// than reverse-engineering an undocumented event stream. Its exact JSON
// shape isn't guaranteed by public docs either, so this accepts a couple
// of plausible shapes for the message list (a bare array, or one nested
// under "messages") instead of assuming one.
function parseExportedResult(
  data: unknown,
): Extract<AgentEvent, { type: "result" }> | null {
  const messages = Array.isArray(data)
    ? data
    : Array.isArray((data as Record<string, unknown> | null)?.messages)
      ? ((data as Record<string, unknown>).messages as unknown[])
      : null;
  if (!messages) return null;

  for (let i = messages.length - 1; i >= 0; i--) {
    const entry = messages[i] as Record<string, unknown>;
    const info = (entry.info ?? entry) as Record<string, unknown>;
    if (info?.role !== "assistant") continue;

    const error = info.error as Record<string, unknown> | undefined;
    if (error) {
      const errorData = error.data as Record<string, unknown> | undefined;
      return {
        type: "result",
        text:
          (typeof errorData?.message === "string" && errorData.message) ||
          "opencode reported an error",
        isError: true,
      };
    }

    const parts = Array.isArray(entry.parts) ? entry.parts : [];
    const text = parts
      .filter(
        (p): p is Record<string, unknown> =>
          typeof p === "object" &&
          p !== null &&
          (p as { type?: unknown }).type === "text",
      )
      .map((p) => (typeof p.text === "string" ? p.text : ""))
      .join("");

    return {
      type: "result",
      text,
      isError: false,
      costUsd: typeof info.cost === "number" ? info.cost : undefined,
    };
  }

  return null;
}

export class OpenCodeAdapter implements AgentAdapter {
  private readonly cwd: string;
  private readonly model: string | undefined;
  private readonly spawnFn: typeof spawn;
  private sessionId: string | null;
  private busy = false;
  private readonly log: (message: string) => void;
  private readonly logError: (message: string) => void;

  constructor(opts: AgentAdapterOptions) {
    this.cwd = opts.cwd;
    this.model = opts.model;
    this.spawnFn = opts.spawnFn ?? spawn;
    this.sessionId = opts.initialSessionId ?? null;
    this.log = opts.log ?? ((m) => console.log(`[live-edit] ${m}`));
    this.logError = opts.logError ?? ((m) => console.error(`[live-edit] ${m}`));
  }

  reset(): void {
    this.sessionId = null;
  }

  dispose(): void {
    // No persistent child to kill: every send() spawns and exits its own
    // one-shot `opencode run`.
  }

  async *send(prompt: string): AsyncIterable<AgentEvent> {
    if (this.busy) {
      throw new Error(
        "OpenCodeAdapter.send() called while a turn is already in flight",
      );
    }
    this.busy = true;
    try {
      const args = ["run", "--format", "json"];
      if (this.model) args.push("--model", this.model);
      if (this.sessionId) args.push("--session", this.sessionId);
      // No custom agent (the free tier refuses permission-scoped ones), so
      // the SYSTEM_PROMPT rides along in the first message of a session
      // instead. opencode persists every message server-side, so a resumed
      // session already carries it and re-inlining every turn would stack
      // copies into the conversation.
      args.push(this.sessionId ? prompt : `${SYSTEM_PROMPT}\n\n${prompt}`);

      this.log(
        `spawning opencode (${this.sessionId ? `resuming session ${this.sessionId.slice(0, 8)}` : "new session"}${this.model ? `, model ${this.model}` : ""})`,
      );

      const child = this.spawnFn("opencode", args, {
        cwd: this.cwd,
        stdio: ["ignore", "pipe", "pipe"],
      }) as ChildProcess;

      const queue = new LineQueue();
      const rl = readline.createInterface({ input: child.stdout! });
      rl.on("line", (line) => {
        if (!line.trim()) return;
        try {
          queue.push(JSON.parse(line));
        } catch {
          // opencode can print plain-text diagnostics on stdout too, not
          // just NDJSON - ignore anything that isn't valid JSON.
        }
      });

      let stderrBuf = "";
      child.stderr?.on("data", (d) => {
        stderrBuf += d.toString();
      });

      child.on("close", (code) => {
        const marker: ExitMarker = { [EXIT_MARKER]: true, code };
        queue.push(marker);
      });
      child.on("error", (err) => {
        const marker: ExitMarker = {
          [EXIT_MARKER]: true,
          code: null,
          error: err,
        };
        queue.push(marker);
      });

      let exitCode: number | null = null;
      let spawnError: Error | null = null;
      let sessionId = this.sessionId;

      while (true) {
        const raw = await queue.next();
        if (isExitMarker(raw)) {
          exitCode = raw.code;
          spawnError = raw.error ?? null;
          break;
        }
        const obj = raw as Record<string, unknown>;
        if (typeof obj?.sessionID === "string" && !sessionId) {
          sessionId = obj.sessionID;
          yield { type: "session", sessionId };
        }
        const progress = describeOpenCodeProgress(obj);
        if (progress) yield { type: "progress", label: progress };
      }

      if (spawnError) {
        yield { type: "process-error", message: spawnError.message };
        return;
      }

      if (!sessionId) {
        yield {
          type: "process-error",
          message:
            stderrBuf.trim() ||
            `opencode exited with code ${exitCode} before starting a session`,
        };
        return;
      }
      this.sessionId = sessionId;

      const result = await this.exportResult(sessionId);
      if (!result) {
        yield {
          type: "process-error",
          message:
            stderrBuf.trim() ||
            `opencode exited with code ${exitCode} and no result could be read back`,
        };
        return;
      }
      yield result;
    } finally {
      this.busy = false;
    }
  }

  private exportResult(
    sessionId: string,
  ): Promise<Extract<AgentEvent, { type: "result" }> | null> {
    return new Promise((resolvePromise) => {
      const child = this.spawnFn("opencode", ["export", sessionId], {
        cwd: this.cwd,
        stdio: ["ignore", "pipe", "pipe"],
      }) as ChildProcess;
      let out = "";
      child.stdout?.on("data", (d) => {
        out += d.toString();
      });
      child.on("error", () => resolvePromise(null));
      child.on("close", () => {
        try {
          resolvePromise(parseExportedResult(JSON.parse(out)));
        } catch (err) {
          this.logError(
            `failed to parse \`opencode export\` output: ${err instanceof Error ? err.message : String(err)}`,
          );
          resolvePromise(null);
        }
      });
    });
  }
}

// --- Debug backend -------------------------------------------------------
//
// Not a real agent - it never spawns a CLI or calls an LLM. It exists so
// the whole real request/queue/apply/UI pipeline (live-edit-bar.astro's
// status strip, live-edit.astro's inline marker, the style-check follow-up)
// can be exercised by hand from the actual UI, without spending a real
// agent turn on every manual test. Select "Debug" from the backend picker
// (shown automatically once this is registered below, alongside Claude
// Code/opencode) and drive it with magic words in the feedback comment:
//
//   "debug error"    -> ends in "error" (no proposal block in the reply)
//   "debug mismatch" -> ends in "error" via the apply-mismatch retry path
//                        (the proposed "old" text never matches the file)
//   anything else     -> ends in "applied": appends a debug marker comment
//                        at the end of the target file
//
// buildRequestMessage() (prompt.ts) always lists the target file(s) as
// either "File: <path>" (a selection request) or "- <path>" lines (a
// whole-note request); buildMismatchMessage()/the style-check follow-up
// (index.ts) instead say "In <file>:" or "# <file>". extractFiles() tries
// each shape in turn (most specific first) rather than one loose "- " match
// - a bare "- " match alone also catches buildMismatchMessage()'s own
// `- "<old>" was found N time(s)` detail lines, which happen to start the
// same way and would get misread as a file path.
function extractFiles(prompt: string): string[] {
  const single = prompt.match(/^File: (.+)$/m);
  if (single) return [single[1].trim()];

  const inLines = [...prompt.matchAll(/^In (.+):$/gm)].map((m) => m[1].trim());
  if (inLines.length > 0) return inLines;

  const hashLines = [...prompt.matchAll(/^# (.+)$/gm)].map((m) => m[1].trim());
  if (hashLines.length > 0) return hashLines;

  return [...prompt.matchAll(/^- (.+)$/gm)].map((m) => m[1].trim());
}

function extractComment(prompt: string): string {
  const idx = prompt.indexOf("Feedback:");
  return idx === -1 ? prompt : prompt.slice(idx + "Feedback:".length).trim();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

// Deliberately never matches any real file content, so proposing it as an
// "old" string always fails proposal.ts's exactly-once check.
const FORCE_MISMATCH_MARKER = "__debug_force_mismatch__";

function buildProposalReply(
  summary: string,
  file: string,
  old: string,
  next: string,
): string {
  const proposal = {
    summary,
    changes: [{ file, edits: [{ old, new: next }] }],
  };
  return `${summary}\n\n\`\`\`json\n${JSON.stringify(proposal, null, 2)}\n\`\`\`\n`;
}

export class DebugAdapter implements AgentAdapter {
  private readonly cwd: string;
  private sessionId: string;

  constructor(opts: AgentAdapterOptions) {
    this.cwd = opts.cwd;
    this.sessionId = opts.initialSessionId ?? randomUUID();
  }

  reset(): void {
    this.sessionId = randomUUID();
  }

  dispose(): void {
    // No process, nothing to kill.
  }

  async *send(prompt: string): AsyncIterable<AgentEvent> {
    yield { type: "session", sessionId: this.sessionId };

    await delay(400);
    yield { type: "progress", label: "Reading file..." };
    await delay(400);
    yield { type: "progress", label: "Drafting edit..." };
    await delay(400);

    const comment = extractComment(prompt).toLowerCase();
    const files = extractFiles(prompt);
    const file = files[0];

    if (comment.includes("debug error")) {
      yield {
        type: "result",
        text: 'Debug backend: forced error (no proposal block, matching a real "I\'m not confident" reply).',
        isError: false,
      };
      return;
    }

    if (!file) {
      yield {
        type: "result",
        text: "Debug backend: couldn't find a target file in the request.",
        isError: true,
      };
      return;
    }

    // buildMismatchMessage() (prompt.ts, called from index.ts's
    // applyChanges()) quotes the failed "old" text back in its retry
    // prompt - `- "<old>" was found N time(s)` - rather than repeating the
    // original comment, so a plain comment.includes("debug mismatch")
    // check would only see the trigger on the first turn and silently
    // succeed via the default branch on the retry, never reaching
    // index.ts's real "already retried once -> permanent error" path.
    // Checking for the marker itself in the whole prompt (not just the
    // comment) means the retry turn recognizes its own quoted-back old
    // text and keeps forcing a mismatch, exactly like a real repeatedly-
    // wrong proposal would.
    if (
      comment.includes("debug mismatch") ||
      prompt.includes(FORCE_MISMATCH_MARKER)
    ) {
      yield {
        type: "result",
        text: buildProposalReply(
          "Debug: forced apply mismatch.",
          file,
          FORCE_MISMATCH_MARKER,
          "replacement text that will never get written",
        ),
        isError: false,
      };
      return;
    }

    let content: string;
    try {
      content = await readFile(resolve(this.cwd, file), "utf-8");
      if (!content) throw new Error("file is empty");
    } catch (err) {
      yield {
        type: "result",
        text: `Debug backend: couldn't read ${file}: ${err instanceof Error ? err.message : String(err)}`,
        isError: true,
      };
      return;
    }

    // Anchors on the whole file content, not just a line from it: a line
    // like a frontmatter "---" can occur more than once, which would fail
    // proposal.ts's exactly-once check. The full content is trivially
    // unique against itself.
    yield {
      type: "result",
      text: buildProposalReply(
        `Debug: appended a marker line at the end of ${file}.`,
        file,
        content,
        `${content}\n[debug edit ${new Date().toISOString()}]\n`,
      ),
      isError: false,
    };
  }
}

// --- Backend registry ---------------------------------------------------
//
// The single place that lists every backend live-edit can drive: its CLI
// binary (checked with `<bin> --version` at server startup, and what gets
// spawned) and how to build its adapter. index.ts drives availability
// detection, backend selection/persistence, and the web UI's picker
// entirely off this list - none of it names "claude" or "opencode"
// directly. Adding a provider means writing its AgentAdapter above and
// adding one entry here; nothing else in this file or index.ts changes.
export interface BackendReadiness {
  available: boolean;
  reason?: string;
}

export interface BackendDefinition {
  id: string;
  // Shown in the web UI's backend picker and in server log lines.
  label: string;
  bin: string;
  createAdapter(opts: AgentAdapterOptions): AgentAdapter;
  // Whether this backend can actually complete a turn right now - always
  // present (every backend needs at least "the CLI runs"; see readyIf()
  // below), so callers never special-case backends with nothing extra to
  // check.
  checkReady(spawnFn: typeof spawn): Promise<BackendReadiness>;
}

// Generic: spawn `bin args...`, capture combined stdout+stderr as text,
// resolve once the process exits (or fails to spawn at all). The one
// primitive every backend's readiness check is built from, so each check
// only has to say what to spawn and what to look for in the output - not
// how to wire up a child process.
function runCliCapture(
  spawnFn: typeof spawn,
  bin: string,
  args: string[],
): Promise<{ code: number | null; output: string; spawnError?: Error }> {
  return new Promise((resolvePromise) => {
    const child = spawnFn(bin, args, {
      stdio: ["ignore", "pipe", "pipe"],
    }) as ChildProcess;
    let output = "";
    child.stdout?.on("data", (d) => (output += d.toString()));
    child.stderr?.on("data", (d) => (output += d.toString()));
    child.on("error", (err) =>
      resolvePromise({ code: null, output, spawnError: err }),
    );
    child.on("close", (code) => resolvePromise({ code, output }));
  });
}

// Base readiness for any backend: can `<bin> --version` actually run?
// readyIf() below chains an extra, backend-specific check after this one
// for a backend where that alone isn't enough (e.g. opencode also needs a
// configured provider).
function checkCliVersion(
  bin: string,
  spawnFn: typeof spawn,
): Promise<BackendReadiness> {
  return runCliCapture(spawnFn, bin, ["--version"]).then(
    ({ code, spawnError }) => {
      if (spawnError) {
        const err = spawnError as NodeJS.ErrnoException;
        return {
          available: false,
          reason:
            err.code === "ENOENT"
              ? `the \`${bin}\` CLI is not installed or not on PATH`
              : `failed to run \`${bin}\`: ${err.message}`,
        };
      }
      return code === 0
        ? { available: true }
        : {
            available: false,
            reason: `\`${bin} --version\` exited with code ${code}`,
          };
    },
  );
}

// Builds a checkReady for BACKEND_DEFINITIONS: the CLI must run, and (if
// given) an extra check must also pass - it only ever runs once the CLI
// check already succeeded, so it never has to handle "the CLI is missing"
// itself.
function readyIf(
  bin: string,
  extra?: (spawnFn: typeof spawn) => Promise<BackendReadiness>,
) {
  return async (spawnFn: typeof spawn): Promise<BackendReadiness> => {
    const cli = await checkCliVersion(bin, spawnFn);
    if (!cli.available || !extra) return cli;
    return extra(spawnFn);
  };
}

export const BACKEND_DEFINITIONS = [
  {
    id: "claude",
    label: "Claude Code",
    bin: "claude",
    createAdapter: (opts: AgentAdapterOptions): AgentAdapter =>
      new ClaudeStreamAdapter(opts),
    checkReady: readyIf("claude"),
  },
  {
    id: "opencode",
    label: "opencode",
    bin: "opencode",
    createAdapter: (opts: AgentAdapterOptions): AgentAdapter =>
      new OpenCodeAdapter(opts),
    // The free "opencode/*" tier answers a plain run (no custom agent, no
    // deny permissions), so the CLI running is enough - no credential check.
    checkReady: readyIf("opencode"),
  },
  {
    id: "debug",
    label: "Debug",
    bin: "",
    createAdapter: (opts: AgentAdapterOptions): AgentAdapter =>
      new DebugAdapter(opts),
    // No CLI, nothing to spawn - always available, so it always shows up
    // in the backend picker alongside Claude Code/opencode for manually
    // testing the UI without spending a real agent turn.
    checkReady: async () => ({ available: true }),
  },
] as const satisfies readonly BackendDefinition[];

export type Backend = (typeof BACKEND_DEFINITIONS)[number]["id"];
