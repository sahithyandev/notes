import { readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";
import { suggest } from "../core/similarity.ts";
import type { Suggestion } from "../core/similarity.ts";

export function resolveImageCandidates(sourceFile: string): string[] {
  const imagesDir = join(dirname(sourceFile), "images");
  try {
    return readdirSync(imagesDir).map((name) => `./images/${name}`);
  } catch {
    return [];
  }
}

export function imageExists(sourceFile: string, relPath: string): boolean {
  try {
    statSync(resolve(dirname(sourceFile), relPath));
    return true;
  } catch {
    return false;
  }
}

export type LinkViolationKind =
  | "broken-link"
  | "broken-anchor"
  | "missing-image";

export interface LinkViolation {
  file: string;
  line: number;
  kind: LinkViolationKind;
  /** The raw URL string as it appeared in the source markdown. */
  raw: string;
  /** Path portion of raw (no anchor, no trailing slash). Empty for in-page anchors. */
  target: string;
  suggestions: Suggestion[];
}

// Structured layer underneath checkBrokenLinks below: scripts/fix-links.ts
// needs the raw/target/suggestions detail to compute an actual replacement,
// which the formatted-text Violation the shared rule registry expects would
// throw away.
export function findBrokenLinks(
  files: ScannedFile[],
  extraValidUrls: Iterable<string> = [],
): LinkViolation[] {
  const validUrls = new Set<string>(files.map((f) => `/${f.slug}`));
  for (const u of extraValidUrls) validUrls.add(u);

  const headingsByUrl = new Map<string, Set<string>>();
  for (const f of files) {
    if (f.slug) headingsByUrl.set(`/${f.slug}`, f.headingSlugs);
  }

  const results: LinkViolation[] = [];

  for (const file of files) {
    for (const link of file.links) {
      if (link.kind === "image") {
        if (!imageExists(file.file, link.target)) {
          results.push({
            file: file.file,
            line: link.line,
            kind: "missing-image",
            raw: link.raw,
            target: link.target,
            suggestions: suggest(
              link.target,
              resolveImageCandidates(file.file),
            ),
          });
        }
        continue;
      }

      if (link.kind === "in-page") {
        if (link.anchor && !file.headingSlugs.has(link.anchor)) {
          results.push({
            file: file.file,
            line: link.line,
            kind: "broken-anchor",
            raw: link.raw,
            target: "",
            suggestions: suggest(link.anchor, file.headingSlugs),
          });
        }
        continue;
      }

      // kind === "doc"
      const targetUrl = link.target;
      if (!validUrls.has(targetUrl)) {
        results.push({
          file: file.file,
          line: link.line,
          kind: "broken-link",
          raw: link.raw,
          target: targetUrl,
          suggestions: suggest(targetUrl, validUrls),
        });
        continue;
      }

      if (link.anchor) {
        const headings = headingsByUrl.get(targetUrl);
        if (headings && !headings.has(link.anchor)) {
          results.push({
            file: file.file,
            line: link.line,
            kind: "broken-anchor",
            raw: link.raw,
            target: targetUrl,
            suggestions: suggest(link.anchor, headings),
          });
        }
      }
    }
  }

  return results;
}

const KIND_LABEL: Record<LinkViolationKind, string> = {
  "broken-link": "broken link",
  "broken-anchor": "broken anchor",
  "missing-image": "missing image",
};

function formatLinkViolation(v: LinkViolation): string {
  if (v.suggestions.length === 0) {
    return `${KIND_LABEL[v.kind]}  ${v.raw}  (no close match)`;
  }
  const list = v.suggestions.map((s) => s.candidate).join(", ");
  return `${KIND_LABEL[v.kind]}  ${v.raw}  →  ${list}`;
}

// This is the one rule that can't run per-file: broken-link validation needs
// every file's slug and headings up front (to know what a valid target even
// is) before checking any single file's links against them.
export function checkBrokenLinks(
  files: ScannedFile[],
  extraValidUrls: Iterable<string> = [],
): Array<{ file: string; violation: Violation }> {
  return findBrokenLinks(files, extraValidUrls).map((v) => ({
    file: v.file,
    violation: {
      rule: "broken-link",
      line: v.line,
      text: formatLinkViolation(v),
      snippet: v.raw,
    },
  }));
}
