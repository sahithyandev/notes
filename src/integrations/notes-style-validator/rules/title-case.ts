import { checkTitleCase } from "../core/titlecase.ts";
import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";

export function checkTitleCaseRule(f: ScannedFile): Violation[] {
  const violations: Violation[] = [];

  if (f.title) {
    const { ok, corrected } = checkTitleCase(f.title);
    if (!ok) {
      violations.push({
        rule: "title-case",
        line: f.titleLine,
        text: `title  ${f.title}  →  ${corrected}`,
        snippet: f.title,
      });
    }
  }

  for (const h of f.headings) {
    const { ok, corrected } = checkTitleCase(h.text);
    if (!ok) {
      violations.push({
        rule: "title-case",
        line: h.line,
        text: `h${h.level}  ${h.text}  →  ${corrected}`,
        snippet: h.text,
      });
    }
  }

  return violations;
}
