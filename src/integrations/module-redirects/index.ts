import { join, relative } from "node:path";
import type { AstroIntegration } from "astro";
import { scanModuleRedirects } from "./scan.ts";

// Sorted JSON makes the comparison order-independent; the map has entries
// added and removed, not reordered, but this keeps the check honest either way.
function serialize(redirects: Record<string, string>): string {
  return JSON.stringify(
    Object.entries(redirects).sort(([a], [b]) => a.localeCompare(b)),
  );
}

export default function moduleRedirects(): AstroIntegration {
  let docsRoot = "";
  let current = "";

  return {
    name: "module-redirects",
    hooks: {
      "astro:config:setup": ({ config, updateConfig, logger }) => {
        docsRoot = join(config.root.pathname.replace(/\/$/, ""), "docs");
        const redirects = scanModuleRedirects(docsRoot);
        current = serialize(redirects);
        updateConfig({ redirects });
        logger.info(`added ${Object.keys(redirects).length} module redirects`);
      },

      // Vite's `server.restart()` only reloads the module graph — it does not
      // rerun `astro:config:setup` or rebuild the route manifest, so it can't
      // actually refresh the redirect map. There's no supported integration
      // hook for that either (`addWatchFile` matches exact paths, not new
      // files appearing in a directory). So this only warns; picking up the
      // change still needs a manual dev server restart.
      "astro:server:setup": ({ server, logger }) => {
        let timer: ReturnType<typeof setTimeout> | undefined;

        const onChange = (path: string) => {
          if (relative(docsRoot, path).startsWith("..")) return;
          clearTimeout(timer);
          timer = setTimeout(() => {
            const next = serialize(scanModuleRedirects(docsRoot));
            if (next === current) return;
            logger.warn(
              "module redirects changed on disk; restart the dev server to pick them up",
            );
          }, 100);
        };

        server.watcher
          .on("add", onChange)
          .on("unlink", onChange)
          .on("addDir", onChange)
          .on("unlinkDir", onChange);
      },
    },
  };
}
