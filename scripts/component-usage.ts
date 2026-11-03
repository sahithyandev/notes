// Reports direct Astro component references across site templates and notes.
//
// Usage:
//   bun scripts/component-usage.ts
//   bun scripts/component-usage.ts --limit 20
//   bun scripts/component-usage.ts --json
//   bun scripts/component-usage.ts --show-files
//
// "Places" is the number of distinct .astro/.mdx source files that reference
// a component. "Uses" is the total number of component tags. It intentionally
// reports direct references, not the number of generated pages a component
// reaches through a shared layout or route.
import { readdir, readFile } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";

type Usage = {
  component: string;
  path: string;
  places: number;
  uses: number;
  files: string[];
};

const root = process.cwd();
const componentRoots = ["src/components", "src/layouts"];
const sourceRoots = ["src", "docs"];

function toPosix(path: string) {
  return path.split(sep).join("/");
}

async function filesUnder(
  directory: string,
  extensions: string[],
): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) return filesUnder(path, extensions);
      return extensions.some((extension) => entry.name.endsWith(extension))
        ? [path]
        : [];
    }),
  );
  return files.flat();
}

function componentName(file: string) {
  return file
    .split(sep)
    .at(-1)!
    .replace(/\.astro$/, "")
    .split(/[/-]/)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join("");
}

function stripCode(text: string) {
  return text.replace(/^```[\s\S]*?^```\s*$/gm, "").replace(/`[^`]*`/g, "");
}

function template(text: string, extension: string) {
  if (extension !== ".astro") return stripCode(text);
  const frontmatter = text.match(/^---\s*\n[\s\S]*?\n---\s*\n/);
  return frontmatter ? text.slice(frontmatter[0].length) : text;
}

function tagCounts(text: string) {
  const counts = new Map<string, number>();
  for (const match of text.matchAll(/<([A-Z][A-Za-z0-9_.]*)\b/g)) {
    const name = match[1];
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return counts;
}

async function astroImports(file: string, text: string) {
  const imports = new Map<string, string>();
  for (const match of text.matchAll(
    /import\s+([A-Za-z_$][\w$]*)\s+from\s+["']([^"']+\.astro)["']/g,
  )) {
    const [, localName, specifier] = match;
    if (!specifier.startsWith(".")) continue;
    imports.set(localName, resolve(file, "..", specifier));
  }
  return imports;
}

async function illustrationExports() {
  const file = resolve(root, "src/components/illustrations/index.ts");
  const exports = new Map<string, string>();
  const text = await readFile(file, "utf8");
  for (const match of text.matchAll(
    /export\s+\{\s+default\s+as\s+(\w+)\s+\}\s+from\s+["'](.+?\.astro)["']/g,
  )) {
    exports.set(match[1], resolve(file, "..", match[2]));
  }
  return exports;
}

function parseOptions(argv: string[]) {
  let json = false;
  let showFiles = false;
  let limit: number | undefined;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--json") json = true;
    else if (argument === "--show-files") showFiles = true;
    else if (argument === "--limit") {
      const value = Number(argv[index + 1]);
      if (!Number.isInteger(value) || value < 1) {
        throw new Error("--limit must be a positive integer");
      }
      limit = value;
      index += 1;
    } else {
      throw new Error(
        "Usage: bun run component-usage -- [--limit N] [--show-files] [--json]",
      );
    }
  }
  return { json, showFiles, limit };
}

const options = parseOptions(process.argv.slice(2));
const componentFiles = (
  await Promise.all(
    componentRoots.map((directory) =>
      filesUnder(resolve(root, directory), [".astro"]),
    ),
  )
).flat();
const byPath = new Map(componentFiles.map((file) => [resolve(file), file]));
const mdxComponents = new Map<string, string>();
const illustrationComponents = await illustrationExports();
const exportedNames = new Map(
  [...illustrationComponents].map(([name, file]) => [resolve(file), name]),
);
for (const file of componentFiles) mdxComponents.set(componentName(file), file);
for (const [name, file] of illustrationComponents)
  mdxComponents.set(name, file);

const usages = new Map<string, Usage>();
for (const file of componentFiles) {
  const path = toPosix(relative(root, file));
  usages.set(file, {
    component: exportedNames.get(resolve(file)) ?? componentName(file),
    path,
    places: 0,
    uses: 0,
    files: [],
  });
}

const sourceFiles = (
  await Promise.all(
    sourceRoots.map((directory) =>
      filesUnder(resolve(root, directory), [".astro", ".mdx"]),
    ),
  )
).flat();

for (const file of sourceFiles) {
  const text = await readFile(file, "utf8");
  const extension = file.endsWith(".astro") ? ".astro" : ".mdx";
  const imports =
    extension === ".astro" ? await astroImports(file, text) : mdxComponents;
  const counts = tagCounts(template(text, extension));
  for (const [tag, count] of counts) {
    const component = tag === "Astro.self" ? file : imports.get(tag);
    const componentFile = component && byPath.get(resolve(component));
    if (!componentFile) continue;
    const usage = usages.get(componentFile)!;
    usage.places += 1;
    usage.uses += count;
    usage.files.push(toPosix(relative(root, file)));
  }
}

const report = [...usages.values()].sort(
  (a, b) =>
    b.places - a.places || b.uses - a.uses || a.path.localeCompare(b.path),
);

if (options.json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const rows = options.limit ? report.slice(0, options.limit) : report;
  const componentWidth = Math.max(
    "Component".length,
    ...rows.map((row) => row.component.length),
  );
  const placesWidth = Math.max(
    "Places".length,
    ...rows.map((row) => String(row.places).length),
  );
  const usesWidth = Math.max(
    "Uses".length,
    ...rows.map((row) => String(row.uses).length),
  );
  const astroFiles = sourceFiles.filter((file) =>
    file.endsWith(".astro"),
  ).length;
  const mdxFiles = sourceFiles.length - astroFiles;
  console.log("Direct Astro and MDX component references");
  console.log(
    `${report.length} components • ${astroFiles} Astro files • ${mdxFiles} docs/*.mdx files`,
  );
  console.log();
  console.log(
    `${"Component".padEnd(componentWidth)}  ${"Places".padStart(placesWidth)}  ${"Uses".padStart(usesWidth)}  Path`,
  );
  console.log(
    `${"-".repeat(componentWidth)}  ${"-".repeat(placesWidth)}  ${"-".repeat(usesWidth)}  ----`,
  );
  for (const row of rows) {
    console.log(
      `${row.component.padEnd(componentWidth)}  ${String(row.places).padStart(placesWidth)}  ${String(row.uses).padStart(usesWidth)}  ${row.path}`,
    );
    if (options.showFiles && row.files.length) {
      for (const file of row.files) console.log(`  - ${file}`);
    }
  }
}
