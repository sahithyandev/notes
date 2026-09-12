import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";
import { checkTitleCaseRule } from "./title-case.ts";
import { checkEmDash } from "./em-dash.ts";
import { checkAdjacentNote } from "./adjacent-note.ts";
import { checkLabelDescription } from "./label-description.ts";
import { checkCollapsedLabel } from "./collapsed-label.ts";

const RULE_CHECKS: Array<(f: ScannedFile) => Violation[]> = [
  checkTitleCaseRule,
  checkEmDash,
  checkAdjacentNote,
  checkLabelDescription,
  checkCollapsedLabel,
];

export function runAllRules(f: ScannedFile): Violation[] {
  return RULE_CHECKS.flatMap((check) => check(f));
}
