import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname, join, relative } from "node:path";
import { spawn } from "node:child_process";
import type { AstroIntegration, AstroIntegrationLogger } from "astro";
import type { ViteDevServer } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  BACKEND_DEFINITIONS,
  type AgentAdapter,
  type AgentEvent,
  type Backend,
} from "./agent.ts";
import {
  buildRequestMessage,
  buildMismatchMessage,
  type FeedbackRequest,
} from "./prompt.ts";
import {
  parseProposal,
  ProposalParseError,
  applyProposal,
  PathOutsideDocsError,
  type FileChange,
} from "./proposal.ts";
import { scanFiles } from "../notes-style-validator/scan.ts";

// No "proposed" (edits apply automatically, no review step - see
// applyChanges() below) and no "discarded" (nothing left to discard once
// there's no approval step to discard out of).
export type ItemStatus = "queued" | "running" | "error" | "applied";

export interface FeedbackItem {
  id: string;
  kind: "selection" | "whole-note";
  // Target file(s), relative to the repo root (e.g. "docs/s1/foo.md").
  // One entry for a selection-based item; one or more for a whole-note item.
  files: string[];
  selection?: string;
  heading?: string;
  comment: string;
  status: ItemStatus;
  progress: string[];
  agentReply?: string;
  summary?: string;
  changes?: FileChange[];
  error?: string;
  createdAt: number;
  updatedAt: number;
  mismatchRetried?: boolean;
}

interface Job {
  itemId: string;
  message: string;
}

// The first entry in BACKEND_DEFINITIONS (agent.ts) is tried first when
// nothing has been explicitly picked yet (see pickInitialBackend() below) -
// that's currently "claude", simply because it's the backend this
// integration originally shipped with, not a judgment about quality.
function sessionFileName(backend: Backend): string {
  return `live-edit-session-${backend}`;
}
const BACKEND_FILE = "live-edit-backend";

// A plain pencil, for the dev toolbar's app icon (toolbar-app.ts).
const PENCIL_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M3 21v-3.75L14.81 5.44a1.5 1.5 0 0 1 2.12 0l1.63 1.63a1.5 1.5 0 0 1 0 2.12L6.75 21H3Zm2-2h1l10.5-10.5-1-1L5 18v1Zm12.9-12.9 1-1-1.63-1.63-1 1 1.63 1.63Z"/></svg>';

// A small in-process store + single-worker queue backing the dev-only
// "select text, get an edit" feedback loop (plus a site-wide whole-note /
// multi-note variant for merges). Turns run one at a time against one
// long-lived `claude -p --input-format stream-json` process (agent.ts), so
// prompt cache and conversation context are shared across requests. A
// proper AstroIntegration (not a raw Vite plugin) so `astro:server:setup`
// gives us an AstroIntegrationLogger - the terminal output this produces
// then matches the rest of `astro dev`'s output (timestamped, labeled
// "live-edit"), the same as module-redirects and notes-style-validator.
// spawnFn defaults to the real node:child_process spawn; overridable so
// tests can drive the whole integration (backend availability checks, the
// agent's own child process, the style-check follow-up) against fakes
// instead of real `claude`/`opencode`/`bun` processes, mirroring
// AgentAdapterOptions.spawnFn in agent.ts.
export default function liveEdit(
  opts: { spawnFn?: typeof spawn } = {},
): AstroIntegration {
  const spawnFn = opts.spawnFn ?? spawn;
  let root = process.cwd();
  let docsRoot = join(root, "docs");
  let tmpDir = join(root, ".tmp");
  let logger: AstroIntegrationLogger | null = null;

  const items = new Map<string, FeedbackItem>();
  const clients = new Set<ServerResponse>();
  const queue: Job[] = [];
  let draining = false;
  let adapter: AgentAdapter | null = null;
  // Live Edit works with either the `claude` or `opencode` CLI (agent.ts
  // spawns one directly, chosen by selectedBackend below), so a dev
  // environment with neither on PATH can't run this feature at all.
  // Checked once at server startup rather than per-request, and surfaced
  // to the frontend via GET /__live-edit/status so the widgets can show a
  // disabled message (or a backend picker, once more than one is
  // available) instead of silently failing on first use.
  interface AvailabilityStatus {
    available: boolean;
    reason?: string;
  }
  let backendAvailability: Record<Backend, AvailabilityStatus> =
    Object.fromEntries(
      BACKEND_DEFINITIONS.map((def) => [def.id, { available: true }]),
    ) as Record<Backend, AvailabilityStatus>;
  // null only when no backend is available.
  let selectedBackend: Backend | null = null;

  // Every backend's full readiness check (CLI present, plus whatever else
  // it needs - see BACKEND_DEFINITIONS/readyIf() in agent.ts) lives on its
  // definition, so this just runs each one; nothing here is backend-
  // specific.
  async function detectBackendAvailability(): Promise<
    Record<Backend, AvailabilityStatus>
  > {
    const entries = await Promise.all(
      BACKEND_DEFINITIONS.map(
        async (def) => [def.id, await def.checkReady(spawnFn)] as const,
      ),
    );
    return Object.fromEntries(entries) as Record<Backend, AvailabilityStatus>;
  }

  // Prefers a persisted developer choice (from a previous POST
  // /__live-edit/backend) as long as that backend is still available;
  // otherwise falls back to whichever backend is actually installed
  // (matching "when claude isn't installed, opencode is used instead"),
  // preferring BACKEND_DEFINITIONS' order when several are and nothing's
  // been chosen yet. Returns null only when none is available.
  function pickInitialBackend(persisted: Backend | undefined): Backend | null {
    if (persisted && backendAvailability[persisted].available) {
      return persisted;
    }
    const def = BACKEND_DEFINITIONS.find(
      (d) => backendAvailability[d.id].available,
    );
    return def?.id ?? null;
  }

  function log(item: FeedbackItem, message: string): void {
    const label = item.files.join(", ");
    logger?.info(`${item.id.slice(0, 8)} ${label}: ${message}`);
  }

  // Each backend keeps its own adapter instance and session, so switching
  // back and forth (via POST /__live-edit/backend) doesn't lose either
  // conversation - only the currently-selected one is ever live, the other
  // just sits idle until picked again.
  function getAdapter(initialSessionId?: string): AgentAdapter {
    if (!selectedBackend) {
      throw new Error("getAdapter() called with no backend available");
    }
    if (!adapter) {
      const def = BACKEND_DEFINITIONS.find((d) => d.id === selectedBackend)!;
      adapter = def.createAdapter({
        cwd: root,
        model: process.env.LIVE_EDIT_MODEL,
        initialSessionId,
        spawnFn,
        log: (m: string) => logger?.info(m),
        logError: (m: string) => logger?.error(m),
      });
    }
    return adapter;
  }

  async function loadPersistedSessionId(
    backend: Backend,
  ): Promise<string | undefined> {
    try {
      const raw = await readFile(
        join(tmpDir, sessionFileName(backend)),
        "utf-8",
      );
      const id = raw.trim();
      return id.length > 0 ? id : undefined;
    } catch {
      return undefined;
    }
  }

  async function persistSessionId(backend: Backend, id: string): Promise<void> {
    try {
      await mkdir(tmpDir, { recursive: true });
      await writeFile(join(tmpDir, sessionFileName(backend)), id, "utf-8");
    } catch {
      // Best-effort only: losing this just means the next dev-server start
      // begins a fresh session instead of resuming.
    }
  }

  async function loadPersistedBackend(): Promise<Backend | undefined> {
    try {
      const raw = (await readFile(join(tmpDir, BACKEND_FILE), "utf-8")).trim();
      return BACKEND_DEFINITIONS.some((d) => d.id === raw)
        ? (raw as Backend)
        : undefined;
    } catch {
      return undefined;
    }
  }

  async function persistBackend(backend: Backend): Promise<void> {
    try {
      await mkdir(tmpDir, { recursive: true });
      await writeFile(join(tmpDir, BACKEND_FILE), backend, "utf-8");
    } catch {
      // Best-effort only.
    }
  }

  function broadcast(item: FeedbackItem): void {
    const payload = `data: ${JSON.stringify({ type: "item", item })}\n\n`;
    for (const res of clients) res.write(payload);
  }

  function touch(item: FeedbackItem): void {
    item.updatedAt = Date.now();
    broadcast(item);
  }

  function enqueue(job: Job): void {
    queue.push(job);
    void drain();
  }

  async function drain(): Promise<void> {
    if (draining) return;
    draining = true;
    try {
      while (queue.length > 0) {
        const job = queue.shift()!;
        await runJob(job);
      }
    } finally {
      draining = false;
    }
  }

  async function runJob(job: Job): Promise<void> {
    const item = items.get(job.itemId);
    if (!item) return;

    item.status = "running";
    item.progress = [];
    touch(item);
    log(item, `running: ${job.message.split("\n")[0].slice(0, 120)}`);

    const agent = getAdapter();

    let events: AsyncIterable<AgentEvent>;
    try {
      events = agent.send(job.message);
    } catch (err) {
      item.status = "error";
      item.error = err instanceof Error ? err.message : String(err);
      touch(item);
      log(item, `error: ${item.error}`);
      return;
    }

    try {
      for await (const evt of events) {
        if (evt.type === "session") {
          if (selectedBackend)
            void persistSessionId(selectedBackend, evt.sessionId);
        } else if (evt.type === "progress") {
          item.progress.push(evt.label);
          touch(item);
          log(item, evt.label);
        } else if (evt.type === "process-error") {
          item.status = "error";
          item.error = evt.message;
          touch(item);
          log(item, `error: ${evt.message}`);
        } else if (evt.type === "result") {
          item.agentReply = evt.text;
          if (evt.isError) {
            item.status = "error";
            item.error = evt.text;
            log(item, `error: ${evt.text.slice(0, 200)}`);
          } else {
            await handleResult(item, evt.text);
          }
          touch(item);
        }
      }
    } catch (err) {
      item.status = "error";
      item.error = err instanceof Error ? err.message : String(err);
      touch(item);
      log(item, `error: ${item.error}`);
    }
  }

  // Parses the agent's reply and, if it holds a valid proposal, applies its
  // edits immediately - no review step, no approval click. Deletions are
  // never applied at all (see applyChanges() below): if the proposal still
  // includes any (the system prompt tells the agent not to, but a resumed
  // session can be running an older cached prompt - see the note on
  // session resumption in CLAUDE.md), they're logged and otherwise
  // ignored, not executed.
  async function handleResult(item: FeedbackItem, text: string): Promise<void> {
    let proposal;
    try {
      proposal = parseProposal(text);
    } catch (err) {
      item.status = "error";
      item.error =
        err instanceof ProposalParseError
          ? `No edit proposed. Agent said: ${text.trim().slice(0, 2000)}`
          : err instanceof Error
            ? err.message
            : String(err);
      log(item, `no edit proposed: ${item.error.slice(0, 200)}`);
      return;
    }

    item.summary = proposal.summary;
    item.changes = proposal.changes;
    item.error = undefined;
    log(item, `proposed: ${proposal.summary}`);

    if (proposal.deletions.length > 0) {
      log(
        item,
        `ignoring ${proposal.deletions.length} proposed deletion(s) - deletions are never auto-applied`,
      );
    }

    await applyChanges(item, proposal.changes);
  }

  // Writes every edit straight to disk. Takes `changes` explicitly (not
  // `item.changes`) since the mismatch-retry path below calls back in with
  // the same array rather than re-reading it off the item.
  async function applyChanges(
    item: FeedbackItem,
    changes: FileChange[],
  ): Promise<void> {
    let result;
    try {
      result = await applyProposal(docsRoot, changes, []);
    } catch (err) {
      if (err instanceof PathOutsideDocsError) {
        item.status = "error";
        item.error = err.message;
        log(item, `error: ${err.message}`);
        return;
      }
      throw err;
    }

    if (!result.ok) {
      if (item.mismatchRetried) {
        item.status = "error";
        item.error = result.fileMismatches
          .map(
            (fm) =>
              `${fm.file}: ${fm.mismatches.map((m) => `"${m.old}" found ${m.occurrences}x`).join("; ")}`,
          )
          .join(" | ");
        log(item, `apply failed (already retried once): ${item.error}`);
        return;
      }
      item.mismatchRetried = true;
      item.status = "queued";
      log(item, "apply mismatch, asking agent to re-propose");
      enqueue({
        itemId: item.id,
        message: buildMismatchMessage(result.fileMismatches),
      });
      return;
    }

    item.status = "applied";
    item.error = undefined;
    log(item, "applied");
    void runStyleCheckFollowup(item);
  }

  // Filter arg check-notes-style accepts: a note's filename (with or
  // without its numeric prefix), matched case-insensitively anywhere in the
  // path. See scripts/check-notes-style.ts and filter.ts.
  function filterArgFor(file: string): string {
    return basename(file, extname(file));
  }

  async function runStyleCheckFollowup(item: FeedbackItem): Promise<void> {
    const violatingOutputs: string[] = [];
    for (const file of item.files) {
      const { code, output } = await runCheckNotesStyle(
        root,
        filterArgFor(file),
      );
      if (code !== 0) violatingOutputs.push(`# ${file}\n${output}`);
    }
    if (violatingOutputs.length === 0) return;

    log(item, "style check found violations, asking agent to fix");
    enqueue({
      itemId: item.id,
      message: `Style check found violations in the file(s) after your edit was applied. Re-read the affected file(s) and propose a corrected fix.\n\n${violatingOutputs.join("\n\n").slice(0, 4000)}`,
    });
  }

  function runCheckNotesStyle(
    cwd: string,
    filterArg?: string,
  ): Promise<{ code: number; output: string }> {
    const args = ["run", "check-notes-style"];
    if (filterArg) args.push("--", "--filter", filterArg);
    return new Promise((resolvePromise) => {
      const child = spawnFn("bun", args, {
        cwd,
        stdio: ["ignore", "pipe", "pipe"],
      });
      let output = "";
      child.stdout.on("data", (d) => (output += d.toString()));
      child.stderr.on("data", (d) => (output += d.toString()));
      child.on("close", (code) => resolvePromise({ code: code ?? 1, output }));
      child.on("error", (err) =>
        resolvePromise({ code: 1, output: String(err) }),
      );
    });
  }

  async function readJsonBody<T>(req: IncomingMessage): Promise<T> {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const raw = Buffer.concat(chunks).toString("utf-8");
    return raw.length > 0 ? (JSON.parse(raw) as T) : ({} as T);
  }

  function sendJson(res: ServerResponse, status: number, body: unknown): void {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(body));
  }

  return {
    name: "live-edit",
    hooks: {
      "astro:config:setup": ({ config, addDevToolbarApp }) => {
        root = config.root.pathname.replace(/\/$/, "");
        docsRoot = join(root, "docs");
        tmpDir = join(root, ".tmp");

        // The whole-note / merge review panel; a no-op outside `astro dev`.
        // The per-note selection widget (src/components/dev/live-edit.astro)
        // isn't a toolbar app - it needs the live DOM Range of a text
        // selection to anchor its inline marker, which doesn't fit a
        // toggled overlay panel.
        addDevToolbarApp({
          id: "live-edit:panel",
          name: "Live Edit",
          icon: PENCIL_ICON,
          entrypoint: new URL("./toolbar-app.ts", import.meta.url),
        });
      },
      "astro:server:setup": async ({
        server,
        logger: serverLogger,
      }: {
        server: ViteDevServer;
        logger: AstroIntegrationLogger;
      }) => {
        logger = serverLogger;

        if (process.env.LIVE_EDIT === "0") {
          logger.info("disabled (LIVE_EDIT=0)");
          return;
        }

        const [availability, persistedBackend] = await Promise.all([
          detectBackendAvailability(),
          loadPersistedBackend(),
        ]);
        backendAvailability = availability;
        selectedBackend = pickInitialBackend(persistedBackend);

        const availableCount = BACKEND_DEFINITIONS.filter(
          (d) => backendAvailability[d.id].available,
        ).length;

        if (!selectedBackend) {
          logger.warn(
            `disabled: ${BACKEND_DEFINITIONS.map((d) => `${d.label}: ${backendAvailability[d.id].reason}`).join("; ")}`,
          );
        } else {
          // Awaited before the server starts accepting requests, so the
          // very first turn already resumes the persisted session instead
          // of racing a fresh one into existence.
          const persistedSessionId =
            await loadPersistedSessionId(selectedBackend);
          if (persistedSessionId) getAdapter(persistedSessionId);

          const model = process.env.LIVE_EDIT_MODEL || "default";
          logger.info(
            `ready, backend: ${selectedBackend}${availableCount > 1 ? " (more than one installed, developer can switch from the web UI)" : ""}, ` +
              (persistedSessionId
                ? `resuming session ${persistedSessionId.slice(0, 8)}`
                : "will start a new session on first request") +
              ` (model: ${model})`,
          );
        }
        logger.info(
          `routes: POST /__live-edit/{request,reset,backend}, GET /__live-edit/{events,notes,status}`,
        );

        const closeAll = () => {
          for (const res of clients) res.end();
          clients.clear();
          adapter?.dispose();
          adapter = null;
        };
        server.httpServer?.on("close", closeAll);
        process.on("exit", closeAll);

        server.middlewares.use((req, res, next) => {
          const url = req.url?.split("?")[0] ?? "";
          if (!url.startsWith("/__live-edit/")) return next();

          handleRoute(req, res, url).catch((err) => {
            if (!res.headersSent) {
              sendJson(res, 500, {
                error: err instanceof Error ? err.message : String(err),
              });
            }
          });
        });

        async function handleRoute(
          req: IncomingMessage,
          res: ServerResponse,
          url: string,
        ): Promise<void> {
          if (url === "/__live-edit/status" && req.method === "GET") {
            return sendJson(res, 200, {
              available: selectedBackend !== null,
              backend: selectedBackend,
              // Labeled here (not just id -> {available, reason}) so the
              // web UI's backend picker can show BACKEND_DEFINITIONS'
              // labels without hardcoding a name per backend itself.
              backends: Object.fromEntries(
                BACKEND_DEFINITIONS.map((d) => [
                  d.id,
                  { label: d.label, ...backendAvailability[d.id] },
                ]),
              ),
              // Kept for older clients expecting a single top-level reason;
              // new clients should read backends.<name>.reason instead.
              reason:
                selectedBackend === null
                  ? BACKEND_DEFINITIONS.map(
                      (d) => backendAvailability[d.id].reason,
                    ).join("; ")
                  : undefined,
            });
          }

          if (url === "/__live-edit/backend" && req.method === "POST") {
            const body = await readJsonBody<{ backend?: string }>(req);
            const backendId = body.backend;
            const def = BACKEND_DEFINITIONS.find((d) => d.id === backendId);
            if (!def) {
              return sendJson(res, 400, { error: "invalid backend" });
            }
            const backend = def.id;
            if (!backendAvailability[backend].available) {
              return sendJson(res, 400, {
                error: backendAvailability[backend].reason ?? "not available",
              });
            }
            if (backend !== selectedBackend) {
              adapter?.dispose();
              adapter = null;
              selectedBackend = backend;
              await persistBackend(backend);
              // Mirrors the astro:server:setup startup path: without this,
              // switching back to a backend used earlier in this same dev
              // session (or a previous one) would start a brand-new
              // conversation instead of resuming the one CLAUDE.md promises
              // is preserved per backend.
              const persistedSessionId = await loadPersistedSessionId(backend);
              if (persistedSessionId) getAdapter(persistedSessionId);
              logger?.info(
                `switched backend to ${backend}` +
                  (persistedSessionId
                    ? `, resuming session ${persistedSessionId.slice(0, 8)}`
                    : ""),
              );
            }
            return sendJson(res, 200, { ok: true, backend: selectedBackend });
          }

          if (url === "/__live-edit/events" && req.method === "GET") {
            res.writeHead(200, {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            });
            res.write(
              `data: ${JSON.stringify({ type: "snapshot", items: [...items.values()] })}\n\n`,
            );
            clients.add(res);
            req.on("close", () => clients.delete(res));
            return;
          }

          // Backs the site-wide bar's file picker: every note's path, slug,
          // and title, read straight off disk (no Astro content-collection
          // boot needed here, same as scripts/check-notes-style.ts).
          if (url === "/__live-edit/notes" && req.method === "GET") {
            const notes = scanFiles(docsRoot).map((f) => ({
              file: relative(root, f.file),
              slug: f.slug,
              title: f.title,
            }));
            return sendJson(res, 200, { notes });
          }

          if (url === "/__live-edit/request" && req.method === "POST") {
            if (!selectedBackend) {
              return sendJson(res, 503, { error: "live-edit is unavailable" });
            }
            const body = await readJsonBody<FeedbackRequest>(req);
            const item = buildItem(body);
            if (!item)
              return sendJson(res, 400, { error: "missing required fields" });
            items.set(item.id, item);
            broadcast(item);
            log(item, `queued (${item.kind}): ${item.comment.slice(0, 120)}`);
            enqueue({ itemId: item.id, message: buildRequestMessage(body) });
            return sendJson(res, 200, { id: item.id });
          }

          if (url === "/__live-edit/reset" && req.method === "POST") {
            adapter?.reset();
            logger?.info("session reset");
            return sendJson(res, 200, { ok: true });
          }

          return sendJson(res, 404, { error: "no such live-edit route" });
        }

        function buildItem(body: FeedbackRequest): FeedbackItem | null {
          if (!body || !body.comment) return null;

          if (body.kind === "selection") {
            if (!body.filePath || !body.selection) return null;
            return {
              id: randomUUID(),
              kind: "selection",
              files: [body.filePath],
              selection: body.selection,
              heading: body.heading,
              comment: body.comment,
              status: "queued",
              progress: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
          }

          if (body.kind === "whole-note") {
            if (!Array.isArray(body.files) || body.files.length === 0)
              return null;
            return {
              id: randomUUID(),
              kind: "whole-note",
              files: body.files,
              comment: body.comment,
              status: "queued",
              progress: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
          }

          return null;
        }
      },
    },
  };
}
