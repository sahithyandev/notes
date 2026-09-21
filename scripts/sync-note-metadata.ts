import { readdirSync } from "node:fs";
import { lstat, rename, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative } from "node:path";
import matter from "gray-matter";
import { format, resolveConfig } from "prettier";

const PATTERN_TITLE_PREFIX = /(\d+)-/;

function safeParseInt(
  value: string | undefined,
  defaultValue: number | undefined = undefined,
) {
  if (typeof value === "undefined") return defaultValue;

  const parsed = Number.parseInt(value);
  if (Number.isNaN(parsed)) {
    return defaultValue;
  }
  return parsed;
}

async function renumberFiles(
  filePaths: string[],
  dryRun: boolean,
): Promise<string[]> {
  const byDir = new Map<string, string[]>();
  for (const p of filePaths) {
    if (p.includes("/summary/") || p.includes("/images/")) continue;
    if (!p.endsWith(".md") && !p.endsWith(".mdx")) continue;
    if (!PATTERN_TITLE_PREFIX.test(basename(p))) continue;
    const dir = dirname(p);
    if (!byDir.has(dir)) byDir.set(dir, []);
    byDir.get(dir)!.push(p);
  }

  const renames = new Map<string, string>();

  for (const [, files] of byDir) {
    files.sort((a, b) => {
      const na = parseInt(basename(a).match(PATTERN_TITLE_PREFIX)![1]);
      const nb = parseInt(basename(b).match(PATTERN_TITLE_PREFIX)![1]);
      return na - nb;
    });

    const firstNum = parseInt(
      basename(files[0]).match(PATTERN_TITLE_PREFIX)![1],
    );

    for (let i = 0; i < files.length; i++) {
      const expected = firstNum + i;
      const file = files[i];
      const base = basename(file);
      const currentNum = parseInt(base.match(PATTERN_TITLE_PREFIX)![1]);
      if (currentNum === expected) continue;

      const newBase = base.replace(
        PATTERN_TITLE_PREFIX,
        `${expected.toString().padStart(2, "0")}-`,
      );
      const newPath = join(dirname(file), newBase);
      if (dryRun) {
        console.log(`[DRY RUN] renumber: ${file} -> ${newPath}`);
      } else {
        await rename(file, newPath);
      }
      renames.set(file, newPath);
    }
  }

  return filePaths.map((p) => renames.get(p) ?? p);
}

export async function syncNoteMetadata(
  mdFilePaths: string[],
  dryRun: boolean = false,
) {
  mdFilePaths = await renumberFiles(mdFilePaths, dryRun);
  for (let i = 0; i < mdFilePaths.length; i++) {
    const filePath = mdFilePaths[i];
    if (filePath.includes("/summary/") || filePath.includes("/images/"))
      continue;
    if (!filePath.endsWith(".md") && !filePath.endsWith(".mdx")) continue;

    const newFilePath = filePath.replace(/.md$/, ".mdx");

    // Rename file from .md to .mdx
    if (newFilePath !== filePath) {
      if (dryRun) {
        console.log(`renaming: ${filePath} -> ${newFilePath}`);
      } else {
        await rename(filePath, newFilePath);
      }
    }

    const file = matter.read(dryRun ? filePath : newFilePath);
    const { data: currentFrontMatter } = file;

    if (!currentFrontMatter.title) {
      return;
    }
    const docsIndex = newFilePath.indexOf("docs/");
    const relativeFromDocsDirectory =
      docsIndex >= 0
        ? newFilePath.slice(docsIndex + "docs/".length)
        : relative("docs", newFilePath);
    const parts = relativeFromDocsDirectory.split("/");
    parts.pop();
    const section = parts.join("/");

    const stat = await lstat(dryRun ? filePath : newFilePath);

    const toDate = (v: unknown): Date | undefined => {
      if (v instanceof Date) return v;
      if (typeof v === "string") return new Date(v);
      return undefined;
    };

    // dateCreated is set once and kept; lastUpdatedOn is stamped fresh on
    // every commit, per CLAUDE.md ("lastUpdatedOn frontmatter is set on
    // commit").
    file.data = {
      ...currentFrontMatter,
      dateCreated: toDate(currentFrontMatter.dateCreated) ?? stat.birthtime,
      lastUpdatedOn: new Date(),
    };

    const slugSection = relativeFromDocsDirectory.replace(".mdx", "");
    const pathParts = slugSection.split("/");

    // Remove numeric prefix from all parts
    const cleanedParts = pathParts.map((part) =>
      part.replace(PATTERN_TITLE_PREFIX, ""),
    );

    // Reconstruct slug with semester at the beginning
    const newSlug = cleanedParts.join("/");
    file.data.slug = newSlug;

    // const s = await lstat(filePath);
    // const timeDelta = TIME_NOW - s.mtimeMs;
    // let isInsideTimeDelta = false;
    // if (timeDelta < TIME_DELTA) {
    // 	isInsideTimeDelta = true;
    // }
    // if (isInsideTimeDelta) {
    // 	file.data.sidebar.badge = "new";
    // } else {
    // 	file.data.sidebar.badge = undefined;
    // }
    if (!file.data.sidebar) {
      file.data.sidebar = {};
    }
    // Derive sidebar.order from the filename only (not directory prefix).
    const fileBaseName = basename(newFilePath);
    const orderMatched = fileBaseName.match(PATTERN_TITLE_PREFIX);
    if (orderMatched) {
      const orderNumber = safeParseInt(orderMatched[1]);
      if (orderNumber !== undefined) {
        file.data.sidebar.order = orderNumber;
      }
    } else {
      console.log(filePath, "isn't named correctly.");
    }
    console.log(`${i} ${section} ${file.data.slug}`);
    if (file.data.sidebar.order === 1) {
      file.data.prev = false;
      console.log(">>> prev false");
    } else {
      file.data.prev = true;
      console.log(">>> prev true");
    }
    const nextFile = mdFilePaths
      .slice(i + 1)
      .find(
        (p) =>
          dirname(p) === dirname(filePath) &&
          !p.includes("/summary/") &&
          !p.includes("/images/") &&
          (p.endsWith(".md") || p.endsWith(".mdx")) &&
          PATTERN_TITLE_PREFIX.test(basename(p)),
      );
    file.data.next = nextFile !== undefined;
    console.log(`>>> next ${file.data.next}`);

    if (dryRun) {
      console.log(`[DRY RUN] New slug: ${file.data.slug}`);
      console.log(`[DRY RUN] Prev: ${file.data.prev}, Next: ${file.data.next}`);
    } else {
      const updatedFileContent = matter.stringify(file.content, file.data);
      const config = await resolveConfig(newFilePath);
      const formattedContent = await format(updatedFileContent, {
        ...config,
        filepath: newFilePath,
      });
      await writeFile(newFilePath, formattedContent);
    }
  }
}

if (require.main === module) {
  const directories: Array<string> = [];
  const filePaths: Array<string> = [];

  // Check for --dry-run flag
  const dryRun = process.argv.includes("--dry-run");
  const argsToProcess = dryRun
    ? process.argv.slice(2, -1)
    : process.argv.slice(2);

  for (const changedFile of argsToProcess) {
    const changedDirectory = dirname(changedFile);
    if (directories.includes(changedDirectory)) {
      continue;
    }
    directories.push(changedDirectory);
    const files = readdirSync(changedDirectory);
    for (const file of files) {
      filePaths.push(join(changedDirectory, file));
    }
  }
  filePaths.sort();

  if (dryRun) {
    console.log("=== DRY RUN MODE - No files will be modified ===");
  }

  syncNoteMetadata(filePaths, dryRun);
}
