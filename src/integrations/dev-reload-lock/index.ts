import type { Plugin, ViteDevServer } from "vite";

const DEBOUNCE_MS = 500;
const OPEN = 1;

// Coalesces a burst of file edits (from any editor, script, or agent, not
// just ones that call the pause/resume endpoints below) into a single dev
// server reload. By default every full-reload/HMR message is held for
// DEBOUNCE_MS of quiet before it's actually sent, and each new message
// during that window resets the timer; a burst of rapid edits across many
// files only produces one reload, fired shortly after the burst ends. This
// requires no cooperation from whatever is doing the editing.
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
// POST /__reload-lock/{pause,resume} is an optional latency optimization on
// top: an agent that can call these (e.g. a Claude Code hook firing before
// and after its edit turn) gets an instant flush on resume instead of
// waiting out the debounce window. Agents that don't know about these
// endpoints still get the debounced behavior for free.
export default function devReloadLock(): Plugin {
  let paused = false;
  let pendingReload = false;
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  return {
    name: "dev-reload-lock",
    configureServer(server: ViteDevServer) {
      const originalSends = new WeakMap<any, (data: string) => void>();

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
            debounceTimer = setTimeout(flush, DEBOUNCE_MS);
          }
        };
      };

      const flush = () => {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
          debounceTimer = undefined;
        }
        if (!pendingReload) return;
        pendingReload = false;
        const message = JSON.stringify({ type: "full-reload" });
        for (const client of server.ws.clients) {
          const socket = (client as any).socket ?? client;
          const original = originalSends.get(socket);
          if (socket.readyState === OPEN)
            (original ?? socket.send.bind(socket))(message);
        }
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
          paused = true;
          if (debounceTimer) {
            clearTimeout(debounceTimer);
            debounceTimer = undefined;
          }
        } else if (req.url === "/__reload-lock/resume") {
          paused = false;
          flush();
        } else {
          return next();
        }
        res.statusCode = 200;
        res.end("ok");
      });
    },
  };
}
