import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { scanDocs } from "../src/integrations/link-validator/scan.ts";
import {
  buildValidUrls,
  validate,
} from "../src/integrations/link-validator/validate.ts";

const CONFIDENCE_THRESHOLD = 0.92;
const dryRun = process.argv.includes("--dry-run");
const docsRoot = join(import.meta.dirname, "../docs");

// Build the valid URL set from frontmatter slugs (no Astro routes needed).
// Redirect URLs (e.g. /s4/linear-algebra) won't be auto-fixed anyway since
// they resolve to real pages — only genuinely broken links get suggestions.
const scanned = scanDocs(docsRoot);
const validUrls = buildValidUrls(scanned);
const reports = validate(scanned, validUrls);

/** Compute what the fixed URL should be for a high-confidence violation. */
function fixedUrl(v: (typeof reports)[0]["violations"][0]): string {
  const top = v.suggestions[0];
  if (v.kind === "broken-link" || v.kind === "missing-image") {
    return top.candidate;
  }
  // broken-anchor: reconstruct path + corrected anchor
  return v.target ? `${v.target}#${top.candidate}` : `#${top.candidate}`;
}

let totalFiles = 0;
let totalFixes = 0;
let totalSkipped = 0;

for (const { file, violations } of reports) {
  const fixable = violations.filter(
    (v) =>
      v.suggestions.length > 0 &&
      v.suggestions[0].score >= CONFIDENCE_THRESHOLD,
  );
  const skipped = violations.length - fixable.length;
  totalSkipped += skipped;

  if (fixable.length === 0) continue;

  const lines = readFileSync(file, "utf-8").split("\n");

  // Apply fixes line-by-line, sorted by line then by position so multiple
  // fixes on the same line don't shift each other.
  for (const v of fixable) {
    const idx = v.line - 1;
    const replacement = fixedUrl(v);
    // Replace first occurrence of the raw URL on this line only.
    lines[idx] = lines[idx].replace(v.raw, replacement);
    totalFixes++;
    const rel = file.replace(docsRoot + "/", "docs/");
    console.log(
      `${dryRun ? "[dry-run] " : ""}${rel}:${v.line}  ${v.raw}  →  ${replacement}  (${v.suggestions[0].score.toFixed(2)})`,
    );
  }

  if (!dryRun) {
    writeFileSync(file, lines.join("\n"), "utf-8");
  }

  totalFiles++;
}

if (totalSkipped > 0) {
  console.log(
    `\n${totalSkipped} violation(s) skipped (no suggestion above ${CONFIDENCE_THRESHOLD} confidence) — run \`bun dev\` to review them.`,
  );
}

console.log(
  `\n${dryRun ? "[dry-run] " : ""}Done: ${totalFixes} fix(es) across ${totalFiles} file(s).`,
);
