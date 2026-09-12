import { scanFiles } from "./scan.ts";
import { runAllRules } from "./rules/index.ts";
import { loadBaseline, violationKey } from "./baseline.ts";
import type { Baseline, BaselineEntry } from "./baseline.ts";
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
}

function toDocsRelative(file: string, docsRoot: string): string {
  return file.replace(docsRoot + "/", "docs/");
}

export function validate(
  docsRoot: string,
  baseline: Baseline,
): ValidationResult {
  const files = scanFiles(docsRoot);
  const flat: Array<{ file: string; violation: Violation }> = [];
  for (const f of files) {
    for (const violation of runAllRules(f)) {
      flat.push({ file: f.file, violation });
    }
  }

  const budget = new Map<string, number>();
  for (const e of baseline.entries) {
    const key = violationKey(e.file, e.rule, e.snippet);
    budget.set(key, (budget.get(key) ?? 0) + e.count);
  }

  const seenKeys = new Set<string>();
  const newItems: typeof flat = [];
  const grandfatheredItems: typeof flat = [];

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
      grandfatheredItems.push(item);
    } else {
      newItems.push(item);
    }
  }

  const staleEntries = baseline.entries.filter(
    (e) => !seenKeys.has(violationKey(e.file, e.rule, e.snippet)),
  );

  return {
    newReports: groupByFile(newItems),
    grandfatheredReports: groupByFile(grandfatheredItems),
    staleEntries,
    newCount: newItems.length,
    grandfatheredCount: grandfatheredItems.length,
  };
}

// Used by scripts/update-style-baseline.ts to regenerate the committed
// baseline from the current state of docs/.
export function computeBaselineEntries(docsRoot: string): BaselineEntry[] {
  const files = scanFiles(docsRoot);
  const counts = new Map<string, BaselineEntry>();

  for (const f of files) {
    const fileRel = toDocsRelative(f.file, docsRoot);
    for (const violation of runAllRules(f)) {
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
  }

  return [...counts.values()];
}

export async function runValidation(
  docsRoot: string,
  logger: SimpleLogger,
  opts: { failOnNew: boolean },
): Promise<void> {
  const baseline = loadBaseline();
  const result = validate(docsRoot, baseline);

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
    logger.info("notes-style-validator: no style violations found.");
  } else if (result.newCount === 0) {
    logger.info(
      "notes-style-validator: no new violations (" +
        result.grandfatheredCount +
        " grandfathered).",
    );
  }

  if (opts.failOnNew && result.newCount > 0) {
    throw new Error(
      "notes-style-validator: " +
        result.newCount +
        " new style violation(s) found. Fix them, or if pre-existing/intentional, run `bun run script:update-style-baseline`.",
    );
  }
}
