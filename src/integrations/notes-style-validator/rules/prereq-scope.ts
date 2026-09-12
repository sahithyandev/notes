import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";

// Directory portion of a slug, e.g. "s1/mathematics/real-analysis/foo" -> "s1/mathematics/real-analysis".
function dirOf(slug: string): string {
  const idx = slug.lastIndexOf("/");
  return idx === -1 ? "" : slug.slice(0, idx);
}

function stripAnchor(slug: string): string {
  const idx = slug.indexOf("#");
  return idx === -1 ? slug : slug.slice(0, idx);
}

// `prereqs` may only reference notes in OTHER modules — sibling notes in the
// same module are already covered by prev/sidebar order and assumed read.
export function checkPrereqScope(f: ScannedFile): Violation[] {
  if (!f.slug) return [];
  const ownDir = dirOf(f.slug);
  const violations: Violation[] = [];

  for (const { value, line } of f.prereqs) {
    const prereqSlug = stripAnchor(value);
    if (dirOf(prereqSlug) === ownDir) {
      violations.push({
        rule: "prereq-scope",
        line,
        text: `prereq "${value}" is in the same module as this note`,
        snippet: value,
      });
    }
  }

  return violations;
}
