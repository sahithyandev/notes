export interface SimpleLogger {
  warn(msg: string): void;
  info(msg: string): void;
}

export interface Violation {
  line: number;
  prereq: string;
}

export interface FileReport {
  file: string;
  violations: Violation[];
}

function pad(n: number): string {
  return `L${n}`.padEnd(6);
}

export function printReport(
  reports: FileReport[],
  logger: SimpleLogger,
  docsRoot: string,
): void {
  const total = reports.reduce((n, r) => n + r.violations.length, 0);

  if (total === 0) {
    logger.info("prereq-scope: no same-module prereqs found.");
    return;
  }

  logger.warn(`\nprereq-scope found ${total} same-module prereq(s):\n`);

  for (const { file, violations } of reports) {
    const rel = file.replace(docsRoot + "/", "docs/");
    logger.warn(rel);
    for (const v of violations) {
      logger.warn(`  ${pad(v.line)}  ${v.prereq}`);
    }
    logger.warn("");
  }

  logger.warn(
    `${total} same-module prereq(s) across ${reports.length} file(s). ` +
      `Sibling notes are already covered by prev/sidebar order; remove them from prereqs.`,
  );
}
