import { scanHeadings } from "./scan.ts";
import { checkTitleCase } from "./titlecase.ts";
import { printReport } from "./report.ts";
import type { SimpleLogger, Violation, FileReport } from "./report.ts";

export type { Violation, FileReport };

export function validate(docsRoot: string): FileReport[] {
  const scanned = scanHeadings(docsRoot);
  const reports: FileReport[] = [];

  for (const file of scanned) {
    const violations: Violation[] = [];

    if (file.title) {
      const { ok, corrected } = checkTitleCase(file.title);
      if (!ok) {
        violations.push({
          line: file.titleLine,
          kind: "title",
          label: "title",
          text: file.title,
          corrected,
        });
      }
    }

    for (const h of file.headings) {
      const { ok, corrected } = checkTitleCase(h.text);
      if (!ok) {
        violations.push({
          line: h.line,
          kind: "heading",
          label: `h${h.level}`,
          text: h.text,
          corrected,
        });
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
