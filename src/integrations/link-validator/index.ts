import { join } from "node:path";
import type { AstroIntegration, IntegrationResolvedRoute } from "astro";
import { scanDocs, resolveImageCandidates, imageExists } from "./scan.ts";
import type { ScannedFile } from "./scan.ts";
import { suggest } from "./similarity.ts";
import { printReport } from "./report.ts";
import type { FileReport, Violation } from "./report.ts";

function buildValidUrls(
  scanned: ScannedFile[],
  routes: IntegrationResolvedRoute[],
): Set<string> {
  // Primary source: frontmatter slugs — these are the actual note page URLs.
  // Routes from astro:routes:resolved only carry patterns for dynamic routes
  // like [...slug].astro, not the individual resolved paths, so we can't rely
  // on them for note URLs.
  const valid = new Set<string>(scanned.map((f) => `/${f.slug}`));

  // Also include redirect sources (module/submodule → first note) so that
  // links pointing to e.g. /s4/linear-algebra are accepted even though no
  // note has that exact slug.
  for (const route of routes) {
    if (route.type === "redirect" && route.pathname) {
      valid.add(route.pathname.replace(/\/+$/, "") || "/");
    }
  }
  return valid;
}

function buildHeadingsByUrl(scanned: ScannedFile[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const s of scanned) {
    if (s.slug) {
      map.set(`/${s.slug}`, s.headings);
    }
  }
  return map;
}

async function runValidation(
  routes: IntegrationResolvedRoute[],
  logger: { warn: (msg: string) => void; info: (msg: string) => void },
  docsRoot: string,
): Promise<void> {
  const scanned = scanDocs(docsRoot);
  const validUrls = buildValidUrls(scanned, routes);
  const headingsByUrl = buildHeadingsByUrl(scanned);

  const reports: FileReport[] = [];

  for (const file of scanned) {
    const violations: Violation[] = [];

    for (const link of file.links) {
      if (link.kind === "image") {
        if (!imageExists(file.file, link.target)) {
          const candidates = resolveImageCandidates(file.file);
          violations.push({
            line: link.line,
            kind: "missing-image",
            raw: link.raw,
            suggestions: suggest(link.target, candidates),
          });
        }
        continue;
      }

      if (link.kind === "in-page") {
        if (link.anchor && !file.headings.has(link.anchor)) {
          violations.push({
            line: link.line,
            kind: "broken-anchor",
            raw: link.raw,
            suggestions: suggest(link.anchor, file.headings),
          });
        }
        continue;
      }

      // kind === "doc"
      const targetUrl = link.target;
      const urlValid = validUrls.has(targetUrl);

      if (!urlValid) {
        violations.push({
          line: link.line,
          kind: "broken-link",
          raw: link.raw,
          suggestions: suggest(targetUrl, validUrls),
        });
        continue;
      }

      if (link.anchor) {
        const headings = headingsByUrl.get(targetUrl);
        if (headings && !headings.has(link.anchor)) {
          violations.push({
            line: link.line,
            kind: "broken-anchor",
            raw: link.raw,
            suggestions: suggest(link.anchor, headings),
          });
        }
      }
    }

    if (violations.length > 0) {
      reports.push({ file: file.file, violations });
    }
  }

  printReport(reports, logger as any, docsRoot);
}

export default function linkValidator(): AstroIntegration {
  let docsRoot = "";
  let capturedRoutes: IntegrationResolvedRoute[] = [];

  return {
    name: "link-validator",
    hooks: {
      "astro:config:setup": ({ config }) => {
        docsRoot = join(config.root.pathname.replace(/\/$/, ""), "docs");
      },

      "astro:routes:resolved": ({ routes }) => {
        capturedRoutes = routes;
      },

      "astro:server:start": async ({ logger }) => {
        await runValidation(capturedRoutes, logger, docsRoot);
      },

      "astro:build:done": async ({ logger }) => {
        await runValidation(capturedRoutes, logger, docsRoot);
      },
    },
  };
}
