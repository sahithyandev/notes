import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";
import { mathBlockDepth } from "../../../utils/math-blocks.ts";

const OPEN_RE = /<(Theorem|Definition|Proof|Formula|Note)\b([^>]*)>/;
const CLOSE_RE = /<\/(Theorem|Definition|Proof|Formula|Note)>/;
const PROOF_HINT_RE = /\blabel\s*=\s*(?:"Proof Hint"|'Proof Hint')/;
const LEVEL_RE = /\blevel\s*=\s*(?:"([^"]*)"|'([^']*)')/;

function displayMathDelimiters(line: string): number[] {
  const delimiters: number[] = [];

  for (let i = 0; i < line.length; i++) {
    if (line[i] === "`") {
      const run = line.slice(i).match(/^`+/)![0];
      const close = line.indexOf(run, i + run.length);
      if (close !== -1) i = close + run.length - 1;
      continue;
    }
    if (line.startsWith("$$", i)) {
      delimiters.push(i);
      i++;
    }
  }

  return delimiters;
}

function isPeriodTerminated(value: string): boolean {
  return value.trimEnd().endsWith(".");
}

export interface MathBlockPeriodEdit {
  line: number;
  start: number;
  end: number;
}

function terminalPeriodEdit(
  lines: string[],
  line: number,
): MathBlockPeriodEdit {
  const end = lines[line - 1].trimEnd().length;
  return { line, start: end - 1, end };
}

/** Finds the exact periods that can be removed to fix display math blocks. */
export function findMathBlockPeriodEdits(
  f: ScannedFile,
): MathBlockPeriodEdit[] {
  const edits: MathBlockPeriodEdit[] = [];
  let displayMath: { content: string; lastContentLine: number } | null = null;

  for (let i = 0; i < f.lines.length; i++) {
    if (f.lineIsCode[i]) continue;
    const line = f.lines[i];

    if (displayMath) {
      if (/^\s*\$\$\s*$/.test(line)) {
        if (isPeriodTerminated(displayMath.content)) {
          edits.push(terminalPeriodEdit(f.lines, displayMath.lastContentLine));
        }
        displayMath = null;
      } else {
        displayMath.content += `\n${line}`;
        displayMath.lastContentLine = i + 1;
      }
      continue;
    }

    const delimiters = displayMathDelimiters(line);
    if (delimiters.length >= 2) {
      for (let j = 0; j + 1 < delimiters.length; j += 2) {
        const contentStart = delimiters[j] + 2;
        const contentEnd = delimiters[j + 1];
        const content = line.slice(contentStart, contentEnd);
        if (isPeriodTerminated(content)) {
          const end = contentEnd - (content.length - content.trimEnd().length);
          edits.push({ line: i + 1, start: end - 1, end });
        }
      }
    } else if (/^\s*\$\$\s*$/.test(line)) {
      displayMath = { content: "", lastContentLine: i + 1 };
    }
  }

  return edits;
}

// Three checks on the structured math components:
// - <Proof> must directly follow a closed <Theorem> (only blank lines or a
//   <Note> may sit between them), since it proves that theorem's statement.
// - Two <Formula> blocks separated by only blank lines should be merged into
//   one aligned $$ block.
//   The exception is label="Proof Hint", which follows a plain claim.
// - A <Theorem>/<Definition> `level` must be 2 or 3.
// - Display math must not end with a period; punctuation belongs in the prose
//   around the equation rather than in the equation itself.
export function checkMathBlock(f: ScannedFile): Violation[] {
  const violations: Violation[] = [];

  // Tag that closed most recently at top level, cleared by any real content.
  let lastClosed: { tag: string; line: number } | null = null;
  let openTag: string | null = null;
  let depth = 0;
  // What `lastClosed` was before the current <Note> opened.
  let resume: { tag: string; line: number } | null = null;

  for (const edit of findMathBlockPeriodEdits(f)) {
    violations.push({
      rule: "math-block",
      line: edit.line,
      text: "math blocks must not end with a period",
      snippet: "period-terminated-math",
    });
  }

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
