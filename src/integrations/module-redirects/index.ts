import { join } from "node:path";
import type { AstroIntegration } from "astro";
import { ModuleRedirectsScanner } from "./scan.ts";

export default function moduleRedirects(): AstroIntegration {
  let docsRoot = "";
  let scanner: ModuleRedirectsScanner;

  return {
    name: "module-redirects",
    hooks: {
      "astro:config:setup": ({ config, updateConfig, logger }) => {
        docsRoot = join(config.root.pathname.replace(/\/$/, ""), "docs");
        scanner = new ModuleRedirectsScanner(docsRoot);
        const redirects = scanner.current;
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

        scanner.onChange(() => {
          logger.warn(
            "module redirects changed on disk; restart the dev server to pick them up",
          );
        });

        const onChange = (path: string) => {
          if (!scanner.isInDocs(path)) return;
          clearTimeout(timer);
          timer = setTimeout(() => scanner.handleChange(path), 100);
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
