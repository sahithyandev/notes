// @ts-check
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import mdx from "@astrojs/mdx";
import vercel from "@astrojs/vercel";

// Only note files carry a numeric prefix; semester / module / submodule
// directory names do not.
const FILE_PREFIX = /^(\d+)-(.+)\.mdx?$/;
const EXCLUDED = new Set(["images", "summary"]);

/**
 * Recursively find the note (.mdx/.md) under `dir` with the lowest numeric
 * prefix anywhere in the tree. Returns { order, slugTail } where slugTail is
 * the path from `dir` to the file with prefixes stripped, or null if none.
 *
 * @param {string} dir
 * @returns {{ order: number, slugTail: string } | null}
 */
function firstNote(dir) {
  let best = null;
  for (const name of readdirSync(dir)) {
    if (EXCLUDED.has(name)) continue;
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      const sub = firstNote(full);
      if (sub && (!best || sub.order < best.order)) {
        best = { order: sub.order, slugTail: `${name}/${sub.slugTail}` };
      }
    } else {
      const m = FILE_PREFIX.exec(name);
      if (!m) continue;
      const order = Number(m[1]);
      if (!best || order < best.order) {
        best = { order, slugTail: m[2] };
      }
    }
  }
  return best;
}

function buildModuleRedirects() {
  const docsRoot = join(process.cwd(), "docs");
  /**
   * @type {Record<string, import('astro').RedirectConfig>}
   */
  const redirects = {};
  for (const sem of readdirSync(docsRoot)) {
    const semDir = join(docsRoot, sem);
    if (!statSync(semDir).isDirectory()) continue;
    for (const moduleName of readdirSync(semDir)) {
      const moduleDir = join(semDir, moduleName);
      if (EXCLUDED.has(moduleName)) continue;
      if (!statSync(moduleDir).isDirectory()) continue;

      const modFirst = firstNote(moduleDir);
      if (modFirst) {
        redirects[`/${sem}/${moduleName}`] =
          `/${sem}/${moduleName}/${modFirst.slugTail}`;
      }

      for (const sub of readdirSync(moduleDir)) {
        const subDir = join(moduleDir, sub);
        if (EXCLUDED.has(sub)) continue;
        if (!statSync(subDir).isDirectory()) continue;
        const subFirst = firstNote(subDir);
        if (subFirst) {
          redirects[`/${sem}/${moduleName}/${sub}`] =
            `/${sem}/${moduleName}/${sub}/${subFirst.slugTail}`;
        }
      }
    }
  }
  return redirects;
}

// https://astro.build/config
export default defineConfig({
  redirects: buildModuleRedirects(),
  integrations: [mdx()],
  markdown: {
    rehypePlugins: [rehypeKatex],
    remarkPlugins: [remarkMath],
  },

  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        external: ["/pagefind/pagefind.js"],
      },
    },
  },
  adapter: vercel(),
});
