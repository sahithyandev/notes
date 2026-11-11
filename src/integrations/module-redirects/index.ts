import { join } from "node:path";
import type { AstroIntegration } from "astro";
import { ModuleRedirectsScanner } from "./scan.ts";
import { getModuleRedirectsScanner } from "./scanner-cache.ts";

export default function moduleRedirects(): AstroIntegration {
  let docsRoot = "";
  let scanner: ModuleRedirectsScanner;

  return {
    name: "module-redirects",
    hooks: {
      "astro:config:setup": ({ command, config, updateConfig, logger }) => {
        docsRoot = join(config.root.pathname.replace(/\/$/, ""), "docs");
        scanner = getModuleRedirectsScanner(docsRoot);
        const redirects = scanner.current;
        if (command === "build") {
          updateConfig({ redirects });
          logger.info(
            `added ${Object.keys(redirects).length} module redirects`,
          );
        } else {
          logger.info(
            `loaded ${Object.keys(redirects).length} live module redirects`,
          );
        }
      },

      // Redirect routes scan the docs directory at request time, so a changed
      // note affects the next request without rebuilding Astro's config.
      "astro:server:setup": ({ server, logger }) => {
        let timer: ReturnType<typeof setTimeout> | undefined;

        server.middlewares.use((req, res, next) => {
          const pathname = new URL(req.url ?? "/", "http://astro.local")
            .pathname;
          const to = scanner.current[pathname];

          if (!to) {
            next();
            return;
          }

          res.statusCode = 302;
          res.setHeader("Location", to);
          res.end();
        });

        scanner.onChange(() => {
          logger.info("module redirects updated from disk");
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
