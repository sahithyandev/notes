// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import remarkMath from "remark-math";
import mdx from "@astrojs/mdx";
import vercel from "@astrojs/vercel";
import moduleRedirects from "./src/integrations/module-redirects/index.ts";
import notesStyleValidator from "./src/integrations/notes-style-validator/index.ts";
import devReloadLock from "./src/integrations/dev-reload-lock/index.ts";
import remarkGfm from "remark-gfm";
import katex from "katex";
import { visit } from "unist-util-visit";
import { toHast } from "mdast-util-to-hast";
import { toHtml } from "hast-util-to-html";
import "katex/contrib/mhchem";
import { unified } from "@astrojs/markdown-remark";
import fs from "node:fs";
import path from "node:path";

// Serves a prebuilt pagefind index (`bun run build`) under /pagefind during
// `astro dev`, since pagefind itself only runs as a post-build step against
// the static output and dev mode has no static output to index.
function servePagefindDev() {
  const pagefindDir = path.resolve(".vercel/output/static/pagefind");
  return {
    name: "serve-pagefind-dev",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith("/pagefind/")) return next();
        const urlPath = req.url.split(/[?#]/)[0];
        const filePath = path.join(
          pagefindDir,
          decodeURIComponent(urlPath.slice("/pagefind/".length)),
        );
        if (!filePath.startsWith(pagefindDir) || !fs.existsSync(filePath)) {
          return next();
        }
        if (filePath.endsWith(".js")) {
          res.setHeader("Content-Type", "text/javascript");
        } else if (filePath.endsWith(".json")) {
          res.setHeader("Content-Type", "application/json");
        }
        fs.createReadStream(filePath).pipe(res);
      });
    },
  };
}

function render(value, displayMode) {
  return katex.renderToString(value, {
    displayMode,
    throwOnError: false,
    trust: true,
    strict: false,
  });
}

export function remarkKatexMhchem() {
  return (tree, file) => {
    visit(tree, (node, index, parent) => {
      if (!parent || typeof index !== "number") return;

      if (node.type === "inlineMath") {
        parent.children[index] = {
          type: "html",
          value: render(node.value, false),
        };
      }

      if (node.type === "math") {
        parent.children[index] = {
          type: "html",
          value: render(node.value, true),
        };
      }
    });

    // Astro's TOC heading text is extracted from the rendered page HTML
    // before math is parsed back out of its raw HTML node, so it ends up
    // concatenating the KaTeX MathML annotation, the raw TeX source, and
    // the visible glyphs all at once. Render each heading's own markup
    // (post math substitution, above) here instead, so [...slug].astro can
    // pass real KaTeX HTML to the TOC rather than Astro's mangled text.
    const headingHtml = [];
    visit(tree, "heading", (node) => {
      const inline = { type: "root", children: node.children };
      headingHtml.push(
        toHtml(toHast(inline, { allowDangerousHtml: true }), {
          allowDangerousHtml: true,
        }),
      );
    });
    file.data.astro ??= {};
    file.data.astro.frontmatter ??= {};
    file.data.astro.frontmatter.headingHtml = headingHtml;
  };
}

// https://astro.build/config
export default defineConfig({
  output: "server",
  // ponytail: v7 changed default to 'jsx'; preserve v6 whitespace behavior
  compressHTML: true,
  redirects: {
    "/security": "https://sahithyan.dev/security",
  },
  server: {
    allowedHosts: process.env.NODE_ENV == "development" ? true : undefined,
  },
  integrations: [
    moduleRedirects(),
    mdx({
      // optimize hoists/pre-renders literal Markdown HTML elements in a way
      // that bypasses <Content components={{...}} /> overrides (e.g. the
      // `table` override below never fires with this on).
      optimize: false,
    }),
    notesStyleValidator(),
  ],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkGfm, remarkMath, remarkKatexMhchem],
    }),
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "github-dark-dimmed",
      },
      defaultColor: false,
    },
  },
  vite: {
    plugins: [tailwindcss(), servePagefindDev(), devReloadLock()],
    build: {
      // ponytail: lightningcss fails with Tailwind v4 CSS under Vite 8/rolldown; esbuild works fine
      cssMinify: "esbuild",
      rollupOptions: {
        external: ["/pagefind/pagefind.js"],
      },
    },
  },
  adapter: vercel({
    isr: {
      expiration: 60 * 60 * 24, // 24 hours default; per-page revalidate overrides this
      // API routes must run per request: the ISR function only forwards the
      // Astro path param, so query params like ?slug=... get stripped and
      // every slug shares one cached GET response.
      exclude: [/^\/api\//],
    },
  }),
});
