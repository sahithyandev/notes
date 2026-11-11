import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";
import { checkTitleCaseRule } from "./title-case.ts";
import { checkTitleParens } from "./title-parens.ts";
import { checkTitleDash } from "./title-dash.ts";
import { checkTitleLength } from "./title-length.ts";
import { checkDash } from "./dash.ts";
import { checkMathDelimiters } from "./math-delimiters.ts";
import { checkAdjacentNote } from "./adjacent-note.ts";
import { checkAdjacentList } from "./adjacent-list.ts";
import { checkLabelDescription } from "./label-description.ts";
import { checkCollapsedLabel } from "./collapsed-label.ts";
import { checkPrereqScope } from "./prereq-scope.ts";
import { checkBrokenLinks } from "./broken-link.ts";
import { checkFilename } from "./filename.ts";
import { checkTitleHeadingDuplicate } from "./title-heading-duplicate.ts";
import { checkDuplicateHeading } from "./duplicate-heading.ts";
import { checkWhatIsHeading } from "./what-is-heading.ts";
import { checkMathBlock } from "./math-block.ts";
import { checkFormula } from "./formula-math.ts";
import { checkProofHint } from "./proof-hint.ts";
import { checkTooManyHeadings } from "./too-many-headings.ts";
import { checkNotebookFile, checkNotebookFiles } from "./notebook-file.ts";
import { checkSubmoduleNumbering } from "./submodule-numbering.ts";
import { checkForwardLinks } from "./forward-link.ts";
import { checkSolutionMethods } from "./solution-methods.ts";
import { checkRedundantPrereqs } from "./redundant-prereq.ts";
import { checkEmptyPrereq } from "./empty-prereq.ts";

export {
  checkBrokenLinks,
  checkSubmoduleNumbering,
  checkForwardLinks,
  checkNotebookFiles,
  checkRedundantPrereqs,
};

// Every rule except the corpus-wide ones (broken-link, submodule-numbering,
// forward-link, redundant-prereq) runs per file, independent of the rest of
// the corpus. These rules need neighboring or all-file context, so they are
// handled separately (see validate.ts).
const PER_FILE_RULE_CHECKS: Array<(f: ScannedFile) => Violation[]> = [
  checkTitleCaseRule,
  checkTitleParens,
  checkTitleDash,
  checkTitleLength,
  checkDash,
  checkMathDelimiters,
  checkAdjacentNote,
  checkAdjacentList,
  checkLabelDescription,
  checkCollapsedLabel,
  checkPrereqScope,
  checkFilename,
  checkTitleHeadingDuplicate,
  checkDuplicateHeading,
  checkWhatIsHeading,
  checkMathBlock,
  checkProofHint,
  checkTooManyHeadings,
  checkFormula,
  checkSolutionMethods,
  checkNotebookFile,
  checkEmptyPrereq,
];

export function runPerFileRules(f: ScannedFile): Violation[] {
  return PER_FILE_RULE_CHECKS.flatMap((check) => check(f));
}
