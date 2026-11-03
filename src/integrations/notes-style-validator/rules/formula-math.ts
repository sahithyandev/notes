import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";

const TAG_RE = /<\/?(?:Formula|Symbols|Sym|Solution)\b[^>]*>/g;

export function checkFormula(f: ScannedFile): Violation[] {
  const violations: Violation[] = [];
  const formulas: Array<{ line: number; mathDelimiters: number }> = [];
  let formulaDepth = 0;
  let symbolsDepth = 0;
  let solutionDepth = 0;

  for (let i = 0; i < f.lines.length; i++) {
    if (f.lineIsCode[i]) continue;

    for (const tag of f.lines[i].matchAll(TAG_RE)) {
      const name = tag[0].match(/^<\/?(Formula|Symbols|Sym|Solution)\b/)?.[1];
      const closing = tag[0].startsWith("</");
      const selfClosing = tag[0].endsWith("/>");
      if (name === "Solution") {
        if (closing) solutionDepth = Math.max(0, solutionDepth - 1);
        else if (!selfClosing) solutionDepth++;
      } else if (name === "Formula") {
        if (!closing && solutionDepth > 0) {
          violations.push({
            rule: "formula",
            line: i + 1,
            text: "<Formula> must not be used inside <Solution>",
            snippet: "formula-inside-solution",
          });
        }
        if (closing) {
          const formula = formulas.pop();
          formulaDepth = Math.max(0, formulaDepth - 1);
          if (!formula) continue;

          if (formula.mathDelimiters === 0) {
            violations.push({
              rule: "formula",
              line: formula.line,
              text: "<Formula> must contain exactly 1 $$ ... $$ block",
              snippet: "formula-without-display-math",
            });
          } else if (formula.mathDelimiters !== 2) {
            violations.push({
              rule: "formula",
              line: formula.line,
              text: "<Formula> must contain exactly 1 $$ ... $$ block",
              snippet: "formula-with-multiple-display-math",
            });
          }
        } else if (!selfClosing) {
          formulas.push({ line: i + 1, mathDelimiters: 0 });
          formulaDepth++;
        }
      } else if (name === "Symbols") {
        if (!closing && formulaDepth === 0)
          violations.push({
            rule: "formula",
            line: i + 1,
            text: "<Symbols> must be nested inside <Formula>",
            snippet: "symbols-outside-formula",
          });
        if (closing) symbolsDepth = Math.max(0, symbolsDepth - 1);
        else if (!selfClosing) symbolsDepth++;
      } else if (name === "Sym" && !closing && symbolsDepth === 0) {
        violations.push({
          rule: "formula",
          line: i + 1,
          text: "<Sym> must be nested inside <Symbols>",
          snippet: "sym-outside-symbols",
        });
      }
    }

    if (formulas.length > 0) {
      formulas.at(-1)!.mathDelimiters += (
        f.lines[i].match(/\$\$/g) ?? []
      ).length;
    }
  }

  return violations;
}
