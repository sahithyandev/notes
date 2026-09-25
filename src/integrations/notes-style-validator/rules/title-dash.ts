import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";

const EM_DASH = "—";
const EN_DASH = "–";

// Same spaced-vs-unspaced distinction as the prose dash rule: an en dash
// flanked by whitespace stands in for an em dash and is banned; an en dash
// packed tight against a range or compound name (`1978–2020`, `T–S`) is
// allowed.
function hasBannedDash(s: string): boolean {
  if (s.includes(EM_DASH)) return true;

  let idx = s.indexOf(EN_DASH);
  while (idx !== -1) {
    const before = s[idx - 1];
    const after = s[idx + 1];
    const beforeIsSpace = before === undefined || /\s/.test(before);
    const afterIsSpace = after === undefined || /\s/.test(after);
    if (beforeIsSpace || afterIsSpace) return true;
    idx = s.indexOf(EN_DASH, idx + 1);
  }

  return false;
}

// scan.ts masks every frontmatter line as code before the prose dash rule
// runs, so a dash in `title` or `sidebar.label` would otherwise go
// undetected. Both render standalone (sidebar, page header, browser tab, OG
// image) with no surrounding prose, same rationale as title-parens.
export function checkTitleDash(f: ScannedFile): Violation[] {
  const violations: Violation[] = [];

  if (hasBannedDash(f.title)) {
    violations.push({
      rule: "title-dash",
      line: f.titleLine,
      text: `title contains a dash: "${f.title}"`,
      snippet: f.title,
    });
  }

  if (hasBannedDash(f.sidebarLabel)) {
    violations.push({
      rule: "title-dash",
      line: f.sidebarLabelLine,
      text: `sidebar.label contains a dash: "${f.sidebarLabel}"`,
      snippet: f.sidebarLabel,
    });
  }

  return violations;
}
