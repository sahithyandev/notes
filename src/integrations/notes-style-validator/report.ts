export interface SimpleLogger {
  warn(msg: string): void;
  info(msg: string): void;
}

export type RuleId =
  | "title-case"
  | "em-dash"
  | "adjacent-note"
  | "label-description"
  | "collapsed-label"
  | "prereq-scope"
  | "broken-link";

export interface Violation {
  rule: RuleId;
  line: number;
  /** Short human-readable line shown in the report, e.g. the offending text or a description. */
  text: string;
  /** Stable, rule-specific fragment used to key this violation in the baseline. Never a line number. */
  snippet: string;
}

export interface FileReport {
  file: string;
  violations: Violation[];
}

const MAX_FILES = 15;
const MAX_PER_FILE = 10;

function pad(n: number): string {
  return `L${n}`.padEnd(6);
}

export function groupByFile(
  items: Array<{ file: string; violation: Violation }>,
): FileReport[] {
  const map = new Map<string, Violation[]>();
  for (const { file, violation } of items) {
    if (!map.has(file)) map.set(file, []);
    map.get(file)!.push(violation);
  }
  return [...map.entries()].map(([file, violations]) => ({
    file,
    violations,
  }));
}

export function printViolationGroup(
  title: string,
  reports: FileReport[],
  logger: SimpleLogger,
  docsRoot: string,
): void {
  const total = reports.reduce((n, r) => n + r.violations.length, 0);
  if (total === 0) return;

  logger.warn(`\nnotes-style-validator: ${title} (${total}):\n`);

  const shown = reports.slice(0, MAX_FILES);
  for (const { file, violations } of shown) {
    const rel = file.replace(docsRoot + "/", "docs/");
    logger.warn(rel);
    for (const v of violations.slice(0, MAX_PER_FILE)) {
      logger.warn(`  ${pad(v.line)}  ${v.rule.padEnd(18)}  ${v.text}`);
    }
    if (violations.length > MAX_PER_FILE) {
      logger.warn(
        `  … and ${violations.length - MAX_PER_FILE} more in this file`,
      );
    }
    logger.warn("");
  }

  if (reports.length > MAX_FILES) {
    logger.warn(`… and ${reports.length - MAX_FILES} more file(s).\n`);
  }
}
