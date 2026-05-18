import { scanDocs, resolveImageCandidates, imageExists } from "./scan.ts";
import type { ScannedFile } from "./scan.ts";
import { suggest } from "./similarity.ts";
import { printReport } from "./report.ts";
import type { SimpleLogger, Violation, FileReport } from "./report.ts";

export type { Violation, FileReport };

export function buildValidUrls(scanned: ScannedFile[]): Set<string> {
  return new Set<string>(scanned.map((f) => `/${f.slug}`));
}

function buildHeadingsByUrl(scanned: ScannedFile[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const s of scanned) {
    if (s.slug) map.set(`/${s.slug}`, s.headings);
  }
  return map;
}

export function validate(
  scanned: ScannedFile[],
  validUrls: Set<string>,
): FileReport[] {
  const headingsByUrl = buildHeadingsByUrl(scanned);
  const reports: FileReport[] = [];

  for (const file of scanned) {
    const violations: Violation[] = [];

    for (const link of file.links) {
      if (link.kind === "image") {
        if (!imageExists(file.file, link.target)) {
          violations.push({
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
        if (link.anchor && !file.headings.has(link.anchor)) {
          violations.push({
            line: link.line,
            kind: "broken-anchor",
            raw: link.raw,
            target: "",
            suggestions: suggest(link.anchor, file.headings),
          });
        }
        continue;
      }

      // kind === "doc"
      const targetUrl = link.target;
      if (!validUrls.has(targetUrl)) {
        violations.push({
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
          violations.push({
            line: link.line,
            kind: "broken-anchor",
            raw: link.raw,
            target: targetUrl,
            suggestions: suggest(link.anchor, headings),
          });
        }
      }
    }

    if (violations.length > 0) reports.push({ file: file.file, violations });
  }

  return reports;
}

export async function runValidation(
  docsRoot: string,
  extraValidUrls: Iterable<string>,
  logger: SimpleLogger,
): Promise<void> {
  const scanned = scanDocs(docsRoot);
  const validUrls = buildValidUrls(scanned);
  for (const u of extraValidUrls) validUrls.add(u);

  const reports = validate(scanned, validUrls);
  printReport(reports, logger, docsRoot);
}
