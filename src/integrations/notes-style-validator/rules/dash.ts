import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";

const EM_DASH = "—";
const EN_DASH = "–";
const DASH_CHARS = [EM_DASH, EN_DASH];
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
      return DASH_CHARS.includes(cell.trim());
    }
    pos = cellEnd + 1; // +1 for the "|" separator
  }
  return false;
}

// An en dash with whitespace on either side is standing in for an em dash
// (the exact `label – description` / sentence-break misuse this rule
// exists to catch). An en dash packed tight against non-whitespace on both
// sides is its other, allowed, conventional role: a numeric range
// (`1978–2020`, `0.1–100`) or a two-part proper noun / compound
// (`Beattie–Bridgeman`, `T–S diagram`).
function isSpacedEnDash(line: string, idx: number): boolean {
  const before = line[idx - 1];
  const after = line[idx + 1];
  const beforeIsSpace = before === undefined || /\s/.test(before);
  const afterIsSpace = after === undefined || /\s/.test(after);
  return beforeIsSpace || afterIsSpace;
}

export function checkDash(f: ScannedFile): Violation[] {
  const violations: Violation[] = [];

  for (let i = 0; i < f.maskedLines.length; i++) {
    if (f.lineIsCode[i]) continue;
    const masked = f.maskedLines[i];
    const original = f.lines[i];

    for (const dashChar of DASH_CHARS) {
      let idx = masked.indexOf(dashChar);
      while (idx !== -1) {
        const allowed =
          isTableFillerCell(original, idx) ||
          (dashChar === EN_DASH && !isSpacedEnDash(original, idx));
        if (!allowed) {
          const start = Math.max(0, idx - CONTEXT);
          const end = Math.min(original.length, idx + CONTEXT + 1);
          violations.push({
            rule: "dash",
            line: i + 1,
            text: original.slice(start, end).trim(),
            snippet: original.slice(start, end),
          });
        }
        idx = masked.indexOf(dashChar, idx + 1);
      }
    }
  }

  return violations;
}
