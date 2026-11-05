import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";

const TAG_RE = /<\/?(Solution|Method)\b[^>]*>/g;

interface SolutionFrame {
  line: number;
  methodCount: number;
}

/** A Solution may have no Method children, or multiple Method children. */
export function checkSolutionMethods(f: ScannedFile): Violation[] {
  const violations: Violation[] = [];
  const solutions: SolutionFrame[] = [];

  function reportIfInvalid(solution: SolutionFrame): void {
    if (solution.methodCount !== 1) return;
    violations.push({
      rule: "solution-methods",
      line: solution.line,
      text: "<Solution> must contain 0 or at least 2 <Method> children",
      snippet: "solution-with-one-method",
    });
  }

  for (let i = 0; i < f.lines.length; i++) {
    if (f.lineIsCode[i]) continue;

    for (const match of f.lines[i].matchAll(TAG_RE)) {
      const name = match[1];
      const tag = match[0];
      const closing = tag.startsWith("</");
      const selfClosing = tag.endsWith("/>");

      if (name === "Solution") {
        if (closing) {
          const solution = solutions.pop();
          if (solution) reportIfInvalid(solution);
        } else if (!selfClosing) {
          solutions.push({ line: i + 1, methodCount: 0 });
        }
      } else if (!closing && solutions.length > 0) {
        solutions.at(-1)!.methodCount++;
      }
    }
  }

  // Keep the rule useful for scanner callers even when the source is
  // incomplete; the MDX compiler will separately report the malformed tag.
  for (const solution of solutions) reportIfInvalid(solution);

  return violations;
}
