import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname, join, relative } from "node:path";
import { spawn } from "node:child_process";
import type { Plugin, ViteDevServer } from "vite";
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
  error?: string;
  createdAt: number;
  updatedAt: number;
  mismatchRetried?: boolean;
}

interface Job {
  itemId: string;
  message: string;
}

const SESSION_FILE = "edit-feedback-session";

// A small in-process store + single-worker queue backing the dev-only
// "select text, get an edit" feedback loop (plus a site-wide whole-note /
// multi-note variant for merges). Turns run one at a time against one
// long-lived `claude -p --input-format stream-json` process (agent.ts), so
// prompt cache and conversation context are shared across requests.
export default function editFeedback(): Plugin {
  let root = process.cwd();
  let docsRoot = join(root, "docs");
  let tmpDir = join(root, ".tmp");

  const items = new Map<string, FeedbackItem>();
  const clients = new Set<ServerResponse>();
  const queue: Job[] = [];
  let draining = false;
  let adapter: AgentAdapter | null = null;

  function getAdapter(initialSessionId?: string): AgentAdapter {
    if (!adapter) {
      adapter = new ClaudeStreamAdapter({
        cwd: root,
        model: process.env.EDIT_FEEDBACK_MODEL,
        initialSessionId,
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

    const agent = getAdapter();

    let events: AsyncIterable<AgentEvent>;
    try {
      events = agent.send(job.message);
    } catch (err) {
      item.status = "error";
      item.error = err instanceof Error ? err.message : String(err);
      touch(item);
      return;
    }

    try {
      for await (const evt of events) {
        if (evt.type === "session") {
          void persistSessionId(evt.sessionId);
        } else if (evt.type === "progress") {
          item.progress.push(evt.label);
          touch(item);
        } else if (evt.type === "process-error") {
          item.status = "error";
          item.error = evt.message;
          touch(item);
        } else if (evt.type === "result") {
          item.agentReply = evt.text;
          if (evt.isError) {
            item.status = "error";
            item.error = evt.text;
          } else {
            handleResultText(item, evt.text);
          }
          touch(item);
        }
      }
    } catch (err) {
      item.status = "error";
      item.error = err instanceof Error ? err.message : String(err);
      touch(item);
    }
  }

  function handleResultText(item: FeedbackItem, text: string): void {
    try {
      const proposal = parseProposal(text);
      item.status = "proposed";
      item.summary = proposal.summary;
      item.changes = proposal.changes;
      item.error = undefined;
    } catch (err) {
      item.status = "error";
      item.error =
        err instanceof ProposalParseError
          ? `No edit proposed. Agent said: ${text.trim().slice(0, 2000)}`
          : err instanceof Error
            ? err.message
            : String(err);
    }
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

    enqueue({
      itemId: item.id,
      message: `Style check found violations in the file(s) after your edit was applied. Re-read the affected file(s) and propose a corrected fix.\n\n${violatingOutputs.join("\n\n").slice(0, 4000)}`,
    });
  }

  function runCheckNotesStyle(
    cwd: string,
    filterArg: string,
  ): Promise<{ code: number; output: string }> {
    return new Promise((resolvePromise) => {
      const child = spawn(
        "bun",
        ["run", "check-notes-style", "--", "--filter", filterArg],
        { cwd, stdio: ["ignore", "pipe", "pipe"] },
      );
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
    name: "edit-feedback",
    apply: "serve",
    configResolved(config) {
      root = config.root;
      docsRoot = join(root, "docs");
      tmpDir = join(root, ".tmp");
    },
    async configureServer(server: ViteDevServer) {
      if (process.env.EDIT_FEEDBACK === "0") return;

      // Awaited before the server starts accepting requests, so the very
      // first turn already resumes the persisted session instead of racing
      // a fresh one into existence.
      const persistedSessionId = await loadPersistedSessionId();
      if (persistedSessionId) getAdapter(persistedSessionId);

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
        if (!url.startsWith("/__edit-feedback/")) return next();

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
        if (url === "/__edit-feedback/events" && req.method === "GET") {
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
        if (url === "/__edit-feedback/notes" && req.method === "GET") {
          const notes = scanFiles(docsRoot).map((f) => ({
            file: relative(root, f.file),
            slug: f.slug,
            title: f.title,
          }));
          return sendJson(res, 200, { notes });
        }

        if (url === "/__edit-feedback/request" && req.method === "POST") {
          const body = await readJsonBody<FeedbackRequest>(req);
          const item = buildItem(body);
          if (!item)
            return sendJson(res, 400, { error: "missing required fields" });
          items.set(item.id, item);
          broadcast(item);
          enqueue({ itemId: item.id, message: buildRequestMessage(body) });
          return sendJson(res, 200, { id: item.id });
        }

        const applyMatch = url.match(/^\/__edit-feedback\/apply\/([^/]+)$/);
        if (applyMatch && req.method === "POST") {
          return handleApply(res, applyMatch[1]);
        }

        const discardMatch = url.match(/^\/__edit-feedback\/discard\/([^/]+)$/);
        if (discardMatch && req.method === "POST") {
          const item = items.get(discardMatch[1]);
          if (!item) return sendJson(res, 404, { error: "not found" });
          item.status = "discarded";
          touch(item);
          return sendJson(res, 200, { ok: true });
        }

        const refineMatch = url.match(/^\/__edit-feedback\/refine\/([^/]+)$/);
        if (refineMatch && req.method === "POST") {
          const item = items.get(refineMatch[1]);
          if (!item) return sendJson(res, 404, { error: "not found" });
          const body = await readJsonBody<{ comment: string }>(req);
          if (!body.comment)
            return sendJson(res, 400, { error: "missing comment" });
          item.status = "queued";
          touch(item);
          enqueue({
            itemId: item.id,
            message: buildRefineMessage(body.comment),
          });
          return sendJson(res, 200, { ok: true });
        }

        if (url === "/__edit-feedback/reset" && req.method === "POST") {
          adapter?.reset();
          return sendJson(res, 200, { ok: true });
        }

        return sendJson(res, 404, { error: "no such edit-feedback route" });
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
        res: ServerResponse,
        id: string,
      ): Promise<void> {
        const item = items.get(id);
        if (!item) return sendJson(res, 404, { error: "not found" });
        if (item.status !== "proposed" || !item.changes) {
          return sendJson(res, 400, {
            error: "item is not in a proposed state",
          });
        }

        let result;
        try {
          result = await applyProposal(docsRoot, item.changes);
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
            item.error = result.fileMismatches
              .map(
                (fm) =>
                  `${fm.file}: ${fm.mismatches.map((m) => `"${m.old}" found ${m.occurrences}x`).join("; ")}`,
              )
              .join(" | ");
            touch(item);
            return sendJson(res, 409, {
              ok: false,
              fileMismatches: result.fileMismatches,
            });
          }
          item.mismatchRetried = true;
          item.status = "queued";
          touch(item);
          enqueue({
            itemId: item.id,
            message: buildMismatchMessage(result.fileMismatches),
          });
          return sendJson(res, 200, { ok: false, retried: true });
        }

        item.status = "applied";
        item.error = undefined;
        touch(item);
        sendJson(res, 200, { ok: true });

        void runStyleCheckFollowup(item);
      }
    },
  };
}
