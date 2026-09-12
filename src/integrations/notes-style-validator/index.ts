import { join } from "node:path";
import type { AstroIntegration, IntegrationResolvedRoute } from "astro";
import { runValidation } from "./validate.ts";

export interface NotesStyleValidatorOptions {
  /**
   * Scope checks to a semester, module, submodule, or note — e.g. "s1",
   * "s1/mathematics", "s1/mathematics/matrices", or a note name. Falls back
   * to the NOTES_STYLE_FILTER env var, so a module you're actively editing
   * can be scoped ad hoc (`NOTES_STYLE_FILTER=s1/mathematics bun dev`)
   * without editing astro.config.mjs.
   */
  filter?: string;
}

export default function notesStyleValidator(
  options: NotesStyleValidatorOptions = {},
): AstroIntegration {
  const filter = options.filter ?? process.env.NOTES_STYLE_FILTER;
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
          filter,
        });
      },

      // Pure file-scanning check with no dependency on rendered output, so
      // failing here (before pages are built) beats build:done. Deliberately
      // ignores `filter` — build is the CI safety net, so it must always
      // check the whole corpus even if a dev left NOTES_STYLE_FILTER set in
      // their shell from an earlier `bun dev` session.
      "astro:build:start": async ({ logger }) => {
        await runValidation(docsRoot, logger, {
          failOnNew: true,
          extraValidUrls: redirectUrls(),
        });
      },
    },
  };
}
