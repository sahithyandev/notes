import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";

const EM_DASH = "—";
const CONTEXT = 20;

// A dash that is the entire (trimmed) content of a `|`-delimited table cell
// is a padding/filler marker for an empty cell, not prose punctuation.
function isTableFillerCell(line: string, dashIndex: number): boolean {
  if (!line.includes("|")) return false;
  const cells = line.split("|");
  let pos = 0;
  for (const cell of cells) {
    const cellEnd = pos + cell.length;
    if (dashIndex >= pos && dashIndex < cellEnd) {
      return cell.trim() === EM_DASH;
    }
    pos = cellEnd + 1; // +1 for the "|" separator
  }
  return false;
}

export function checkEmDash(f: ScannedFile): Violation[] {
  const violations: Violation[] = [];

  for (let i = 0; i < f.maskedLines.length; i++) {
    if (f.lineIsCode[i]) continue;
    const masked = f.maskedLines[i];
    const original = f.lines[i];

    let idx = masked.indexOf(EM_DASH);
    while (idx !== -1) {
      if (!isTableFillerCell(original, idx)) {
        const start = Math.max(0, idx - CONTEXT);
        const end = Math.min(original.length, idx + CONTEXT + 1);
        violations.push({
          rule: "em-dash",
          line: i + 1,
          text: original.slice(start, end).trim(),
          snippet: original.slice(start, end),
        });
      }
      idx = masked.indexOf(EM_DASH, idx + 1);
    }
  }

  return violations;
}
