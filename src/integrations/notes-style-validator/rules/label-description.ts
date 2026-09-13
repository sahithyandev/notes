import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";
import { MASK_CHAR } from "../mask.ts";

// Captures the whitespace before and after the bullet marker separately, so
// the label's exact start offset can be recovered without re-scanning.
const BULLET_RE = /^(\s*)([-*])(\s+)(.+?):\s+(.+)$/;

// Excludes ")" and ":" from a bare URL's match so trailing markdown/prose
// punctuation right after the URL - such as the "): " that follows a
// markdown link target, or a bare URL's own trailing "some-colon:" - is
// never swallowed into the masked span.
const URL_RE = /(https?:\/\/|mailto:)[^\s):]+/g;
const LINK_TARGET_RE = /\]\(([^)]*)\)/g;

// Masks only URL text (and a markdown link's target, keeping its brackets)
// so a URL's incidental colon can't be mistaken for the label separator,
// without hiding a real link label like `[text](url): description`. The
// link-target pass runs first so a URL already inside `](...)` is masked
// once, as part of that structural span, rather than matched again by the
// bare-URL pass.
function maskUrls(line: string): string {
  let result = line.replace(LINK_TARGET_RE, (_whole, inner: string) => {
    return "](" + MASK_CHAR.repeat(inner.length) + ")";
  });
  result = result.replace(URL_RE, (m) => MASK_CHAR.repeat(m.length));
  return result;
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

const MAX_LABEL_WORDS = 5;

// Bans `- Label: description`. A label is exempt when it overlaps a
// math/inline-code span from the shared mask pass (glossary bullets like
// `- $L$: unit lower triangular` or `` - `IN`: … ``, including a label that's
// only partly math like `- $(1)$ is $\le$: add slack $s_1$.`). A label
// containing a URL is NOT exempt — `- [text](https://x): Description` is
// still a violation in substance, only the URL's own colon is incidental.
export function checkLabelDescription(f: ScannedFile): Violation[] {
  const violations: Violation[] = [];

  for (let i = 0; i < f.lines.length; i++) {
    if (f.lineIsCode[i]) continue;

    const codeMathMasked = f.maskedLines[i];
    const fullyMasked = maskUrls(codeMathMasked);
    const m = BULLET_RE.exec(fullyMasked);
    if (!m) continue;

    const labelStart = m[1].length + m[2].length + m[3].length;
    const labelLen = m[4].length;

    // Label overlaps a math/code span from scan.ts's masking -> exempt.
    const labelInCodeMath = codeMathMasked.slice(
      labelStart,
      labelStart + labelLen,
    );
    if (labelInCodeMath.includes(MASK_CHAR)) continue;

    const originalLabel = f.lines[i].slice(labelStart, labelStart + labelLen);
    if (wordCount(originalLabel) > MAX_LABEL_WORDS) continue;

    violations.push({
      rule: "label-description",
      line: i + 1,
      text: f.lines[i].trim(),
      snippet: originalLabel.trim().toLowerCase(),
    });
  }

  return violations;
}
