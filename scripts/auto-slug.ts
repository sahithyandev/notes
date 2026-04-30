import { readdirSync } from "node:fs";
import { rename, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative } from "node:path";
import matter from "gray-matter";

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

export async function autoSlug(mdFilePaths: string[], dryRun: boolean = false) {
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

    file.data = {
      ...currentFrontMatter,
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
    const orderMatched = slugSection.match(PATTERN_TITLE_PREFIX);
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
      const updatedFileContent = matter.stringify(file, {});
      writeFile(newFilePath, updatedFileContent);
    }
  }
}

// updates the frontmatter of mdx files
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

  autoSlug(filePaths, dryRun);
}
