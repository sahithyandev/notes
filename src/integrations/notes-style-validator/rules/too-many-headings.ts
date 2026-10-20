import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";

// A note with this many headings is better split into several notes than
// kept as one long page with a crowded sidebar TOC.
const MAX_HEADINGS = 40;

// Counts h2 to h4, the levels the TOC shows. The h1 is the page title.
export function checkTooManyHeadings(f: ScannedFile): Violation[] {
  const counted = f.headings.filter((h) => h.level >= 2 && h.level <= 4);
  if (counted.length <= MAX_HEADINGS) return [];

  return [
    {
      rule: "too-many-headings",
      line: counted[MAX_HEADINGS].line,
      text: `note has ${counted.length} headings, over the ${MAX_HEADINGS} limit`,
      snippet: String(counted.length),
    },
  ];
}
