import { scanFiles, type ScannedFile } from "./scan.ts";
import { runPerFileRules, checkBrokenLinks } from "./rules/index.ts";
import { matchesFilter } from "./filter.ts";
import {
  groupByFile,
  printViolationGroup,
  type SimpleLogger,
  type Violation,
  type FileReport,
} from "./report.ts";

export interface ValidationResult {
  reports: FileReport[];
  count: number;
  /** How many scanned files matched --filter. Lets callers warn on a typo'd filter that matched nothing. */
  matchedFileCount: number;
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
  return flat;
}

export function validate(
  docsRoot: string,
  extraValidUrls: Iterable<string> = [],
  filter?: string,
): ValidationResult {
  const files = scanFiles(docsRoot);
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
  },
): Promise<void> {
  const result = validate(docsRoot, opts.extraValidUrls ?? [], opts.filter);
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
