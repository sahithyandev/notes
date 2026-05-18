import { join } from "node:path";
import type { AstroIntegration, IntegrationResolvedRoute } from "astro";
import { runValidation } from "./validate.ts";

export default function linkValidator(): AstroIntegration {
  let docsRoot = "";
  let capturedRoutes: IntegrationResolvedRoute[] = [];

  return {
    name: "link-validator",
    hooks: {
      "astro:config:setup": ({ config }) => {
        docsRoot = join(config.root.pathname.replace(/\/$/, ""), "docs");
      },

      "astro:routes:resolved": ({ routes }) => {
        capturedRoutes = routes;
      },

      "astro:server:start": async ({ logger }) => {
        const redirectUrls = capturedRoutes
          .filter((r) => r.type === "redirect" && r.pathname)
          .map((r) => r.pathname!.replace(/\/+$/, "") || "/");
        await runValidation(docsRoot, redirectUrls, logger);
      },

      "astro:build:done": async ({ logger }) => {
        const redirectUrls = capturedRoutes
          .filter((r) => r.type === "redirect" && r.pathname)
          .map((r) => r.pathname!.replace(/\/+$/, "") || "/");
        await runValidation(docsRoot, redirectUrls, logger);
      },
    },
  };
}
