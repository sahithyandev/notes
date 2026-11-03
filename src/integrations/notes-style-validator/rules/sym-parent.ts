import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";

const TAG_RE = /<\/?(?:Symbols|Sym)\b[^>]*>/g;

// `Sym` is an implementation detail of `Symbols`: Astro must receive both
// components in its MDX map, so enforce their relationship at note-validation
// time rather than exposing an unguarded usage in the authoring API.
export function checkSymParent(f: ScannedFile): Violation[] {
  const violations: Violation[] = [];
  let symbolsDepth = 0;

  for (let i = 0; i < f.lines.length; i++) {
    if (f.lineIsCode[i]) continue;

    for (const tag of f.lines[i].matchAll(TAG_RE)) {
      const name = tag[0].match(/^<\/?(Symbols|Sym)\b/)?.[1];
      if (name === "Symbols") {
        if (tag[0].startsWith("</")) {
          symbolsDepth = Math.max(0, symbolsDepth - 1);
        } else if (!tag[0].endsWith("/>")) {
          symbolsDepth++;
        }
        continue;
      }

      if (name === "Sym" && !tag[0].startsWith("</") && symbolsDepth === 0) {
        violations.push({
          rule: "sym-parent",
          line: i + 1,
          text: "<Sym> must be nested inside <Symbols>",
          snippet: "sym-outside-symbols",
        });
      }
    }
  }

  return violations;
}
