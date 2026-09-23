import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";

// Titles render standalone (sidebar, page header, browser tab, OG image),
// so a long one wraps awkwardly or gets truncated instead of just reading
// as a dense sentence the way it would in prose.
const MAX_TITLE_LENGTH = 40;

// "Introduction to X" is a fixed, load-bearing pattern across the corpus
// (module/topic openers) and reads fine at any length, unlike an ad hoc
// long title elsewhere.
const EXEMPT_PREFIX = /^Introduction to /;

export function checkTitleLength(f: ScannedFile): Violation[] {
  if (!f.title || f.title.length <= MAX_TITLE_LENGTH) return [];
  if (EXEMPT_PREFIX.test(f.title)) return [];

  return [
    {
      rule: "title-length",
      line: f.titleLine,
      text: `title is ${f.title.length} characters, over the ${MAX_TITLE_LENGTH} limit: "${f.title}"`,
      snippet: f.title,
    },
  ];
}
