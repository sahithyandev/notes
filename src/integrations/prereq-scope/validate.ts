import { scanPrereqs } from "./scan.ts";
import { printReport } from "./report.ts";
import type { SimpleLogger, Violation, FileReport } from "./report.ts";

export type { Violation, FileReport };

// Directory portion of a slug, e.g. "s1/mathematics/real-analysis/foo" -> "s1/mathematics/real-analysis".
function dirOf(slug: string): string {
  const idx = slug.lastIndexOf("/");
  return idx === -1 ? "" : slug.slice(0, idx);
}

function stripAnchor(slug: string): string {
  const idx = slug.indexOf("#");
  return idx === -1 ? slug : slug.slice(0, idx);
}

export function validate(docsRoot: string): FileReport[] {
  const scanned = scanPrereqs(docsRoot);
  const reports: FileReport[] = [];

  for (const file of scanned) {
    if (!file.slug) continue;
    const ownDir = dirOf(file.slug);
    const violations: Violation[] = [];

    for (const { value, line } of file.prereqs) {
      const prereqSlug = stripAnchor(value);
      if (dirOf(prereqSlug) === ownDir) {
        violations.push({ line, prereq: value });
      }
    }

    if (violations.length > 0) reports.push({ file: file.file, violations });
  }

  return reports;
}

export async function runValidation(
  docsRoot: string,
  logger: SimpleLogger,
): Promise<void> {
  printReport(validate(docsRoot), logger, docsRoot);
}
