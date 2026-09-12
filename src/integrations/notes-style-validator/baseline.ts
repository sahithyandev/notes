import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { RuleId } from "./report.ts";

export interface BaselineEntry {
  /** docs-relative path, e.g. "docs/s4/x/01-y.mdx". */
  file: string;
  rule: RuleId;
  /** Normalized, rule-specific snippet — never a line number, so entries survive unrelated edits shifting lines. */
  snippet: string;
  /** How many identical (file, rule, snippet) violations existed when baselined. */
  count: number;
}

export interface Baseline {
  version: 1;
  entries: BaselineEntry[];
}

// Semesters whose note-style violations are never grandfathered. s5 cleared
// out its whole backlog in "fix note style violations in s5", so its notes
// stay out of the baseline entirely: a new violation there fails the build
// (or the check script) instead of silently landing in style-baseline.json on
// the next `bun run script:update-style-baseline`.
const EXCLUDED_FROM_BASELINE = new Set(["s5"]);

/** True for docs-relative paths like "docs/s5/..." that are never grandfathered. */
export function isExcludedFromBaseline(file: string): boolean {
  const match = /^docs\/([^/]+)\//.exec(file);
  return match ? EXCLUDED_FROM_BASELINE.has(match[1]) : false;
}

const BASELINE_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "style-baseline.json",
);

function normalizeSnippet(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

export function violationKey(
  file: string,
  rule: RuleId,
  snippet: string,
): string {
  return [file, rule, normalizeSnippet(snippet)].join(":");
}

export function loadBaseline(): Baseline {
  if (!existsSync(BASELINE_PATH)) return { version: 1, entries: [] };
  try {
    const parsed = JSON.parse(readFileSync(BASELINE_PATH, "utf-8"));
    if (parsed && Array.isArray(parsed.entries)) {
      return {
        version: 1,
        entries: parsed.entries.filter((e) => !isExcludedFromBaseline(e.file)),
      };
    }
  } catch {
    // Corrupt or unreadable baseline: treat as empty rather than crash the build.
  }
  return { version: 1, entries: [] };
}

export function saveBaseline(entries: BaselineEntry[]): void {
  const kept = entries.filter((e) => !isExcludedFromBaseline(e.file));
  const sorted = [...kept].sort((a, b) => {
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    if (a.rule !== b.rule) return a.rule.localeCompare(b.rule);
    return a.snippet.localeCompare(b.snippet);
  });
  writeFileSync(
    BASELINE_PATH,
    JSON.stringify({ version: 1, entries: sorted }, null, 2) + "\n",
  );
}
