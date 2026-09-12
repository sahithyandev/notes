import { scanFiles, type ScannedFile } from "./scan.ts";
import { runPerFileRules, checkBrokenLinks } from "./rules/index.ts";
import {
  loadBaseline,
  violationKey,
  isExcludedFromBaseline,
} from "./baseline.ts";
import type { Baseline, BaselineEntry } from "./baseline.ts";
import { matchesFilter } from "./filter.ts";
import {
  groupByFile,
  printViolationGroup,
  type SimpleLogger,
  type Violation,
  type FileReport,
} from "./report.ts";

export interface ValidationResult {
  newReports: FileReport[];
  grandfatheredReports: FileReport[];
  staleEntries: BaselineEntry[];
  newCount: number;
  grandfatheredCount: number;
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
  baseline: Baseline,
  extraValidUrls: Iterable<string> = [],
  filter?: string,
): ValidationResult {
  const files = scanFiles(docsRoot);
  const flat = collectViolations(files, extraValidUrls);

  const budget = new Map<string, number>();
  for (const e of baseline.entries) {
    const key = violationKey(e.file, e.rule, e.snippet);
    budget.set(key, (budget.get(key) ?? 0) + e.count);
  }

  // Classification (new vs. grandfathered vs. stale) always runs against the
  // FULL corpus, never the filtered subset — broken-link's cross-file
  // resolution and stale-entry detection would both be wrong if files
  // outside the filter were silently dropped from consideration. --filter
  // only narrows what gets reported and decided on, applied below.
  const seenKeys = new Set<string>();
  const newItemsAll: typeof flat = [];
  const grandfatheredItemsAll: typeof flat = [];

  for (const item of flat) {
    const fileRel = toDocsRelative(item.file, docsRoot);
    const key = violationKey(
      fileRel,
      item.violation.rule,
      item.violation.snippet,
    );
    seenKeys.add(key);
    const remaining = budget.get(key) ?? 0;
    if (remaining > 0) {
      budget.set(key, remaining - 1);
      grandfatheredItemsAll.push(item);
    } else {
      newItemsAll.push(item);
    }
  }

  const staleEntriesAll = baseline.entries.filter(
    (e) => !seenKeys.has(violationKey(e.file, e.rule, e.snippet)),
  );

  const inScope = (item: { file: string }) =>
    matchesFilter(toDocsRelative(item.file, docsRoot), filter);
  const newItems = newItemsAll.filter(inScope);
  const grandfatheredItems = grandfatheredItemsAll.filter(inScope);
  const staleEntries = staleEntriesAll.filter((e) =>
    matchesFilter(e.file, filter),
  );
  const matchedFileCount = files.filter((f) =>
    matchesFilter(toDocsRelative(f.file, docsRoot), filter),
  ).length;

  return {
    newReports: groupByFile(newItems),
    grandfatheredReports: groupByFile(grandfatheredItems),
    staleEntries,
    newCount: newItems.length,
    grandfatheredCount: grandfatheredItems.length,
    matchedFileCount,
  };
}

// Used by scripts/update-style-baseline.ts to regenerate the committed
// baseline from the current state of docs/.
export interface ComputedBaseline {
  entries: BaselineEntry[];
  /** Violations from excluded semesters (e.g. s5) that were dropped rather than baselined. */
  excludedViolations: number;
}

export function computeBaselineEntries(
  docsRoot: string,
  extraValidUrls: Iterable<string> = [],
): ComputedBaseline {
  const files = scanFiles(docsRoot);
  const flat = collectViolations(files, extraValidUrls);
  const counts = new Map<string, BaselineEntry>();
  let excludedViolations = 0;

  for (const { file, violation } of flat) {
    const fileRel = toDocsRelative(file, docsRoot);
    if (isExcludedFromBaseline(fileRel)) {
      excludedViolations += 1;
      continue;
    }
    const key = violationKey(fileRel, violation.rule, violation.snippet);
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, {
        file: fileRel,
        rule: violation.rule,
        snippet: violation.snippet,
        count: 1,
      });
    }
  }

  return { entries: [...counts.values()], excludedViolations };
}

export async function runValidation(
  docsRoot: string,
  logger: SimpleLogger,
  opts: {
    failOnNew: boolean;
    extraValidUrls?: Iterable<string>;
    /** Scope the report to a semester, module, submodule, or note — e.g. "s1", "s1/mathematics", "s1/mathematics/matrices", or a note name. */
    filter?: string;
  },
): Promise<void> {
  const baseline = loadBaseline();
  const result = validate(
    docsRoot,
    baseline,
    opts.extraValidUrls ?? [],
    opts.filter,
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

  printViolationGroup("new violations", result.newReports, logger, docsRoot);
  printViolationGroup(
    "grandfathered violations already in the baseline",
    result.grandfatheredReports,
    logger,
    docsRoot,
  );

  if (result.staleEntries.length > 0) {
    const noun = result.staleEntries.length === 1 ? "entry" : "entries";
    logger.warn(
      "\nnotes-style-validator: " +
        result.staleEntries.length +
        " stale baseline " +
        noun +
        " (already fixed) - run `bun run script:update-style-baseline` to shrink the baseline.\n",
    );
  }

  if (result.newCount === 0 && result.grandfatheredCount === 0) {
    logger.info("notes-style-validator: no violations found" + scope + ".");
  } else if (result.newCount === 0) {
    logger.info(
      "notes-style-validator: no new violations (" +
        result.grandfatheredCount +
        " grandfathered)" +
        scope +
        ".",
    );
  }

  if (opts.failOnNew && result.newCount > 0) {
    throw new Error(
      "notes-style-validator: " +
        result.newCount +
        " new violation(s) found" +
        scope +
        ". Fix them, or if pre-existing/intentional, run `bun run script:update-style-baseline`.",
    );
  }
}
