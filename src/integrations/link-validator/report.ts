import type { Suggestion } from "./similarity.ts";

export interface SimpleLogger {
  warn(msg: string): void;
  info(msg: string): void;
}

export interface Violation {
  line: number;
  kind: "broken-link" | "broken-anchor" | "missing-image";
  /** The raw URL string as it appeared in the source markdown. */
  raw: string;
  /** Path portion of raw (no anchor, no trailing slash). Empty for in-page anchors. */
  target: string;
  suggestions: Suggestion[];
}

export interface FileReport {
  file: string;
  violations: Violation[];
}

function pad(n: number, width = 4): string {
  return `L${n}`.padEnd(width + 1);
}

function kindLabel(kind: Violation["kind"]): string {
  switch (kind) {
    case "broken-link":
      return "broken link  ";
    case "broken-anchor":
      return "broken anchor";
    case "missing-image":
      return "missing image";
  }
}

export function printReport(
  reports: FileReport[],
  logger: SimpleLogger,
  docsRoot: string,
): void {
  const total = reports.reduce((n, r) => n + r.violations.length, 0);

  if (total === 0) {
    logger.info("link-validator: no broken links found.");
    return;
  }

  logger.warn(`\nlink-validator found ${total} broken link(s):\n`);

  for (const { file, violations } of reports) {
    if (violations.length === 0) continue;
    const rel = file.replace(docsRoot + "/", "docs/");
    logger.warn(rel);
    for (const v of violations) {
      const prefix = `  ${pad(v.line)}  ${kindLabel(v.kind)}  `;
      logger.warn(`${prefix}${v.raw}`);
      if (v.suggestions.length === 0) {
        logger.warn(`${" ".repeat(prefix.length)}no close match`);
      } else {
        logger.warn(`${" ".repeat(prefix.length)}suggestions:`);
        for (const s of v.suggestions) {
          logger.warn(
            `${" ".repeat(prefix.length + 2)}${s.candidate.padEnd(60)} (${s.score.toFixed(2)})`,
          );
        }
      }
    }
    logger.warn("");
  }

  logger.warn(
    `${total} broken link(s) across ${reports.length} file(s). Fix them or update the links.`,
  );
}
