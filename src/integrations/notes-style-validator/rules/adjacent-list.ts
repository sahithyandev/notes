import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";

const BULLET_RE = /^[-*+]\s/;

// An unordered list that starts after blank lines only, right below the end
// of another unordered list. Markdown merges 2 same-marker lists like this
// into 1 loose list (each item wrapped in a paragraph, with extra spacing),
// and a different marker starts a 2nd list that sits flush against the 1st.
// Either way the page renders oddly. Only top-level lists are checked:
// content indented under an item (nested lists, continuation paragraphs)
// stays part of that item and doesn't end the list.
export function checkAdjacentList(f: ScannedFile): Violation[] {
  const violations: Violation[] = [];

  let inList = false;
  let blankRun = 0;

  for (let i = 0; i < f.lines.length; i++) {
    if (f.lineIsCode[i]) {
      inList = false;
      blankRun = 0;
      continue;
    }
    const line = f.lines[i];

    if (line.trim() === "") {
      blankRun++;
      continue;
    }

    if (BULLET_RE.test(f.maskedLines[i])) {
      if (inList && blankRun > 0) {
        violations.push({
          rule: "adjacent-list",
          line: i + 1,
          text: "unordered list starts right after another one, separated only by blank lines",
          snippet: line.trim(),
        });
      }
      inList = true;
    } else if (!/^\s/.test(line)) {
      // Unindented non-bullet content (prose, heading, `<Note>`, ordered
      // list) ends the list. Indented content belongs to the current item.
      inList = false;
    }
    blankRun = 0;
  }

  return violations;
}
