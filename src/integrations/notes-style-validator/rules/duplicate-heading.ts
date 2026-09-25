import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";
import { slugifyHeading } from "../scan.ts";

// Strips markdown formatting from heading text (bold, italic, backticks,
// links), same as title-heading-duplicate.ts, so "**Demand**" and "Demand"
// are recognized as the same heading.
function stripHeadingMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`]/g, "")
    .trim();
}

// The page's anchor id is derived from a heading's text alone (see
// slugifyHeading in scan.ts), regardless of its level, so an h2 "Proof" and
// an h4 "Proof" later in the same note collide on the same #proof anchor.
// Only the first occurrence gets that id; any in-page link to it becomes
// ambiguous. Flag any repeat, not just same-level repeats.
export function checkDuplicateHeading(f: ScannedFile): Violation[] {
  const seen = new Map<string, number>();
  const violations: Violation[] = [];

  for (const h of f.headings) {
    const key = slugifyHeading(stripHeadingMarkdown(h.text));
    if (!key) continue;
    const firstLine = seen.get(key);
    if (firstLine !== undefined) {
      violations.push({
        rule: "duplicate-heading",
        line: h.line,
        text: `h${h.level} "${h.text}" repeats the anchor id of the heading on line ${firstLine}`,
        snippet: h.text,
      });
    } else {
      seen.set(key, h.line);
    }
  }

  return violations;
}
