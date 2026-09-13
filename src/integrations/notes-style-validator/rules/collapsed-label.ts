import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";

const BULLET_START_RE = /^(\s*)([-*])\s+(.*)$/;
const MAX_LABEL_WORDS = 5;

// Words a genuine label never ends on, because they're mid-phrase: a real
// label is a complete noun phrase ("Same row"), never a dangling preposition,
// conjunction, article, or copula ("Use of", "current operated protection -").
// Reuses the spirit of titlecase.ts's MINOR_WORDS plus a few verb fragments.
const DANGLING_END_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "nor",
  "but",
  "so",
  "yet",
  "for",
  "of",
  "in",
  "on",
  "at",
  "to",
  "by",
  "up",
  "as",
  "if",
  "via",
  "with",
  "from",
  "into",
  "over",
  "per",
  "than",
  "that",
  "is",
  "are",
  "was",
  "were",
  "be",
  "use",
  "using",
  "each",
]);

function indentOf(line: string): number {
  const m = /^(\s*)/.exec(line);
  return m ? m[1].length : 0;
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

// True when `label` reads as an unfinished sentence fragment rather than a
// complete, standalone label: unbalanced brackets/parens/math (a link or
// formula split across the line break), trailing punctuation that implies
// more is coming, or a final word that can't end a phrase.
function looksUnfinished(label: string): boolean {
  const trimmed = label.trim();
  const opens = (trimmed.match(/\(/g) ?? []).length;
  const closes = (trimmed.match(/\)/g) ?? []).length;
  if (opens !== closes) return true;
  const bracketOpens = (trimmed.match(/\[/g) ?? []).length;
  const bracketCloses = (trimmed.match(/\]/g) ?? []).length;
  if (bracketOpens !== bracketCloses) return true;
  const dollars = (trimmed.match(/\$/g) ?? []).length;
  if (dollars % 2 !== 0) return true;
  if (/[-=,;]$/.test(trimmed)) return true;

  const words = trimmed.split(/\s+/);
  const lastWord = words[words.length - 1]
    ?.toLowerCase()
    .replace(/[^a-z]/g, "");
  if (lastWord && DANGLING_END_WORDS.has(lastWord)) return true;

  return false;
}

// A real description starts a fresh sentence: capitalized prose, a digit, or
// a bolded/math-led term. A lowercase or punctuation start means the
// "continuation" is really just the rest of the previous sentence.
function startsNewSentence(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed === "") return false;
  const first = trimmed.replace(/^\*\*/, "")[0] ?? "";
  return /[A-Z0-9$]/.test(first);
}

// The 2-line label format requires a hard break (two trailing spaces, or a
// trailing backslash) on the label line, or the description silently
// collapses onto the same rendered line. Detects a short, complete-looking
// label with no hard break, immediately followed by a more-indented line
// that reads as a fresh, separate sentence — as opposed to an ordinary
// paragraph the author wrapped across source lines for readability, which
// CommonMark's soft-break-to-space rule renders correctly either way.
export function checkCollapsedLabel(f: ScannedFile): Violation[] {
  const violations: Violation[] = [];

  for (let i = 0; i < f.lines.length - 1; i++) {
    if (f.lineIsCode[i] || f.lineIsCode[i + 1]) continue;

    const line = f.lines[i];
    const m = BULLET_START_RE.exec(line);
    if (!m) continue;

    const label = m[3];
    if (label.includes(":")) continue; // handled by label-description, not this rule
    if (wordCount(label) > MAX_LABEL_WORDS) continue;
    if (line.endsWith("  ") || line.trimEnd().endsWith("\\")) continue; // valid hard break
    if (looksUnfinished(label)) continue;

    const next = f.lines[i + 1];
    if (next.trim() === "") continue;
    if (/^\s*[-*]\s+/.test(next)) continue; // a new bullet, not a continuation
    if (!startsNewSentence(next)) continue;

    const bulletIndent = m[1].length;
    if (indentOf(next) <= bulletIndent) continue;

    violations.push({
      rule: "collapsed-label",
      line: i + 1,
      text: `${line.trim()}  /  ${next.trim()}`,
      snippet: label.trim().toLowerCase(),
    });
  }

  return violations;
}
