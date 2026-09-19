import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";

const EM_DASH = "—";

// scan.ts masks every frontmatter line as code before the prose em-dash rule
// runs, so an em dash in `title` or `sidebar.label` would otherwise go
// undetected. Both render standalone (sidebar, page header, browser tab, OG
// image) with no surrounding prose, same rationale as title-parens.
export function checkTitleEmDash(f: ScannedFile): Violation[] {
  const violations: Violation[] = [];

  if (f.title.includes(EM_DASH)) {
    violations.push({
      rule: "title-em-dash",
      line: f.titleLine,
      text: `title contains an em dash: "${f.title}"`,
      snippet: f.title,
    });
  }

  if (f.sidebarLabel.includes(EM_DASH)) {
    violations.push({
      rule: "title-em-dash",
      line: f.sidebarLabelLine,
      text: `sidebar.label contains an em dash: "${f.sidebarLabel}"`,
      snippet: f.sidebarLabel,
    });
  }

  return violations;
}
