import { close as closePagefind, createIndex } from "pagefind";
import type { PagefindIndex } from "pagefind";
import { relative, resolve } from "node:path";
import type { ViteDevServer } from "vite";
import { slugFromDocsPath } from "../../utils/note-path";

type PagefindFile = { path: string; content: Uint8Array };
type DevIndexCache = {
  files: Map<string, PagefindFile> | null;
  pages: Map<string, string>;
  buildPromise: Promise<Map<string, PagefindFile>> | null;
  fullRefresh: boolean;
  dirtyPages: Set<string>;
  revision: number;
};

const PAGEFIND_PREFIX = "/pagefind/";
const SKIP_PATHS = ["/api/", "/og/", PAGEFIND_PREFIX];
const GENERATED_PATHS = ["/.astro/", "/.vercel/", "/dist/", "/node_modules/"];
const indexCaches = new Map<string, DevIndexCache>();

function cacheFor(root: string): DevIndexCache {
  let cache = indexCaches.get(root);
  if (!cache) {
    cache = {
      files: null,
      pages: new Map(),
      buildPromise: null,
      fullRefresh: true,
      dirtyPages: new Set(),
      revision: 0,
    };
    indexCaches.set(root, cache);
  }
  return cache;
}

function isIndexablePath(pathname: string): boolean {
  if (!pathname.startsWith("/")) return false;
  if (SKIP_PATHS.some((prefix) => pathname.startsWith(prefix))) return false;
  return !pathname.match(
    /\.(?:css|js|json|xml|txt|png|jpe?g|svg|webp|ico|woff2?)$/i,
  );
}

function linkedPaths(html: string, origin: string): string[] {
  const paths = new Set<string>();
  const hrefPattern = /\bhref\s*=\s*["']([^"']+)["']/gi;

  for (const match of html.matchAll(hrefPattern)) {
    try {
      const url = new URL(match[1], origin);
      if (url.origin !== origin || !isIndexablePath(url.pathname)) continue;
      paths.add(url.pathname);
    } catch {
      // Ignore malformed or non-URL hrefs in rendered markup.
    }
  }

  return [...paths];
}

async function fetchPage(origin: string, pathname: string) {
  const response = await fetch(new URL(pathname, origin), {
    headers: { accept: "text/html" },
  });
  if (
    !response.ok ||
    !response.headers.get("content-type")?.includes("text/html")
  ) {
    return null;
  }
  return response.text();
}

async function crawlSite(origin: string) {
  const pending = ["/"];
  const visited = new Set<string>();
  const pages = new Map<string, string>();

  while (pending.length > 0) {
    const pathname = pending.shift()!;
    if (visited.has(pathname)) continue;
    visited.add(pathname);

    const html = await fetchPage(origin, pathname);
    if (!html) continue;
    pages.set(pathname, html);

    for (const linkedPath of linkedPaths(html, origin)) {
      if (!visited.has(linkedPath)) pending.push(linkedPath);
    }
  }

  return pages;
}

function contentType(pathname: string): string {
  if (pathname.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (pathname.endsWith(".css")) return "text/css; charset=utf-8";
  if (pathname.endsWith(".json")) return "application/json; charset=utf-8";
  if (pathname.endsWith(".wasm")) return "application/wasm";
  return "application/octet-stream";
}

function changedNoteUrl(root: string, pathname: string): string | null {
  const docsRoot = resolve(root, "docs");
  const relativePath = relative(docsRoot, resolve(pathname));
  if (
    relativePath.startsWith("..") ||
    !relativePath.match(/\.mdx?$/i) ||
    relativePath.includes("\\")
  ) {
    return null;
  }
  return `/${slugFromDocsPath(relativePath)}`;
}

function sourcePath(root: string, pathname: string): string {
  return relative(root, resolve(pathname)).split("\\").join("/");
}

export default function pagefindDev() {
  return {
    name: "pagefind-dev",
    hooks: {
      "astro:server:setup"({ server }: { server: ViteDevServer }) {
        const cache = cacheFor(server.config.root);
        const root = server.config.root;
        let watching = false;

        const invalidateAll = () => {
          cache.revision += 1;
          cache.fullRefresh = true;
          cache.files = null;
        };

        const invalidatePage = (pathname: string) => {
          cache.revision += 1;
          cache.dirtyPages.add(pathname);
          cache.files = null;
        };

        const buildIndex = async (origin: string) => {
          const buildRevision = cache.revision;
          const result = await createIndex();
          if (result.errors.length > 0 || !result.index) {
            throw new Error(
              result.errors.join("\n") || "Pagefind index creation failed",
            );
          }

          try {
            let nextPages = cache.pages;
            if (cache.fullRefresh || cache.pages.size === 0) {
              nextPages = await crawlSite(origin);
            } else {
              nextPages = new Map(cache.pages);
              for (const pathname of cache.dirtyPages) {
                const html = await fetchPage(origin, pathname);
                if (html) nextPages.set(pathname, html);
                else nextPages.delete(pathname);
              }
            }

            for (const [url, content] of nextPages) {
              const indexed = await result.index.addHTMLFile({
                url,
                content,
              });
              if (indexed.errors.length > 0) {
                throw new Error(indexed.errors.join("\n"));
              }
            }

            const output = await result.index.getFiles();
            if (output.errors.length > 0)
              throw new Error(output.errors.join("\n"));

            const nextFiles = new Map(
              output.files.map((file) => [file.path, file] as const),
            );
            if (buildRevision === cache.revision) {
              cache.pages = nextPages;
              cache.dirtyPages.clear();
              cache.fullRefresh = false;
            }
            cache.files = nextFiles;
            return nextFiles;
          } finally {
            await closePagefind();
          }
        };

        const ensureFiles = (origin: string) => {
          if (
            cache.files &&
            !cache.fullRefresh &&
            cache.dirtyPages.size === 0
          ) {
            return Promise.resolve(cache.files);
          }
          if (!cache.buildPromise) {
            cache.buildPromise = buildIndex(origin).finally(() => {
              cache.buildPromise = null;
            });
          }
          return cache.buildPromise;
        };

        const isGeneratedPath = (pathname: string) => {
          const relativePath = sourcePath(root, pathname);
          return GENERATED_PATHS.some((prefix) =>
            relativePath.startsWith(prefix.slice(1)),
          );
        };

        const handleChange = (
          event: "change" | "add" | "unlink",
          pathname: string,
        ) => {
          if (!watching) return;
          if (isGeneratedPath(pathname)) return;

          const relativePath = sourcePath(root, pathname);
          const noteUrl = changedNoteUrl(root, pathname);
          if (noteUrl && event === "change") {
            invalidatePage(noteUrl);
            return;
          }

          if (
            noteUrl ||
            relativePath.startsWith("src/pages/") ||
            relativePath.startsWith("src/components/") ||
            relativePath.startsWith("src/layouts/") ||
            relativePath === "src/content.config.ts"
          ) {
            invalidateAll();
          }
        };

        server.watcher.on("change", (pathname) =>
          handleChange("change", pathname),
        );
        server.watcher.on("add", (pathname) => handleChange("add", pathname));
        server.watcher.on("unlink", (pathname) =>
          handleChange("unlink", pathname),
        );
        watching = true;

        server.middlewares.use(async (req, res, next) => {
          if (!req.url?.startsWith(PAGEFIND_PREFIX)) return next();

          const pathname = req.url.split(/[?#]/)[0];
          const assetPath = pathname.slice(PAGEFIND_PREFIX.length);
          if (!assetPath || assetPath.includes("..")) {
            res.statusCode = 404;
            res.end();
            return;
          }

          try {
            const host = req.headers.host ?? "localhost";
            const protocol = req.headers["x-forwarded-proto"] ?? "http";
            const origin = `${protocol}://${host}`;
            const indexFiles = await ensureFiles(origin);
            const file = indexFiles.get(assetPath);
            if (!file) {
              res.statusCode = 404;
              res.end();
              return;
            }

            res.setHeader("Content-Type", contentType(assetPath));
            res.setHeader("Cache-Control", "no-store");
            res.end(Buffer.from(file.content));
          } catch (error) {
            server.config.logger.error(
              `Failed to build the development Pagefind index: ${error instanceof Error ? error.message : String(error)}`,
            );
            res.statusCode = 500;
            res.end();
          }
        });
      },
    },
  };
}
