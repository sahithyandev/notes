import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";
import { mathBlockDepth } from "../../../utils/math-blocks.ts";

const OPEN_RE = /<(Theorem|Definition|Proof|Formula|Note)\b([^>]*)>/;
const CLOSE_RE = /<\/(Theorem|Definition|Proof|Formula|Note)>/;
const PROOF_HINT_RE = /\blabel\s*=\s*(?:"Proof Hint"|'Proof Hint')/;
const LEVEL_RE = /\blevel\s*=\s*(?:"([^"]*)"|'([^']*)')/;

// Three checks on the structured math components:
// - <Proof> must directly follow a closed <Theorem> (only blank lines or a
//   <Note> may sit between them), since it proves that theorem's statement.
// - Two <Formula> blocks separated by only blank lines should be merged into
//   one aligned $$ block.
//   The exception is label="Proof Hint", which follows a plain claim.
// - A <Theorem>/<Definition> `level` must be 2 or 3.
export function checkMathBlock(f: ScannedFile): Violation[] {
  const violations: Violation[] = [];

  // Tag that closed most recently at top level, cleared by any real content.
  let lastClosed: { tag: string; line: number } | null = null;
  let openTag: string | null = null;
  let depth = 0;
  // What `lastClosed` was before the current <Note> opened.
  let resume: { tag: string; line: number } | null = null;

  for (let i = 0; i < f.lines.length; i++) {
    if (f.lineIsCode[i]) continue;
    const line = f.lines[i];

    if (openTag !== null) {
      const open = OPEN_RE.exec(line);
      if (open && open[1] === openTag) depth++;
      const close = CLOSE_RE.exec(line);
      if (close && close[1] === openTag && --depth === 0) {
        lastClosed = openTag === "Note" ? resume : { tag: openTag, line: i };
        openTag = null;
      }
      continue;
    }

    if (line.trim() === "") continue;

    const open = OPEN_RE.exec(line);
    if (!open) {
      lastClosed = null;
      continue;
    }

    const [, tag, attrs] = open;

    if (tag === "Theorem" || tag === "Definition") {
      const level = LEVEL_RE.exec(attrs);
      if (level && mathBlockDepth(level[1] ?? level[2]) === null) {
        violations.push({
          rule: "math-block",
          line: i + 1,
          text: `<${tag}> level must be "2" or "3"`,
          snippet: `level:${level[1] ?? level[2]}`,
        });
      }
    }

    if (
      tag === "Proof" &&
      lastClosed?.tag !== "Theorem" &&
      !PROOF_HINT_RE.test(attrs)
    ) {
      violations.push({
        rule: "math-block",
        line: i + 1,
        text: "<Proof> must directly follow the <Theorem> it proves",
        snippet: "orphan-proof",
      });
    }

    if (tag === "Formula" && lastClosed?.tag === "Formula") {
      violations.push({
        rule: "math-block",
        line: i + 1,
        text: `<Formula> opens right after another one closed at L${lastClosed.line + 1}, merge them into 1 aligned $$ block`,
        snippet: "adjacent-formula",
      });
    }

    // A <Note> between a theorem and its proof leaves the theorem as the
    // "last closed" block; any other tag replaces it.
    resume = tag === "Note" ? lastClosed : null;

    if (CLOSE_RE.test(line)) {
      lastClosed = tag === "Note" ? resume : { tag, line: i };
    } else {
      openTag = tag;
      depth = 1;
    }
  }

  return violations;
}
