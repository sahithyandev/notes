import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";
import { checkTitleCaseRule } from "./title-case.ts";
import { checkEmDash } from "./em-dash.ts";
import { checkAdjacentNote } from "./adjacent-note.ts";
import { checkLabelDescription } from "./label-description.ts";
import { checkCollapsedLabel } from "./collapsed-label.ts";
import { checkPrereqScope } from "./prereq-scope.ts";
import { checkBrokenLinks } from "./broken-link.ts";

export { checkBrokenLinks };

// Every rule except broken-link runs per file, independent of the rest of
// the corpus. broken-link needs every file's slug/headings up front to know
// what a valid target even is, so it's handled separately (see validate.ts).
const PER_FILE_RULE_CHECKS: Array<(f: ScannedFile) => Violation[]> = [
  checkTitleCaseRule,
  checkEmDash,
  checkAdjacentNote,
  checkLabelDescription,
  checkCollapsedLabel,
  checkPrereqScope,
];

export function runPerFileRules(f: ScannedFile): Violation[] {
  return PER_FILE_RULE_CHECKS.flatMap((check) => check(f));
}
