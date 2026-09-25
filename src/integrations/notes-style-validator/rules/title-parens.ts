import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";

// Titles are rendered standalone (sidebar, page header, OG image) without
// surrounding prose, so a parenthetical reads as a dangling fragment there.
// Fold it into the main title or drop it instead.
export function checkTitleParens(f: ScannedFile): Violation[] {
  if (!f.title || !/[()]/.test(f.title)) return [];

  return [
    {
      rule: "title-parens",
      line: f.titleLine,
      text: `title contains parentheses: "${f.title}"`,
      snippet: f.title,
    },
  ];
}
