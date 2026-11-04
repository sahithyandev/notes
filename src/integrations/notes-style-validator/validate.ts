import { readFileSync, writeFileSync } from "node:fs";
import { scanFiles, type ScannedFile } from "./scan.ts";
import {
  runPerFileRules,
  checkBrokenLinks,
  checkSubmoduleNumbering,
  checkForwardLinks,
  checkNotebookFiles,
} from "./rules/index.ts";
import { matchesFilter } from "./filter.ts";
import {
  groupByFile,
  printViolationGroup,
  type SimpleLogger,
  type Violation,
  type FileReport,
} from "./report.ts";
import { findMathBlockPeriodEdits } from "./rules/math-block.ts";

export interface ValidationResult {
  reports: FileReport[];
  count: number;
  /** Number of safe math-block period fixes applied before validation. */
  autoFixedCount: number;
  /** How many scanned files matched --filter. Lets callers warn on a typo'd filter that matched nothing. */
  matchedFileCount: number;
}

function applyMathBlockFixes(
  files: ScannedFile[],
  docsRoot: string,
  filter?: string,
): number {
  let fixedCount = 0;

  for (const file of files) {
    if (!matchesFilter(toDocsRelative(file.file, docsRoot), filter)) continue;
    const edits = findMathBlockPeriodEdits(file);
    if (edits.length === 0) continue;

    const lines = readFileSync(file.file, "utf-8").split("\n");
    for (const edit of [...edits].sort(
      (a, b) => b.line - a.line || b.start - a.start,
    )) {
      const line = lines[edit.line - 1];
      lines[edit.line - 1] = line.slice(0, edit.start) + line.slice(edit.end);
      fixedCount++;
    }
    writeFileSync(file.file, lines.join("\n"), "utf-8");
  }

  return fixedCount;
}

function toDocsRelative(file: string, docsRoot: string): string {
  return file.replace(docsRoot + "/", "docs/");
}

function collectViolations(
  files: ScannedFile[],
  extraValidUrls: Iterable<string>,
): Array<{ file: string; violation: Violation }> {
  const flat: Array<{ file: string; violation: Violation }> = [];
  for (const f of files) {
    for (const violation of runPerFileRules(f)) {
      flat.push({ file: f.file, violation });
    }
  }
  flat.push(...checkBrokenLinks(files, extraValidUrls));
  flat.push(...checkSubmoduleNumbering(files));
  flat.push(...checkForwardLinks(files));
  flat.push(...checkNotebookFiles(files));
  return flat;
}

export function validate(
  docsRoot: string,
  extraValidUrls: Iterable<string> = [],
  filter?: string,
  autoFix = false,
): ValidationResult {
  let files = scanFiles(docsRoot);
  const autoFixedCount = autoFix
    ? applyMathBlockFixes(files, docsRoot, filter)
    : 0;
  if (autoFixedCount > 0) files = scanFiles(docsRoot);
  const flat = collectViolations(files, extraValidUrls);

  const inScope = (item: { file: string }) =>
    matchesFilter(toDocsRelative(item.file, docsRoot), filter);
  const scoped = flat.filter(inScope);
  const matchedFileCount = files.filter((f) =>
    matchesFilter(toDocsRelative(f.file, docsRoot), filter),
  ).length;

  return {
    reports: groupByFile(scoped),
    count: scoped.length,
    autoFixedCount,
    matchedFileCount,
  };
}

export async function runValidation(
  docsRoot: string,
  logger: SimpleLogger,
  opts: {
    failOnViolations: boolean;
    extraValidUrls?: Iterable<string>;
    /** Scope the report to a semester, module, submodule, or note — e.g. "s1", "s1/mathematics", "s1/mathematics/matrices", or a note name. */
    filter?: string;
    /** Apply safe automatic fixes before validating. Opt-in only. */
    autoFix?: boolean;
  },
): Promise<void> {
  const result = validate(
    docsRoot,
    opts.extraValidUrls ?? [],
    opts.filter,
    opts.autoFix,
  );
  const scope = opts.filter
    ? ` (filtered to "${opts.filter}", ${result.matchedFileCount} file(s) matched)`
    : "";

  if (opts.filter && result.matchedFileCount === 0) {
    logger.warn(
      `\nnotes-style-validator: --filter "${opts.filter}" matched no files - check for a typo.\n`,
    );
    return;
  }

  printViolationGroup("violations", result.reports, logger, docsRoot);

  if (result.autoFixedCount > 0) {
    logger.info(
      `notes-style-validator: auto-fixed ${result.autoFixedCount} math block period(s).`,
    );
  }

  if (result.count === 0) {
    logger.info("notes-style-validator: no violations found" + scope + ".");
  }

  if (opts.failOnViolations && result.count > 0) {
    throw new Error(
      "notes-style-validator: " +
        result.count +
        " violation(s) found" +
        scope +
        ". Fix them before continuing.",
    );
  }
}
