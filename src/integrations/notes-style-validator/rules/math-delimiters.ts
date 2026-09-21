import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";

// remark-math only recognizes `$...$` (inline) and `$$...$$` (block). The
// LaTeX-native `\(...\)` / `\[...\]` delimiters parse as literal backslash
// text instead of math, so equations written with them silently fail to
// render on the published page.
const BLOCK_DELIM_RE = /^\s*\\[[\]]\s*$/;
const INLINE_DELIM_RE = /\\[()]/g;

export function checkMathDelimiters(f: ScannedFile): Violation[] {
  const violations: Violation[] = [];

  for (let i = 0; i < f.lines.length; i++) {
    if (f.lineIsCode[i]) continue;
    const line = f.lines[i];
    const masked = f.maskedLines[i];

    if (BLOCK_DELIM_RE.test(masked)) {
      violations.push({
        rule: "math-delimiters",
        line: i + 1,
        text: `"${line.trim()}" is not a valid math delimiter, use "$$" instead`,
        snippet: line.trim(),
      });
      continue;
    }

    let m: RegExpExecArray | null;
    INLINE_DELIM_RE.lastIndex = 0;
    while ((m = INLINE_DELIM_RE.exec(masked))) {
      violations.push({
        rule: "math-delimiters",
        line: i + 1,
        text: `"${line.slice(m.index, m.index + m[0].length)}" is not a valid math delimiter, use "$" instead`,
        snippet: m[0],
      });
    }
  }

  return violations;
}
