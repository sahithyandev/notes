import { generateModulePdf } from "./core";
import { readdirSync } from "fs";
import { resolve } from "path";

function getAllModuleIds(): string[] {
  const docsPath = resolve("./docs");
  const semesters = readdirSync(docsPath, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.includes(".obsidian"))
    .map((d) => d.name);

  return semesters
    .flatMap((sem) =>
      readdirSync(resolve(docsPath, sem), { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => `${sem}/${d.name}`),
    )
    .sort((a, b) => {
      const semNum = (id: string) =>
        parseInt(id.replace(/^s(\d+)\/.*/, "$1"), 10);
      const diff = semNum(a) - semNum(b);
      return diff !== 0 ? diff : a.localeCompare(b);
    });
}

(async () => {
  const args = process.argv.slice(2);

  if (args.includes("--all")) {
    const moduleIds = getAllModuleIds();
    await Promise.all(moduleIds.map((id) => generateModulePdf(id)));
  } else {
    const moduleId = args[0];
    if (!moduleId) {
      console.error("Usage: index.ts <moduleId> | --all");
      process.exit(1);
    }
    await generateModulePdf(moduleId);
  }
})();
