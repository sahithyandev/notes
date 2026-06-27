import { generateModulePdf } from "./generate";
import { c, fmt } from "./log";
import { uploadPdf } from "./upload";
import { readdirSync } from "fs";
import { resolve } from "path";
import { spawn } from "node:child_process";

function getAllModuleIds(semFilter?: string): string[] {
  const docsPath = resolve("./docs");
  const semesters = readdirSync(docsPath, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.includes(".obsidian"))
    .map((d) => d.name)
    .filter((s) => !semFilter || s === semFilter);

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
  const upload = args.includes("--upload");
  const filteredArgs = args.filter((a) => a !== "--upload");

  const semGlob = filteredArgs[0]?.match(/^(s\d+)\/\*$/)?.[1];

  if (filteredArgs.includes("--all") || semGlob) {
    const moduleIds = getAllModuleIds(semGlob);
    console.log(
      `${c.bold}${c.cyan}pdf-generator${c.reset}  generating ${c.bold}${moduleIds.length}${c.reset} modules in parallel\n`,
    );

    const wallStart = performance.now();
    const results: Array<{ id: string; ms: number; ok: boolean }> = [];

    await Promise.all(
      moduleIds.map((id) => {
        const scriptPath = resolve(import.meta.dirname, "index.ts");
        const start = performance.now();
        return new Promise<void>((res) => {
          let output = "";
          const spawnArgs = upload
            ? [scriptPath, id, "--upload"]
            : [scriptPath, id];
          const child = spawn("bun", spawnArgs, { stdio: "pipe" });
          child.stdout.on("data", (d: Buffer) => (output += d.toString()));
          child.stderr.on("data", (d: Buffer) => (output += d.toString()));
          child.on("close", (code) => {
            const ms = performance.now() - start;
            const ok = code === 0;
            results.push({ id, ms, ok });
            process.stdout.write(output);
            res();
          });
        });
      }),
    );

    const wallMs = performance.now() - wallStart;
    const failed = results.filter((r) => !r.ok);
    const succeeded = results.filter((r) => r.ok);

    console.log(`\n${c.bold}Results${c.reset}`);
    for (const r of results.sort((a, b) => a.id.localeCompare(b.id))) {
      const icon = r.ok ? `${c.green}✓${c.reset}` : `${c.red}✗${c.reset}`;
      console.log(
        `  ${icon}  ${r.id.padEnd(45)} ${c.gray}${fmt(r.ms)}${c.reset}`,
      );
    }

    console.log(
      `\n${c.bold}Summary${c.reset}  ${c.green}${succeeded.length} passed${c.reset}` +
        (failed.length ? `  ${c.red}${failed.length} failed${c.reset}` : "") +
        `  ${c.gray}wall ${fmt(wallMs)}${c.reset}`,
    );

    if (failed.length) process.exit(1);
  } else {
    const moduleId = filteredArgs[0];
    if (!moduleId) {
      console.error(
        `Usage: index.ts ${c.cyan}<moduleId>${c.reset} | ${c.cyan}--all${c.reset} [${c.cyan}--upload${c.reset}]`,
      );
      process.exit(1);
    }
    const start = performance.now();
    await generateModulePdf(moduleId);
    if (upload) await uploadPdf(moduleId);
    console.log(
      `${c.green}✓${c.reset}  ${moduleId}  ${c.gray}${fmt(performance.now() - start)}${c.reset}`,
    );
  }
})();
