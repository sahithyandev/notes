import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";

const BULLET_RE = /^[-*+]\s/;
const ORDERED_RE = /^\d+[.)]\s/;

type ListKind = "bullet" | "ordered";

// A list item that starts after blank lines only, right below an item of the
// same list kind (bullets after bullets, numbers after numbers). Markdown
// merges such items into 1 loose list (each item wrapped in a paragraph, with
// extra spacing), whether they are 2 lists or 1 list with blank lines between
// its items. A different marker starts a 2nd list that sits flush against the
// 1st. Either way the page renders oddly. Only top-level lists are checked:
// content indented under an item (nested lists, continuation paragraphs)
// stays part of that item and doesn't end the list.
export function checkAdjacentList(f: ScannedFile): Violation[] {
  const violations: Violation[] = [];

  let listKind: ListKind | null = null;
  let blankRun = 0;

  for (let i = 0; i < f.lines.length; i++) {
    if (f.lineIsCode[i]) {
      listKind = null;
      blankRun = 0;
      continue;
    }
    const line = f.lines[i];

    if (line.trim() === "") {
      blankRun++;
      continue;
    }

    const masked = f.maskedLines[i];
    const itemKind: ListKind | null = BULLET_RE.test(masked)
      ? "bullet"
      : ORDERED_RE.test(masked)
        ? "ordered"
        : null;

    if (itemKind) {
      if (itemKind === listKind && blankRun > 0) {
        violations.push({
          rule: "adjacent-list",
          line: i + 1,
          text: "list item separated from the item above only by blank lines",
          snippet: line.trim(),
        });
      }
      listKind = itemKind;
    } else if (!/^\s/.test(line)) {
      // Unindented non-item content (prose, heading, `<Note>`) ends the list.
      // Indented content belongs to the current item.
      listKind = null;
    }
    blankRun = 0;
  }

  return violations;
}
