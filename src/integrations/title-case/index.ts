import { join } from "node:path";
import type { AstroIntegration } from "astro";
import { runValidation } from "./validate.ts";

export default function titleCase(): AstroIntegration {
  let docsRoot = "";

  return {
    name: "title-case",
    hooks: {
      "astro:config:setup": ({ config }) => {
        docsRoot = join(config.root.pathname.replace(/\/$/, ""), "docs");
      },

      "astro:server:start": async ({ logger }) => {
        await runValidation(docsRoot, logger);
      },

      "astro:build:done": async ({ logger }) => {
        await runValidation(docsRoot, logger);
      },
    },
  };
}
