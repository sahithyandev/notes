import { randomUUID } from "node:crypto";
import { readdirSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, relative } from "node:path";
import { spawn } from "node:child_process";
import type { AstroIntegration, AstroIntegrationLogger } from "astro";
import type { ViteDevServer } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  ClaudeStreamAdapter,
  type AgentAdapter,
  type AgentEvent,
} from "./agent.ts";
import {
  buildRequestMessage,
  buildRefineMessage,
  buildMismatchMessage,
  type FeedbackRequest,
} from "./prompt.ts";
import {
  parseProposal,
  ProposalParseError,
  applyProposal,
  resolveDocPath,
  PathOutsideDocsError,
  type FileChange,
} from "./proposal.ts";
import { scanFiles } from "../notes-style-validator/scan.ts";

export type ItemStatus =
  "queued" | "running" | "proposed" | "error" | "applied" | "discarded";

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
  deletions?: string[];
  error?: string;
  createdAt: number;
  updatedAt: number;
  mismatchRetried?: boolean;
}

interface Job {
  itemId: string;
  message: string;
}

const SESSION_FILE = "live-edit-session";

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
export default function liveEdit(): AstroIntegration {
  let root = process.cwd();
  let docsRoot = join(root, "docs");
  let tmpDir = join(root, ".tmp");
  let logger: AstroIntegrationLogger | null = null;

  const items = new Map<string, FeedbackItem>();
  const clients = new Set<ServerResponse>();
  const queue: Job[] = [];
  let draining = false;
  let adapter: AgentAdapter | null = null;
  // Live Edit only works with the `claude` CLI (agent.ts spawns it
  // directly), so a dev environment without it on PATH can't run this
  // feature at all. Checked once at server startup rather than per-request,
  // and surfaced to the frontend via GET /__live-edit/status so the widgets
  // can show a disabled message instead of silently failing on first use.
  let claudeAvailable = true;
  let claudeUnavailableReason: string | undefined;

  function checkClaudeAvailable(): Promise<{
    available: boolean;
    reason?: string;
  }> {
    return new Promise((resolvePromise) => {
      const child = spawn("claude", ["--version"], {
        stdio: ["ignore", "ignore", "ignore"],
      });
      child.on("error", (err: NodeJS.ErrnoException) => {
        resolvePromise({
          available: false,
          reason:
            err.code === "ENOENT"
              ? "the `claude` CLI is not installed or not on PATH"
              : `failed to run \`claude\`: ${err.message}`,
        });
      });
      child.on("exit", (code) => {
        resolvePromise(
          code === 0
            ? { available: true }
            : {
                available: false,
                reason: `\`claude --version\` exited with code ${code}`,
              },
        );
      });
    });
  }

  function log(item: FeedbackItem, message: string): void {
    const label = item.files.join(", ");
    logger?.info(`${item.id.slice(0, 8)} ${label}: ${message}`);
  }

  function getAdapter(initialSessionId?: string): AgentAdapter {
    if (!adapter) {
      adapter = new ClaudeStreamAdapter({
        cwd: root,
        model: process.env.LIVE_EDIT_MODEL,
        initialSessionId,
        log: (m) => logger?.info(m),
        logError: (m) => logger?.error(m),
      });
    }
    return adapter;
  }

  async function loadPersistedSessionId(): Promise<string | undefined> {
    try {
      const raw = await readFile(join(tmpDir, SESSION_FILE), "utf-8");
      const id = raw.trim();
      return id.length > 0 ? id : undefined;
    } catch {
      return undefined;
    }
  }

  async function persistSessionId(id: string): Promise<void> {
    try {
      await mkdir(tmpDir, { recursive: true });
      await writeFile(join(tmpDir, SESSION_FILE), id, "utf-8");
    } catch {
      // Best-effort only: losing this just means the next dev-server start
      // begins a fresh session instead of resuming.
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
          void persistSessionId(evt.sessionId);
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
            const proposed = handleResultText(item, evt.text);
            log(
              item,
              proposed
                ? `proposed: ${item.summary}`
                : `no edit proposed: ${(item.error ?? "").slice(0, 200)}`,
            );
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

  function handleResultText(item: FeedbackItem, text: string): boolean {
    try {
      const proposal = parseProposal(text);
      item.status = "proposed";
      item.summary = proposal.summary;
      item.changes = proposal.changes;
      item.deletions = proposal.deletions;
      item.error = undefined;
      return true;
    } catch (err) {
      item.status = "error";
      item.error =
        err instanceof ProposalParseError
          ? `No edit proposed. Agent said: ${text.trim().slice(0, 2000)}`
          : err instanceof Error
            ? err.message
            : String(err);
      return false;
    }
  }

  // Filter arg check-notes-style accepts: a note's filename (with or
  // without its numeric prefix), matched case-insensitively anywhere in the
  // path. See scripts/check-notes-style.ts and filter.ts.
  function filterArgFor(file: string): string {
    return basename(file, extname(file));
  }

  // After a deletion, a broken link pointing at the removed file(s) can be
  // in *any* note, not just the ones this item touched, so that case scans
  // the whole corpus (no --filter) instead of just item.files.
  async function runStyleCheckFollowup(
    item: FeedbackItem,
    full: boolean,
  ): Promise<void> {
    if (full) {
      const { code, output } = await runCheckNotesStyle(root);
      if (code === 0) return;
      log(
        item,
        "style check found violations after deletion, asking agent to fix",
      );
      enqueue({
        itemId: item.id,
        message: `Style check found violations across the site after your deletion was applied (most likely other notes still linking to what you removed). Find and fix them.\n\n${output.slice(0, 4000)}`,
      });
      return;
    }

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
      const child = spawn("bun", args, {
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

  // Deleting a note leaves its siblings' prev/next/sidebar.order stale
  // (they were numbered assuming the deleted file was still there), so this
  // re-runs scripts/sync-note-metadata.ts for every directory a deletion
  // touched. Shelled out to (like check-notes-style below), not imported
  // directly: that script has a `if (require.main === module)` CLI entry
  // point which, when imported as a module under Vite's SSR module runner
  // (as opposed to run directly by Bun, which polyfills `require`), throws
  // "require is not defined" and crashes the whole dev server on startup -
  // caught by actually restarting the dev server after adding this, not
  // just by tests or a type-check.
  //
  // Only one remaining sibling per directory is passed as an argument -
  // sync-note-metadata.ts derives the full file list itself from that
  // file's directory, and stamps a fresh lastUpdatedOn on every path
  // actually passed as an argument. Passing just one (rather than every
  // surviving file) limits that stamping to that one arbitrary file
  // instead of the whole directory; it still isn't exactly right (that one
  // file's content didn't change either, only its neighbors were removed),
  // but matches what running the CLI by hand for the same purpose would
  // do, and is a minor cosmetic inaccuracy, not a correctness issue.
  async function resyncAfterDeletion(item: FeedbackItem): Promise<void> {
    const dirs = new Set<string>();
    for (const file of item.deletions ?? []) {
      try {
        dirs.add(dirname(resolveDocPath(docsRoot, file)));
      } catch {
        // Already validated by applyProposal before this ran; ignore.
      }
    }

    const anchorFiles: string[] = [];
    for (const dir of dirs) {
      try {
        const remaining = readdirSync(dir).find(
          (name) => name.endsWith(".md") || name.endsWith(".mdx"),
        );
        if (remaining) anchorFiles.push(join(dir, remaining));
      } catch {
        // The directory may be gone if every note in it was deleted.
      }
    }
    if (anchorFiles.length === 0) return;

    const { code, output } = await new Promise<{
      code: number;
      output: string;
    }>((resolvePromise) => {
      const child = spawn(
        "bun",
        ["scripts/sync-note-metadata.ts", ...anchorFiles],
        { cwd: root, stdio: ["ignore", "pipe", "pipe"] },
      );
      let out = "";
      child.stdout.on("data", (d) => (out += d.toString()));
      child.stderr.on("data", (d) => (out += d.toString()));
      child.on("close", (c) => resolvePromise({ code: c ?? 1, output: out }));
      child.on("error", (err) =>
        resolvePromise({ code: 1, output: String(err) }),
      );
    });

    if (code === 0) {
      log(
        item,
        "renumbered the remaining notes in the affected director(y/ies)",
      );
    } else {
      log(item, `renumbering after deletion failed: ${output.slice(0, 500)}`);
    }
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

        const availability = await checkClaudeAvailable();
        claudeAvailable = availability.available;
        claudeUnavailableReason = availability.reason;

        if (!claudeAvailable) {
          logger.warn(`disabled: ${claudeUnavailableReason}`);
        } else {
          // Awaited before the server starts accepting requests, so the
          // very first turn already resumes the persisted session instead
          // of racing a fresh one into existence.
          const persistedSessionId = await loadPersistedSessionId();
          if (persistedSessionId) getAdapter(persistedSessionId);

          const model = process.env.LIVE_EDIT_MODEL || "default";
          logger.info(
            persistedSessionId
              ? `ready, resuming session ${persistedSessionId.slice(0, 8)} (model: ${model})`
              : `ready, will start a new session on first request (model: ${model})`,
          );
        }
        logger.info(
          `routes: POST /__live-edit/{request,apply/:id,discard/:id,refine/:id,reset}, GET /__live-edit/{events,notes,status}`,
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
              available: claudeAvailable,
              reason: claudeUnavailableReason,
            });
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
            if (!claudeAvailable) {
              return sendJson(res, 503, {
                error: claudeUnavailableReason ?? "live-edit is unavailable",
              });
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

          const applyMatch = url.match(/^\/__live-edit\/apply\/([^/]+)$/);
          if (applyMatch && req.method === "POST") {
            return handleApply(req, res, applyMatch[1]);
          }

          const discardMatch = url.match(/^\/__live-edit\/discard\/([^/]+)$/);
          if (discardMatch && req.method === "POST") {
            const item = items.get(discardMatch[1]);
            if (!item) return sendJson(res, 404, { error: "not found" });
            item.status = "discarded";
            touch(item);
            log(item, "discarded");
            return sendJson(res, 200, { ok: true });
          }

          const refineMatch = url.match(/^\/__live-edit\/refine\/([^/]+)$/);
          if (refineMatch && req.method === "POST") {
            if (!claudeAvailable) {
              return sendJson(res, 503, {
                error: claudeUnavailableReason ?? "live-edit is unavailable",
              });
            }
            const item = items.get(refineMatch[1]);
            if (!item) return sendJson(res, 404, { error: "not found" });
            const body = await readJsonBody<{ comment: string }>(req);
            if (!body.comment)
              return sendJson(res, 400, { error: "missing comment" });
            item.status = "queued";
            touch(item);
            log(item, `refine: ${body.comment.slice(0, 120)}`);
            enqueue({
              itemId: item.id,
              message: buildRefineMessage(body.comment),
            });
            return sendJson(res, 200, { ok: true });
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

        async function handleApply(
          req: IncomingMessage,
          res: ServerResponse,
          id: string,
        ): Promise<void> {
          const item = items.get(id);
          if (!item) return sendJson(res, 404, { error: "not found" });
          const hasChanges = (item.changes?.length ?? 0) > 0;
          const hasDeletions = (item.deletions?.length ?? 0) > 0;
          if (item.status !== "proposed" || (!hasChanges && !hasDeletions)) {
            return sendJson(res, 400, {
              error: "item is not in a proposed state",
            });
          }

          // Deleting files is the one destructive action this tool can
          // propose, so it needs an explicit, separate confirmation from
          // the click that reveals the proposal - the browser is expected
          // to have already shown the exact file list and gotten a yes
          // before sending this.
          if (hasDeletions) {
            const body = await readJsonBody<{ confirmDelete?: boolean }>(req);
            if (!body.confirmDelete) {
              return sendJson(res, 400, {
                error: "confirmation required to delete files",
                deletions: item.deletions,
              });
            }
          }

          let result;
          try {
            result = await applyProposal(
              docsRoot,
              item.changes ?? [],
              item.deletions ?? [],
            );
          } catch (err) {
            if (err instanceof PathOutsideDocsError) {
              item.status = "error";
              item.error = err.message;
              touch(item);
              return sendJson(res, 400, { error: err.message });
            }
            throw err;
          }

          if (!result.ok) {
            if (item.mismatchRetried) {
              item.status = "error";
              const editMsgs = result.fileMismatches.map(
                (fm) =>
                  `${fm.file}: ${fm.mismatches.map((m) => `"${m.old}" found ${m.occurrences}x`).join("; ")}`,
              );
              const delMsgs = result.deletionMismatches.map(
                (dm) => `${dm.file}: ${dm.reason}`,
              );
              item.error = [...editMsgs, ...delMsgs].join(" | ");
              touch(item);
              log(item, `apply failed (already retried once): ${item.error}`);
              return sendJson(res, 409, {
                ok: false,
                fileMismatches: result.fileMismatches,
                deletionMismatches: result.deletionMismatches,
              });
            }
            item.mismatchRetried = true;
            item.status = "queued";
            touch(item);
            log(item, "apply mismatch, asking agent to re-propose");
            enqueue({
              itemId: item.id,
              message: buildMismatchMessage(
                result.fileMismatches,
                result.deletionMismatches,
              ),
            });
            return sendJson(res, 200, { ok: false, retried: true });
          }

          item.status = "applied";
          item.error = undefined;
          touch(item);
          log(
            item,
            hasDeletions
              ? `applied (deleted ${item.deletions!.length} file(s))`
              : "applied",
          );
          sendJson(res, 200, { ok: true });

          if (hasDeletions) void resyncAfterDeletion(item);
          void runStyleCheckFollowup(item, hasDeletions);
        }
      },
    },
  };
}
