// Offline support. Bump VERSION whenever the caching logic changes.
// Keep AT_HEADER, MAX_AGE_MS and the "sn-pages-" prefix in sync with
// src/scripts/offline.ts, which reads the page cache directly.
const VERSION = "v1";
const PAGES = `sn-pages-${VERSION}`;
const ASSETS = `sn-assets-${VERSION}`;
const CDN = `sn-cdn-${VERSION}`;
const AT_HEADER = "sn-cached-at";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const PURGE_INTERVAL_MS = 6 * 60 * 60 * 1000;
const OFFLINE_PATH = "/offline";
const PRECACHE = [
  "/site.webmanifest",
  "/favicon.svg",
  "/apple-touch-icon.png",
  "/android-chrome-192x192.png",
];
const CDN_HOSTS = new Set([
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "cdn.jsdelivr.net",
]);
// Only the Google Fonts stylesheet changes under a fixed URL.
const REVALIDATED_CDN_HOSTS = new Set(["fonts.googleapis.com"]);
const NEVER_CACHE_PREFIXES = ["/api/", "/og/", "/pagefind/"];

let lastPurge = 0;
// A reload is answered from the cache before the new document exists, so the
// "updated" message can reach the page that is going away. The new page asks
// for the pending update itself.
const PENDING_UPDATE_MS = 60 * 1000;
const pendingUpdates = new Map();

function pagePath(pathname) {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

function pageKey(pathname) {
  return self.location.origin + pagePath(pathname);
}

// A path with no file extension in its last segment is a page.
function isPagePath(pathname) {
  return !/\.[a-z0-9]+$/i.test(pathname);
}

function isAsset(pathname) {
  return pathname.startsWith("/_astro/") || /\.(css|js)$/.test(pathname);
}

function isFresh(response) {
  const at = Number(response.headers.get(AT_HEADER));
  return at > 0 && Date.now() - at < MAX_AGE_MS;
}

async function put(cache, key, response) {
  const headers = new Headers(response.headers);
  // The body is already decoded once it reaches the worker.
  headers.delete("content-encoding");
  headers.delete("content-length");
  headers.set(AT_HEADER, String(Date.now()));
  const body = await response.blob();
  await cache.put(
    key,
    new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    }),
  );
}

function fetchForCache(url) {
  const external = new URL(url).origin !== self.location.origin;
  return fetch(
    url,
    external ? { mode: "cors", credentials: "omit" } : undefined,
  );
}

function fingerprint(response) {
  return (
    response.headers.get("etag") || response.headers.get("last-modified") || ""
  );
}

async function notifyUpdated(path) {
  pendingUpdates.set(path, Date.now());
  const clients = await self.clients.matchAll({ type: "window" });
  for (const client of clients) {
    client.postMessage({ type: "sn:updated", url: path });
  }
}

async function purgeExpired() {
  lastPurge = Date.now();
  for (const name of await caches.keys()) {
    if (!name.startsWith("sn-") || !name.endsWith(VERSION)) continue;
    const cache = await caches.open(name);
    for (const request of await cache.keys()) {
      if (new URL(request.url).pathname === OFFLINE_PATH) continue;
      const response = await cache.match(request);
      if (response && !isFresh(response)) await cache.delete(request);
    }
  }
}

function maybePurge(event) {
  if (Date.now() - lastPurge > PURGE_INTERVAL_MS) {
    event.waitUntil(purgeExpired());
  }
}

// Stale-while-revalidate for HTML. Only real navigations (and pages the
// visitor opened through soft navigation, see "sn:cache-urls") get stored.
// Hover previews merely refresh pages that are already cached.
async function handlePage(event, request, url) {
  const cache = await caches.open(PAGES);
  const key = pageKey(url.pathname);
  const cached = await cache.match(key);
  const usable = cached && isFresh(cached);
  const navigating = request.mode === "navigate";

  const revalidate = async () => {
    const response = await fetch(key);
    if (response.status !== 200 || response.redirected) return response;
    if (cached || navigating) {
      await put(cache, key, response.clone());
      if (cached && fingerprint(cached) !== fingerprint(response)) {
        await notifyUpdated(pagePath(url.pathname));
      }
    }
    return response;
  };

  if (usable) {
    event.waitUntil(revalidate().catch(() => {}));
    return cached;
  }

  try {
    return await revalidate();
  } catch {
    if (navigating) {
      const fallback = await caches.match(pageKey(OFFLINE_PATH));
      if (fallback) return fallback;
    }
    return new Response("Offline", {
      status: 503,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

async function cacheFirst(cacheName, request) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request.url);
  if (cached && isFresh(cached)) return cached;
  try {
    const response = await fetchForCache(request.url);
    if (response.ok) await put(cache, request.url, response.clone());
    return response;
  } catch (error) {
    if (cached) return cached;
    throw error;
  }
}

async function staleWhileRevalidate(event, cacheName, request) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request.url);
  const revalidate = async () => {
    const response = await fetchForCache(request.url);
    if (response.ok) await put(cache, request.url, response.clone());
    return response;
  };
  if (cached && isFresh(cached)) {
    event.waitUntil(revalidate().catch(() => {}));
    return cached;
  }
  try {
    return await revalidate();
  } catch (error) {
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const pages = await caches.open(PAGES);
      const assets = await caches.open(ASSETS);
      for (const path of PRECACHE) {
        await put(assets, self.location.origin + path, await fetch(path));
      }

      // The offline page must render without a network, so keep the
      // stylesheets and scripts it references too.
      const html = await (await fetch(OFFLINE_PATH)).text();
      await put(
        pages,
        pageKey(OFFLINE_PATH),
        new Response(html, { headers: { "Content-Type": "text/html" } }),
      );
      const cdn = await caches.open(CDN);
      const seen = new Set();
      const store = async (href) => {
        if (seen.has(href)) return;
        seen.add(href);
        const url = new URL(href);
        const external = url.origin !== self.location.origin;
        if (url.pathname === "/") return;
        if (external ? !CDN_HOSTS.has(url.host) : !isAsset(url.pathname)) {
          return;
        }
        // A flaky CDN must not block installing the worker.
        const response = await fetchForCache(href).catch((error) => {
          if (!external) throw error;
        });
        if (!response?.ok) return;
        const isScript = url.pathname.endsWith(".js");
        const text = isScript ? await response.clone().text() : "";
        await put(external ? cdn : assets, href, response);
        // Scripts pull in shared chunks with relative ES imports.
        await Promise.all(
          [...text.matchAll(/["'](\.\/[^"']+\.js)["']/g)].map((match) =>
            store(new URL(match[1], href).href),
          ),
        );
      };
      await Promise.all(
        [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
          .map((match) => new URL(match[1], self.location.origin).href)
          .map(store),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (name.startsWith("sn-") && !name.endsWith(VERSION)) {
          await caches.delete(name);
        }
      }
      await self.clients.claim();
      await purgeExpired();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || request.headers.has("range")) return;
  if ((request.headers.get("accept") || "").includes("text/event-stream")) {
    return;
  }
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    if (!CDN_HOSTS.has(url.host)) return;
    event.respondWith(
      REVALIDATED_CDN_HOSTS.has(url.host)
        ? staleWhileRevalidate(event, CDN, request)
        : cacheFirst(CDN, request),
    );
    return;
  }

  const path = url.pathname;
  if (path === "/sw.js") return;
  if (NEVER_CACHE_PREFIXES.some((prefix) => path.startsWith(prefix))) return;

  maybePurge(event);

  if (request.mode === "navigate" || isPagePath(path)) {
    event.respondWith(handlePage(event, request, url));
  } else if (path.startsWith("/_astro/")) {
    event.respondWith(cacheFirst(ASSETS, request));
  } else if (
    ["style", "script", "font", "image", "manifest"].includes(
      request.destination,
    )
  ) {
    event.respondWith(staleWhileRevalidate(event, ASSETS, request));
  }
});

// The page asks the worker to store what it already loaded before the worker
// controlled it, and to store pages shown through soft navigation.
async function cacheUrls({ page, assets }) {
  if (page) {
    const key = pageKey(page);
    const response = await fetch(key);
    if (response.status === 200 && !response.redirected) {
      await put(await caches.open(PAGES), key, response);
    }
  }
  for (const href of assets || []) {
    let url;
    try {
      url = new URL(href);
    } catch {
      continue;
    }
    const external = url.origin !== self.location.origin;
    if (external ? !CDN_HOSTS.has(url.host) : isPagePath(url.pathname)) {
      continue;
    }
    if (
      !external &&
      NEVER_CACHE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))
    ) {
      continue;
    }
    const cache = await caches.open(external ? CDN : ASSETS);
    const existing = await cache.match(url.href);
    if (existing && isFresh(existing)) continue;
    try {
      const response = await fetchForCache(url.href);
      if (response.ok) await put(cache, url.href, response);
    } catch {}
  }
}

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "sn:online") {
    event.waitUntil(purgeExpired());
  } else if (data.type === "sn:take-update") {
    const at = pendingUpdates.get(data.page);
    pendingUpdates.delete(data.page);
    event.ports[0]?.postMessage(
      at !== undefined && Date.now() - at < PENDING_UPDATE_MS,
    );
  } else if (data.type === "sn:cache-urls") {
    const port = event.ports[0];
    event.waitUntil(
      cacheUrls(data)
        .then(() => port?.postMessage(true))
        .catch(() => port?.postMessage(false)),
    );
  }
});
