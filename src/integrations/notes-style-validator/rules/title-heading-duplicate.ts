import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";

// Strips markdown formatting from heading text (bold, italic, backticks,
// links), same as scan.ts's internal stripHeadingMarkdown, so a heading like
// "**Demand**" still matches a plain-text title.
function stripHeadingMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`]/g, "")
    .trim();
}

// The page's own <h1> is the `title` frontmatter field, so a heading that
// repeats it verbatim is a redundant, empty-content section: the reader
// already saw it as the page title.
export function checkTitleHeadingDuplicate(f: ScannedFile): Violation[] {
  if (!f.title) return [];
  const violations: Violation[] = [];
  const normalizedTitle = f.title.trim().toLowerCase();

  for (const h of f.headings) {
    const normalizedHeading = stripHeadingMarkdown(h.text).toLowerCase();
    if (normalizedHeading === normalizedTitle) {
      violations.push({
        rule: "title-heading-duplicate",
        line: h.line,
        text: `h${h.level} "${h.text}" repeats the title "${f.title}"`,
        snippet: h.text,
      });
    }
  }

  return violations;
}
