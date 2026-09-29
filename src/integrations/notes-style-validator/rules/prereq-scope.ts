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

// Leading "sN" segment of a slug, as a number, or null if the slug doesn't
// start with one (shouldn't happen for a real note, but a mistyped prereq
// path shouldn't crash the validator over it).
function semesterOf(slug: string): number | null {
  const match = /^s(\d+)(?:\/|$)/.exec(slug);
  return match ? Number(match[1]) : null;
}

// `prereqs` may only reference notes in OTHER modules — sibling notes in the
// same module are already covered by prev/sidebar order and assumed read —
// and may not reach into a LATER semester, since that hasn't been studied
// yet. Same-semester, different-module prereqs are still allowed: modules
// within a semester are often taken concurrently, so one can depend on
// another without an ordering violation.
export function checkPrereqScope(f: ScannedFile): Violation[] {
  if (!f.slug) return [];
  const ownDir = dirOf(f.slug);
  const ownSemester = semesterOf(f.slug);
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
      continue;
    }

    const prereqSemester = semesterOf(prereqSlug);
    if (
      ownSemester !== null &&
      prereqSemester !== null &&
      prereqSemester > ownSemester
    ) {
      violations.push({
        rule: "prereq-scope",
        line,
        text: `prereq "${value}" is in a later semester than this note`,
        snippet: value,
      });
    }
  }

  return violations;
}
