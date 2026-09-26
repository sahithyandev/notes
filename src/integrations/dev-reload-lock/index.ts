import { relative } from "node:path";
import type { Plugin, ViteDevServer } from "vite";
import { CONTENT_CHANGED_EVENT } from "./protocol.ts";

// Astro's content-layer plugin (vite-plugin-content-virtual-mod.js) sends
// two separate full-reload signals per content edit, not one: an immediate
// one from the generic Vite file-watcher hotUpdate, then a second one later
// from invalidateDataStore() once its content data-store cache finishes
// re-syncing to disk (store.onFileWritten()) - Astro's own code names this
// lag DIRECT_INVALIDATION_ECHO_MS = 1000. Measured directly against this
// dev server, the gap between the two was 589-1173ms for a single note
// edit, so a real full-reload's debounce window has to clear that gap (with
// margin) or the second one always slips through as its own separate,
// jarring hard reload.
//
// A content-only change doesn't have that problem: live-update.ts's swap is
// cheap and idempotent, so a trailing duplicate signal just means a second,
// invisible re-fetch, not a second reload - it gets to use a much shorter
// debounce, just enough to coalesce a genuine multi-file write (a merge
// proposal's Promise.all) into one event instead of one per file.
const FULL_RELOAD_DEBOUNCE_MS = 1300;
const CONTENT_DEBOUNCE_MS = 120;
const OPEN = 1;

const CONTENT_FILE_RE = /^docs\/.+\.(md|mdx)$/;
// Astro's own bookkeeping, not something the developer edited: the content
// layer's data-store cache (.astro/) and asset-imports manifest are both
// explicitly added to server.watcher (vite-plugin-content-virtual-mod.js)
// and rewritten on every content sync, so a docs/ edit's own re-sync
// touches one of these too. Without this exclusion every content-only edit
// would still fall back to a full reload, since that rewrite would
// otherwise be read as an unrelated "non-content" change.
const IGNORED_PATH_RE =
  /(^|\/)(\.astro|node_modules|\.git|dist|\.vercel|\.tmp)\//;

// Coalesces a burst of file edits (from any editor, script, or agent, not
// just ones that call the pause/resume endpoints below) into a single dev
// server reload (or content-changed event). By default every full-reload/
// HMR message is held for a quiet period (currentDebounceMs() - short for a
// content-only batch, long for anything that needs a real reload) before
// it's actually sent, and each new message during that window resets the
// timer; a burst of rapid edits across many files only produces one
// reload/event, fired shortly after the burst ends. This requires no
// cooperation from whatever is doing the editing.
//
// Vite/Astro have several internal objects that can trigger a reload
// (server.ws, server.hot, each Vite environment's own .hot channel, Astro's
// content-layer sync) and each holds its own private copy of the `send`
// method (captured by object-spread at server-creation time, before any
// plugin's configureServer hook runs), so patching any one of those objects
// misses messages sent through the others. The one point they all funnel
// through is the raw WebSocket connection to the browser, so that's what
// gets patched here instead.
//
// pauseReloads()/resumeReloads() (below) are an optional latency
// optimization on top: a caller that knows it's about to make a burst of
// edits (the Claude Code hooks in .claude/settings.json, and live-edit's own
// applyProposal -> style-check-fix loop in ../live-edit/index.ts) gets an
// instant flush on resume instead of waiting out the debounce window.
// Callers that don't know about this still get the debounced behavior for
// free, via POST /__reload-lock/{pause,resume} for anything outside this
// process, or directly for anything inside it (same dev server process as
// live-edit, so it calls the functions rather than looping back over HTTP).
let paused = false;
let pendingReload = false;
let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let activeServer: ViteDevServer | undefined;
const originalSends = new WeakMap<any, (data: string) => void>();

// Which real fs changes are behind the currently-pending reload, tracked
// independently of the WS messages themselves (those don't reliably carry
// the triggering file - see flush() below). If everything since the last
// flush was a change to an existing docs/**/*.{md,mdx} file, the page can
// patch itself instead of reloading; anything else (a new/removed file, a
// change under src/, a config change, ...) falls back to a real reload,
// since only a content edit is something a note page knows how to apply
// itself without re-running Astro's own render pipeline.
const pendingContentFiles = new Set<string>();
let pendingNonContentChange = false;

function isTrackedContentFile(root: string, absPath: string): string | null {
  const rel = relative(root, absPath).split("\\").join("/");
  return CONTENT_FILE_RE.test(rel) ? rel : null;
}

function isIgnoredPath(root: string, absPath: string): boolean {
  const rel = relative(root, absPath).split("\\").join("/");
  return IGNORED_PATH_RE.test(rel);
}

// Which debounce applies to whatever is pending *right now* - a
// non-content change (or the risk of one arriving mid-window) always needs
// the long, hard-reload-safe window; a content-only batch gets the short
// one. Recomputed on every (re)schedule rather than fixed at the first
// change, so a batch that starts as content-only and then picks up a
// non-content change mid-window correctly upgrades to the long debounce.
function currentDebounceMs(): number {
  return pendingNonContentChange
    ? FULL_RELOAD_DEBOUNCE_MS
    : CONTENT_DEBOUNCE_MS;
}

function flush(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = undefined;
  }
  if (!pendingReload || !activeServer) return;
  pendingReload = false;

  const contentFiles = [...pendingContentFiles];
  const hadNonContentChange = pendingNonContentChange;
  pendingContentFiles.clear();
  pendingNonContentChange = false;

  // A full-reload-shaped WS message with nothing tracked behind it is an
  // echo, not a real change - most commonly Astro's own trailing
  // content-store invalidation (see the comment above) arriving after the
  // content-only flush it belongs to already fired and cleared
  // pendingContentFiles. Defaulting to a full reload here would mean every
  // soft content update is silently followed by a real hard reload a
  // moment later - exactly the "feels slow" symptom this is fixing.
  if (!hadNonContentChange && contentFiles.length === 0) return;

  const message = hadNonContentChange
    ? JSON.stringify({ type: "full-reload" })
    : JSON.stringify({
        type: "custom",
        event: CONTENT_CHANGED_EVENT,
        data: { files: contentFiles },
      });

  for (const client of activeServer.ws.clients) {
    const socket = (client as any).socket ?? client;
    const original = originalSends.get(socket);
    if (socket.readyState === OPEN)
      (original ?? socket.send.bind(socket))(message);
  }
}

export function pauseReloads(): void {
  paused = true;
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = undefined;
  }
}

export function resumeReloads(): void {
  paused = false;
  if (!pendingReload) return;
  // Not an instant flush: Astro's content layer can fire a second,
  // trailing invalidation for the same write a few hundred ms to ~1s after
  // the first (observed directly - a single live-edit apply sometimes logs
  // "Reloaded data from ..." twice), so flushing the moment a caller
  // resumes can send one reload immediately and then a second, unprotected
  // one when that straggler lands after `paused` is already false. Routing
  // resume through the same debounce as everything else means a straggler
  // still gets coalesced into the one flush - and now that the straggler
  // for a content-only change is dropped as an echo instead of forcing a
  // full reload (see flush()), this only actually needs the long window
  // when a non-content change is (or might still turn out to be) involved.
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(flush, currentDebounceMs());
}

export default function devReloadLock(): Plugin {
  return {
    name: "dev-reload-lock",
    configureServer(server: ViteDevServer) {
      activeServer = server;
      const root = server.config.root;

      // Only a "change" to a file that already exists as a tracked note
      // is safe to treat as content-only: an add/unlink can shift sidebar
      // structure, prev/next links, or the module tree, none of which a
      // page can patch into itself - those always fall back to a real
      // reload via pendingNonContentChange.
      server.watcher.on("change", (file: string) => {
        if (isIgnoredPath(root, file)) return;
        const rel = isTrackedContentFile(root, file);
        if (rel) pendingContentFiles.add(rel);
        else pendingNonContentChange = true;
      });
      server.watcher.on("add", (file: string) => {
        if (isIgnoredPath(root, file)) return;
        pendingNonContentChange = true;
      });
      server.watcher.on("unlink", (file: string) => {
        if (isIgnoredPath(root, file)) return;
        pendingNonContentChange = true;
      });

      const patchSocket = (socket: any) => {
        if (originalSends.has(socket)) return;
        originalSends.set(socket, socket.send.bind(socket));
        socket.send = (data: any) => {
          let payload: any;
          try {
            payload = typeof data === "string" ? JSON.parse(data) : null;
          } catch {
            payload = null;
          }

          const original = originalSends.get(socket)!;
          if (payload?.type !== "full-reload" && payload?.type !== "update") {
            return original(data);
          }

          pendingReload = true;
          if (debounceTimer) clearTimeout(debounceTimer);
          if (!paused) {
            debounceTimer = setTimeout(flush, currentDebounceMs());
          }
        };
      };

      for (const client of server.ws.clients) {
        patchSocket((client as any).socket ?? client);
      }
      server.ws.on("connection", (socket: any) => patchSocket(socket));

      server.middlewares.use((req, res, next) => {
        if (req.method !== "POST" || !req.url?.startsWith("/__reload-lock/")) {
          return next();
        }
        if (req.url === "/__reload-lock/pause") {
          pauseReloads();
        } else if (req.url === "/__reload-lock/resume") {
          resumeReloads();
        } else {
          return next();
        }
        res.statusCode = 200;
        res.end("ok");
      });
    },
  };
}
