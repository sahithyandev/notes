export interface SimpleLogger {
  warn(msg: string): void;
  info(msg: string): void;
}

export interface Violation {
  line: number;
  kind: "title" | "heading";
  /** "title" for frontmatter, "h2"/"h3"/"h4" for headings. */
  label: string;
  text: string;
  corrected: string;
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

export function printReport(
  reports: FileReport[],
  logger: SimpleLogger,
  docsRoot: string,
): void {
  const total = reports.reduce((n, r) => n + r.violations.length, 0);

  if (total === 0) {
    logger.info("title-case: all titles and headings are title case.");
    return;
  }

  logger.warn(
    `\ntitle-case found ${total} title(s)/heading(s) not in title case:\n`,
  );

  const shown = reports.slice(0, MAX_FILES);
  for (const { file, violations } of shown) {
    const rel = file.replace(docsRoot + "/", "docs/");
    logger.warn(rel);
    for (const v of violations.slice(0, MAX_PER_FILE)) {
      const prefix = `  ${pad(v.line)}  ${v.label.padEnd(5)}  `;
      logger.warn(`${prefix}${v.text}`);
      logger.warn(`${" ".repeat(prefix.length)}→ ${v.corrected}`);
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

  logger.warn(
    `${total} non-title-case title(s)/heading(s) across ${reports.length} file(s).`,
  );
}
