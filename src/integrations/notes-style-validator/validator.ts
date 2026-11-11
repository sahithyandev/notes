import { readFileSync, writeFileSync } from "node:fs";
import { scanFiles, type ScannedFile } from "./scan.ts";
import {
  runPerFileRules,
  checkBrokenLinks,
  checkSubmoduleNumbering,
  checkForwardLinks,
  checkNotebookFiles,
  checkRedundantPrereqs,
  checkUnusedImages,
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
  /** How many scanned files matched --filter. */
  matchedFileCount: number;
}

export interface NotesStyleValidatorOptions {
  /** URLs that are valid link targets without corresponding note files. */
  extraValidUrls?: Iterable<string>;
  /** Scope checks to a semester, module, submodule, or note. */
  filter?: string;
}

export interface RunValidationOptions {
  failOnViolations: boolean;
  /** Apply safe automatic fixes before validating. Opt-in only. */
  autoFix?: boolean;
  /** Override the validator's configured filter for this run. */
  filter?: string;
}

function toDocsRelative(file: string, docsRoot: string): string {
  return file.replace(docsRoot + "/", "docs/");
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

function collectViolations(
  files: ScannedFile[],
  docsRoot: string,
  extraValidUrls: Iterable<string>,
): Array<{ file: string; violation: Violation }> {
  const flat: Array<{ file: string; violation: Violation }> = [];
  for (const file of files) {
    for (const violation of runPerFileRules(file)) {
      flat.push({ file: file.file, violation });
    }
  }
  flat.push(...checkBrokenLinks(files, extraValidUrls));
  flat.push(...checkSubmoduleNumbering(files));
  flat.push(...checkForwardLinks(files));
  flat.push(...checkNotebookFiles(files));
  flat.push(...checkRedundantPrereqs(files));
  flat.push(...checkUnusedImages(files, docsRoot));
  return flat;
}

/** Owns the complete notes style validation workflow for one docs root. */
export class NotesStyleValidator {
  readonly docsRoot: string;
  private readonly extraValidUrls: string[];
  private readonly filter?: string;

  constructor(docsRoot: string, options: NotesStyleValidatorOptions = {}) {
    this.docsRoot = docsRoot;
    this.extraValidUrls = [...(options.extraValidUrls ?? [])];
    this.filter = options.filter;
  }

  validate(
    options: {
      autoFix?: boolean;
      extraValidUrls?: Iterable<string>;
      filter?: string;
    } = {},
  ): ValidationResult {
    const filter = options.filter ?? this.filter;
    let files = scanFiles(this.docsRoot);
    const autoFixedCount = options.autoFix
      ? applyMathBlockFixes(files, this.docsRoot, filter)
      : 0;
    if (autoFixedCount > 0) files = scanFiles(this.docsRoot);

    const validUrls = options.extraValidUrls ?? this.extraValidUrls;
    const scoped = collectViolations(files, this.docsRoot, validUrls).filter(
      (item) => matchesFilter(toDocsRelative(item.file, this.docsRoot), filter),
    );
    const matchedFileCount = files.filter((file) =>
      matchesFilter(toDocsRelative(file.file, this.docsRoot), filter),
    ).length;

    return {
      reports: groupByFile(scoped),
      count: scoped.length,
      autoFixedCount,
      matchedFileCount,
    };
  }

  async run(
    logger: SimpleLogger,
    options: RunValidationOptions,
  ): Promise<void> {
    const filter = options.filter ?? this.filter;
    const result = this.validate({ autoFix: options.autoFix, filter });
    const scope = filter
      ? ` (filtered to "${filter}", ${result.matchedFileCount} file(s) matched)`
      : "";

    if (filter && result.matchedFileCount === 0) {
      logger.warn(
        `\nnotes-style-validator: --filter "${filter}" matched no files - check for a typo.\n`,
      );
      return;
    }

    printViolationGroup("violations", result.reports, logger, this.docsRoot);

    if (result.autoFixedCount > 0) {
      logger.info(
        `notes-style-validator: auto-fixed ${result.autoFixedCount} math block period(s).`,
      );
    }

    if (result.count === 0) {
      logger.info("notes-style-validator: no violations found" + scope + ".");
    }

    if (options.failOnViolations && result.count > 0) {
      throw new Error(
        "notes-style-validator: " +
          result.count +
          " violation(s) found" +
          scope +
          ". Fix them before continuing.",
      );
    }
  }
}
