// index.ts keeps its coalescing state at module scope (it's a singleton
// plugin, one dev server process), so importing it normally would leak
// state between tests in this file. Each test instead does a cache-busted
// dynamic import (same trick as live-update.ts's reExecuteScripts, and for
// the same reason: a fresh query string forces a genuinely fresh module
// instance) to get its own isolated copy of that state.
import { test, expect } from "bun:test";
import { EventEmitter } from "node:events";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CONTENT_CHANGED_EVENT } from "./protocol.ts";

let importId = 0;
async function freshModule() {
  return import(`./index.ts?t=${Date.now()}-${importId++}`) as Promise<
    typeof import("./index.ts")
  >;
}

const ROOT = "/repo";

function makeClient() {
  const sent: any[] = [];
  const socket = {
    readyState: 1,
    send(data: string) {
      sent.push(JSON.parse(data));
    },
  };
  return { socket, sent };
}

function makeServer(clients: { socket: any }[], root: string = ROOT) {
  const watcher = new EventEmitter();
  const connectionHandlers: ((socket: any) => void)[] = [];
  const middlewareHandlers: Array<
    (req: any, res: any, next: () => void) => void
  > = [];
  const wsClients = clients.map((c) => c.socket);
  const server = {
    config: { root },
    watcher,
    ws: {
      clients: wsClients,
      on(event: string, cb: (socket: any) => void) {
        if (event === "connection") connectionHandlers.push(cb);
      },
    },
    middlewares: {
      use(cb: (req: any, res: any, next: () => void) => void) {
        middlewareHandlers.push(cb);
      },
    },
  };
  // Mirrors the real server.ws.clients (a live Set Vite maintains itself,
  // populated on connection independently of anything a plugin does) -
  // connecting a client here both notifies connectionHandlers (so
  // configureServer's own listener can patch it) and adds it to the pool
  // flush() iterates over.
  function connect(socket: any) {
    wsClients.push(socket);
    for (const cb of connectionHandlers) cb(socket);
  }
  return { server, watcher, connect, middlewareHandlers };
}

function change(watcher: EventEmitter, absPath: string) {
  watcher.emit("change", absPath);
}

function triggerReload(socket: any) {
  socket.send(JSON.stringify({ type: "full-reload" }));
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test("coalesces several docs/**/*.md changes into one content-changed event listing every file", async () => {
  const mod = await freshModule();
  const { socket, sent } = makeClient();
  const { server, watcher } = makeServer([{ socket }]);
  mod.default().configureServer(server as any);

  change(watcher, `${ROOT}/docs/s1/topic/a.md`);
  triggerReload(socket);
  change(watcher, `${ROOT}/docs/s1/topic/b.mdx`);
  triggerReload(socket);

  await wait(200);

  expect(sent).toEqual([
    {
      type: "custom",
      event: CONTENT_CHANGED_EVENT,
      data: { files: ["docs/s1/topic/a.md", "docs/s1/topic/b.mdx"] },
    },
  ]);
});

test("a change outside docs/**/*.{md,mdx} falls back to a real full-reload", async () => {
  const mod = await freshModule();
  const { socket, sent } = makeClient();
  const { server, watcher } = makeServer([{ socket }]);
  mod.default().configureServer(server as any);

  change(watcher, `${ROOT}/src/components/note/article.astro`);
  triggerReload(socket);

  // Non-content debounce is 1300ms - confirm it hasn't fired yet well
  // before that, so the two paths are genuinely on different timers.
  await wait(200);
  expect(sent).toEqual([]);

  await wait(1300);
  expect(sent).toEqual([{ type: "full-reload" }]);
});

test("a docs/**/*.md change alongside a non-content change upgrades the whole batch to a full-reload", async () => {
  const mod = await freshModule();
  const { socket, sent } = makeClient();
  const { server, watcher } = makeServer([{ socket }]);
  mod.default().configureServer(server as any);

  change(watcher, `${ROOT}/docs/s1/topic/a.md`);
  triggerReload(socket);
  change(watcher, `${ROOT}/src/components/note/article.astro`);
  triggerReload(socket);

  await wait(1600);

  expect(sent).toEqual([{ type: "full-reload" }]);
});

test("adding or removing a docs file is never treated as content-only", async () => {
  const mod = await freshModule();
  const { socket, sent } = makeClient();
  const { server, watcher } = makeServer([{ socket }]);
  mod.default().configureServer(server as any);

  watcher.emit("add", `${ROOT}/docs/s1/topic/new.md`);
  triggerReload(socket);

  await wait(1600);

  expect(sent).toEqual([{ type: "full-reload" }]);
});

test("ignores changes under bookkeeping paths like .astro/ and node_modules/", async () => {
  const mod = await freshModule();
  const { socket, sent } = makeClient();
  const { server, watcher } = makeServer([{ socket }]);
  mod.default().configureServer(server as any);

  change(watcher, `${ROOT}/.astro/data-store.json`);
  change(watcher, `${ROOT}/node_modules/some-pkg/index.js`);
  triggerReload(socket);

  // Nothing tracked was actually touched, so even once the (long, since
  // nothing marked it content-only either) debounce would have fired,
  // there's no pending reload to flush.
  await wait(1600);

  expect(sent).toEqual([]);
});

test("drops a trailing echo full-reload with nothing pending behind it, instead of forcing a hard reload", async () => {
  const mod = await freshModule();
  const { socket, sent } = makeClient();
  const { server, watcher } = makeServer([{ socket }]);
  mod.default().configureServer(server as any);

  change(watcher, `${ROOT}/docs/s1/topic/a.md`);
  triggerReload(socket);
  await wait(200);
  expect(sent).toEqual([
    {
      type: "custom",
      event: CONTENT_CHANGED_EVENT,
      data: { files: ["docs/s1/topic/a.md"] },
    },
  ]);

  // Astro's own trailing content-store invalidation firing after the
  // content-only flush already cleared the pending file set.
  triggerReload(socket);
  await wait(200);

  expect(sent.length).toBe(1);
});

test("pauseReloads holds the flush until resumeReloads is called", async () => {
  const mod = await freshModule();
  const { socket, sent } = makeClient();
  const { server, watcher } = makeServer([{ socket }]);
  mod.default().configureServer(server as any);

  mod.pauseReloads();
  change(watcher, `${ROOT}/docs/s1/topic/a.md`);
  triggerReload(socket);

  await wait(300);
  expect(sent).toEqual([]);

  mod.resumeReloads();
  await wait(200);

  expect(sent).toEqual([
    {
      type: "custom",
      event: CONTENT_CHANGED_EVENT,
      data: { files: ["docs/s1/topic/a.md"] },
    },
  ]);
});

test("the pause/resume HTTP endpoints drive the same pause/resume behavior", async () => {
  const mod = await freshModule();
  const { socket, sent } = makeClient();
  const { server, watcher, middlewareHandlers } = makeServer([{ socket }]);
  mod.default().configureServer(server as any);
  const middleware = middlewareHandlers[0];

  const next = () => {
    throw new Error("next() should not be called for a handled request");
  };

  let pauseRes = {
    statusCode: 0,
    body: "",
    end(b: string) {
      this.body = b;
    },
  };
  middleware({ method: "POST", url: "/__reload-lock/pause" }, pauseRes, next);
  pauseRes.statusCode = 200;

  change(watcher, `${ROOT}/docs/s1/topic/a.md`);
  triggerReload(socket);
  await wait(300);
  expect(sent).toEqual([]);

  let resumeRes = {
    statusCode: 0,
    body: "",
    end(b: string) {
      this.body = b;
    },
  };
  middleware({ method: "POST", url: "/__reload-lock/resume" }, resumeRes, next);
  await wait(200);

  expect(sent).toEqual([
    {
      type: "custom",
      event: CONTENT_CHANGED_EVENT,
      data: { files: ["docs/s1/topic/a.md"] },
    },
  ]);
});

test("an unrelated request falls through to next() untouched", async () => {
  const mod = await freshModule();
  const { socket } = makeClient();
  const { server, middlewareHandlers } = makeServer([{ socket }]);
  mod.default().configureServer(server as any);
  const middleware = middlewareHandlers[0];

  let calledNext = false;
  middleware({ method: "GET", url: "/some/other/path" }, { end() {} }, () => {
    calledNext = true;
  });

  expect(calledNext).toBe(true);
});

test("a client that connects after startup is still patched", async () => {
  const mod = await freshModule();
  const { server, watcher, connect } = makeServer([]);
  mod.default().configureServer(server as any);

  const { socket, sent } = makeClient();
  connect(socket);

  change(watcher, `${ROOT}/docs/s1/topic/a.md`);
  triggerReload(socket);
  await wait(200);

  expect(sent).toEqual([
    {
      type: "custom",
      event: CONTENT_CHANGED_EVENT,
      data: { files: ["docs/s1/topic/a.md"] },
    },
  ]);
});

test("a non-reload websocket message passes straight through, untouched by coalescing", async () => {
  const mod = await freshModule();
  const { socket, sent } = makeClient();
  const { server } = makeServer([{ socket }]);
  mod.default().configureServer(server as any);

  socket.send(JSON.stringify({ type: "connected" }));

  expect(sent).toEqual([{ type: "connected" }]);
});

function withTempDocsRoot(fn: (root: string, file: string) => Promise<void>) {
  return async () => {
    const root = mkdtempSync(join(tmpdir(), "dev-reload-lock-"));
    const dir = join(root, "docs", "s1", "topic");
    mkdirSync(dir, { recursive: true });
    const file = join(dir, "a.md");
    writeFileSync(file, "---\ntitle: A\nprereqs: []\n---\nbody\n");
    try {
      await fn(root, file);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  };
}

test(
  "editing a tracked note's frontmatter forces a full reload, not a content-only patch",
  withTempDocsRoot(async (root, file) => {
    const mod = await freshModule();
    const { socket, sent } = makeClient();
    const { server, watcher } = makeServer([{ socket }], root);
    mod.default().configureServer(server as any);

    writeFileSync(file, '---\ntitle: A\nprereqs: ["s2/topic/b"]\n---\nbody\n');
    change(watcher, file);
    triggerReload(socket);

    await wait(1600);

    expect(sent).toEqual([{ type: "full-reload" }]);
  }),
);

test(
  "editing only a tracked note's body still takes the content-only fast path",
  withTempDocsRoot(async (root, file) => {
    const mod = await freshModule();
    const { socket, sent } = makeClient();
    const { server, watcher } = makeServer([{ socket }], root);
    mod.default().configureServer(server as any);

    writeFileSync(file, "---\ntitle: A\nprereqs: []\n---\nnew body\n");
    change(watcher, file);
    triggerReload(socket);

    await wait(200);

    expect(sent).toEqual([
      {
        type: "custom",
        event: CONTENT_CHANGED_EVENT,
        data: { files: ["docs/s1/topic/a.md"] },
      },
    ]);
  }),
);
