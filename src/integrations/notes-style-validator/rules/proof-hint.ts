import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";

const NOTE_RE = /<Note\b[^>]*\btitle\s*=\s*(?:"Proof Hint"|'Proof Hint')/i;

// A proof hint is written as <Proof label="Proof Hint">, not as a titled
// <Note>.
export function checkProofHint(f: ScannedFile): Violation[] {
  const violations: Violation[] = [];

  for (let i = 0; i < f.lines.length; i++) {
    if (f.lineIsCode[i]) continue;
    if (!NOTE_RE.test(f.lines[i])) continue;
    violations.push({
      rule: "proof-hint",
      line: i + 1,
      text: '<Note title="Proof Hint"> should be <Proof label="Proof Hint">',
      snippet: "note-proof-hint",
    });
  }

  return violations;
}
