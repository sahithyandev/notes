import { join } from "node:path";
import type { AstroIntegration } from "astro";
import { runValidation } from "./validate.ts";

export default function prereqScope(): AstroIntegration {
  let docsRoot = "";

  return {
    name: "prereq-scope",
    hooks: {
      "astro:config:setup": ({ config }) => {
        docsRoot = join(config.root.pathname.replace(/\/$/, ""), "docs");
      },

      "astro:server:start": async ({ logger }) => {
        await runValidation(docsRoot, logger);
      },

      "astro:build:start": async ({ logger }) => {
        await runValidation(docsRoot, logger);
      },
    },
  };
}
