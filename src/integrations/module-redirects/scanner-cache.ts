import { join, resolve } from "node:path";
import { ModuleRedirectsScanner } from "./scan.ts";

const scanners = new Map<string, ModuleRedirectsScanner>();

export function getModuleRedirectsScanner(
  docsRoot: string = join(process.cwd(), "docs"),
): ModuleRedirectsScanner {
  const root = resolve(docsRoot);
  let scanner = scanners.get(root);
  if (!scanner) {
    scanner = new ModuleRedirectsScanner(root);
    scanners.set(root, scanner);
  }
  return scanner;
}
