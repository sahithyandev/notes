// Runs notes-style-validator directly, without booting Astro. Same checks,
// same redirect-awareness, same pass/fail semantics as `bun run build`, but
// scans docs/ in isolation so it's fast enough to run after every edit.
import { join } from "node:path";
import { runValidation } from "../src/integrations/notes-style-validator/validate.ts";
import { scanModuleRedirects } from "../src/integrations/module-redirects/scan.ts";

const docsRoot = join(process.cwd(), "docs");

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
    failOnNew: true,
    extraValidUrls,
  });
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
}
