import { join } from "node:path";
import type { AstroIntegration } from "astro";
import { runValidation } from "./validate.ts";

export default function notesStyleValidator(): AstroIntegration {
  let docsRoot = "";

  return {
    name: "notes-style-validator",
    hooks: {
      "astro:config:setup": ({ config }) => {
        docsRoot = join(config.root.pathname.replace(/\/$/, ""), "docs");
      },

      "astro:server:start": async ({ logger }) => {
        await runValidation(docsRoot, logger, { failOnNew: false });
      },

      // Pure file-scanning check with no dependency on rendered output, so
      // failing here (before pages are built) beats build:done.
      "astro:build:start": async ({ logger }) => {
        await runValidation(docsRoot, logger, { failOnNew: true });
      },
    },
  };
}
