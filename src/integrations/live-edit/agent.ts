import {
  spawn,
  type ChildProcess,
  type ChildProcessWithoutNullStreams,
} from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
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

const OPENCODE_AGENT_NAME = "live-edit";

// Written once per process, before the first opencode spawn, rather than
// checked into the repo: this keeps the agent's system prompt and tool
// restrictions derived from the single source of truth (SYSTEM_PROMPT,
// shared with the Claude backend) instead of a hand-maintained duplicate
// that can drift. Frontmatter schema: https://opencode.ai/docs/agent.
// "edit"/"bash"/"webfetch" are both excluded from `tools` *and* explicitly
// denied under `permission` - belt and suspenders, mirroring the Bash
// lesson from ClaudeStreamAdapter above (a tool being merely "not listed"
// isn't the same as it being refused).
async function ensureOpenCodeAgentConfig(cwd: string): Promise<void> {
  const dir = join(cwd, ".opencode", "agent");
  await mkdir(dir, { recursive: true });
  const frontmatter = [
    "---",
    "description: Headless notes-editing feedback agent for the live-edit dev integration (auto-generated, do not edit by hand)",
    "mode: primary",
    "tools:",
    "  read: true",
    "  glob: true",
    "  grep: true",
    "  skill: true",
    "  bash: false",
    "  edit: false",
    "  webfetch: false",
    "  task: false",
    "  todowrite: false",
    "  websearch: false",
    "  lsp: false",
    "permission:",
    "  edit: deny",
    "  bash: deny",
    "  webfetch: deny",
    "---",
    "",
  ].join("\n");
  await writeFile(
    join(dir, `${OPENCODE_AGENT_NAME}.md`),
    frontmatter + SYSTEM_PROMPT + "\n",
    "utf-8",
  );
}

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
// as Claude's --output-format stream-json, so this only recognizes the
// couple of tool-progress shapes plausible from opencode's own SDK types
// (a flat top-level "tool" event, and the SSE-style "message.part.updated"
// event carrying a nested tool part) and silently ignores anything else. A
// miss here only means a step doesn't show up in the "Working: ..." trail
// - it can never affect the final result, which always comes from
// `opencode export` instead (see exportResult() below).
function describeOpenCodeProgress(obj: Record<string, unknown>): string | null {
  const part =
    obj.type === "tool"
      ? obj
      : obj.type === "message.part.updated"
        ? ((obj.properties as Record<string, unknown> | undefined)?.part as
            Record<string, unknown> | undefined)
        : undefined;
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
  private agentConfigReady: Promise<void> | null = null;
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
      if (!this.agentConfigReady) {
        this.agentConfigReady = ensureOpenCodeAgentConfig(this.cwd);
      }
      await this.agentConfigReady;

      const args = ["run", "--format", "json", "--agent", OPENCODE_AGENT_NAME];
      if (this.model) args.push("--model", this.model);
      if (this.sessionId) args.push("--session", this.sessionId);
      args.push(prompt);

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

// opencode being installed isn't enough on its own: without at least one
// configured provider/credential, every `opencode run` just fails, and
// opencode's own free "opencode/*" models are blocked entirely for
// headless use regardless (verified - see the OpenCodeAdapter comment
// above). `opencode providers list` has no --format json, only a
// human-readable "N credentials" summary, so this greps for that count
// rather than parsing a richer structure that doesn't exist.
export function checkOpenCodeHasProvider(
  spawnFn: typeof spawn,
): Promise<BackendReadiness> {
  return runCliCapture(spawnFn, "opencode", ["providers", "list"]).then(
    ({ output, spawnError }) => {
      if (spawnError) {
        return {
          available: false,
          reason: `failed to run \`opencode providers list\`: ${spawnError.message}`,
        };
      }
      const match = output.match(/(\d+)\s+credentials?/i);
      const count = match ? parseInt(match[1], 10) : 0;
      return count > 0
        ? { available: true }
        : {
            available: false,
            reason:
              "no opencode provider is configured (run `opencode providers login`)",
          };
    },
  );
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
    checkReady: readyIf("opencode", checkOpenCodeHasProvider),
  },
] as const satisfies readonly BackendDefinition[];

export type Backend = (typeof BACKEND_DEFINITIONS)[number]["id"];
