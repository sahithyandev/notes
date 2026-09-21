// Runs notes-style-validator directly, without booting Astro. Same checks,
// same redirect-awareness, same pass/fail semantics as `bun run build`, but
// scans docs/ in isolation so it's fast enough to run after every edit.
//
// Usage:
//   bun run check-notes-style
//   bun run check-notes-style -- --filter s1
//   bun run check-notes-style -- --filter s1/mathematics
//   bun run check-notes-style -- --filter s1/mathematics/matrices
//   bun run check-notes-style -- --filter diagonalization
import { join } from "node:path";
import { runValidation } from "../src/integrations/notes-style-validator/validate.ts";
import { scanModuleRedirects } from "../src/integrations/module-redirects/scan.ts";

function parseFilter(argv: string[]): string | undefined {
  const flagIdx = argv.indexOf("--filter");
  if (flagIdx === -1) return undefined;
  const value = argv[flagIdx + 1];
  if (!value || value.startsWith("--")) {
    console.error("--filter requires a value, e.g. --filter s1/mathematics");
    process.exit(1);
  }
  return value;
}

const docsRoot = join(process.cwd(), "docs");
const filter = parseFilter(process.argv.slice(2));

// Module-redirect targets are valid link destinations even though no note
// carries that exact slug — same reasoning as notes-style-validator's own
// astro:routes:resolved capture, just read straight from disk instead of
// Astro's route manifest.
const extraValidUrls = Object.keys(scanModuleRedirects(docsRoot));

const logger = {
  warn: (msg: string) => console.warn(msg),
  info: (msg: string) => console.log(msg),
};

try {
  await runValidation(docsRoot, logger, {
    failOnViolations: true,
    extraValidUrls,
    filter,
  });
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
}
