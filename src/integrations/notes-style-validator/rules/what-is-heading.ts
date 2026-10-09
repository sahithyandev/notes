import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";

// Matches "What Is X?", "What Are X?", "What's X?" (case-insensitive), with
// an optional trailing "?".
const WHAT_IS = /^what(?:\s+(?:is|are)|['’]s)\s+(.+?)\??$/i;

// A heading phrased as a question ("What Is a Market?") only restates the
// topic. The bare noun phrase at the same level ("Market") reads the same
// and is shorter in the sidebar and table of contents.
export function checkWhatIsHeading(f: ScannedFile): Violation[] {
  const violations: Violation[] = [];

  for (const h of f.headings) {
    const m = WHAT_IS.exec(h.text.trim());
    if (!m) continue;
    const topic = m[1].replace(/^(?:a|an|the)\s+/i, "");
    violations.push({
      rule: "what-is-heading",
      line: h.line,
      text: `h${h.level} "${h.text}" can be simplified to "${topic}"`,
      snippet: h.text,
    });
  }

  return violations;
}
