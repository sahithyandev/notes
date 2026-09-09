// @ts-check
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import remarkMath from "remark-math";
import mdx from "@astrojs/mdx";
import vercel from "@astrojs/vercel";
import linkValidator from "./src/integrations/link-validator/index.ts";
import titleCase from "./src/integrations/title-case/index.ts";
import remarkGfm from "remark-gfm";
import katex from "katex";
import { visit } from "unist-util-visit";
import { toHast } from "mdast-util-to-hast";
import { toHtml } from "hast-util-to-html";
import "katex/contrib/mhchem";
import { unified } from "@astrojs/markdown-remark";

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

const FILE_PREFIX = /^(\d+)-(.+)\.mdx?$/;
const DIR_PREFIX = /^(\d+)-(.+)$/;
const EXCLUDED = new Set(["images", "summary"]);

/** @param {string} p */
function isDir(p) {
  return statSync(p).isDirectory();
}

/** @param {string} dir @returns {string[]} */
function subdirs(dir) {
  return readdirSync(dir).filter(
    (name) => !EXCLUDED.has(name) && isDir(join(dir, name)),
  );
}

/** @param {string} name @returns {string} */
function stripDirPrefix(name) {
  const m = DIR_PREFIX.exec(name);
  return m ? m[2] : name;
}

/**
 * Recursively finds the slug of the lowest-order note under `dir`.
 * @param {string} dir
 * @returns {{ order: number, slug: string } | null}
 */
function firstNote(dir) {
  /** @type {{ order: number, slug: string } | null} */
  let best = null;

  for (const name of readdirSync(dir)) {
    if (EXCLUDED.has(name)) continue;
    const full = join(dir, name);

    let candidate;
    if (isDir(full)) {
      const sub = firstNote(full);
      if (sub)
        candidate = {
          order: sub.order,
          slug: `${stripDirPrefix(name)}/${sub.slug}`,
        };
    } else {
      const m = FILE_PREFIX.exec(name);
      if (m) candidate = { order: Number(m[1]), slug: m[2] };
    }

    if (candidate && (!best || candidate.order < best.order)) best = candidate;
  }

  return best;
}

function buildModuleRedirects() {
  const docsRoot = join(process.cwd(), "docs");
  /** @type {Record<string, import('astro').RedirectConfig>} */
  const redirects = {};
  let count = 0;

  for (const sem of subdirs(docsRoot)) {
    const semDir = join(docsRoot, sem);

    for (const mod of subdirs(semDir).sort()) {
      const modDir = join(semDir, mod);

      const modFirst = firstNote(modDir);
      if (modFirst) {
        redirects[`/${sem}/${mod}`] = `/${sem}/${mod}/${modFirst.slug}`;
        count++;
      }

      for (const sub of subdirs(modDir)) {
        const subSlug = stripDirPrefix(sub);
        const subFirst = firstNote(join(modDir, sub));
        if (subFirst) {
          redirects[`/${sem}/${mod}/${subSlug}`] =
            `/${sem}/${mod}/${subSlug}/${subFirst.slug}`;
          count++;
        }
      }
    }
  }

  console.log(`Adding ${count} module redirects`);
  return redirects;
}

// https://astro.build/config
export default defineConfig({
  output: "server",
  // ponytail: v7 changed default to 'jsx'; preserve v6 whitespace behavior
  compressHTML: true,
  redirects: buildModuleRedirects(),
  server: {
    allowedHosts: process.env.NODE_ENV == "development" ? true : undefined,
  },
  integrations: [
    mdx({
      optimize: true,
    }),
    linkValidator(),
    titleCase(),
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
    plugins: [tailwindcss()],
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
    },
  }),
});
