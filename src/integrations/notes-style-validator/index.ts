import { join } from "node:path";
import type { AstroIntegration, IntegrationResolvedRoute } from "astro";
import { runValidation } from "./validate.ts";

export default function notesStyleValidator(): AstroIntegration {
  let docsRoot = "";
  let capturedRoutes: IntegrationResolvedRoute[] = [];

  // Astro-generated redirects (e.g. from module-redirects, for renamed
  // modules) are valid link targets even though no note carries that slug.
  function redirectUrls(): string[] {
    return capturedRoutes
      .filter((r) => r.type === "redirect" && r.pathname)
      .map((r) => r.pathname!.replace(/\/+$/, "") || "/");
  }

  return {
    name: "notes-style-validator",
    hooks: {
      "astro:config:setup": ({ config }) => {
        docsRoot = join(config.root.pathname.replace(/\/$/, ""), "docs");
      },

      // Fires before both astro:server:start and astro:build:start, so
      // capturedRoutes is always populated by the time either runs.
      "astro:routes:resolved": ({ routes }) => {
        capturedRoutes = routes;
      },

      "astro:server:start": async ({ logger }) => {
        await runValidation(docsRoot, logger, {
          failOnNew: false,
          extraValidUrls: redirectUrls(),
        });
      },

      // Pure file-scanning check with no dependency on rendered output, so
      // failing here (before pages are built) beats build:done.
      "astro:build:start": async ({ logger }) => {
        await runValidation(docsRoot, logger, {
          failOnNew: true,
          extraValidUrls: redirectUrls(),
        });
      },
    },
  };
}
