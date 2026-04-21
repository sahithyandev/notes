import { readdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import matter from "gray-matter";

const PATTERN_TITLE_PREFIX = /(\d+)-/;

function safeParseInt(value: string | undefined, defaultValue: number | undefined = undefined) {
	if (typeof value === "undefined") return defaultValue;

	const parsed = Number.parseInt(value);
	if (Number.isNaN(parsed)) {
		return defaultValue;
	}
	return parsed;
}

export async function autoSlug(mdFilePaths: string[], dryRun: boolean = false) {
  // remove images and summary from the file
  // do it in-place so that it is more performant
  mdFilePaths = mdFilePaths.filter((filePath) => {
    if (!filePath.endsWith(".md") || filePath.includes("/summary/") || filePath.includes("/images/")) {
      return false;
    }
    return true;
  });
  
	for (let i = 0; i < mdFilePaths.length; i++) {
		const filePath = mdFilePaths[i];
		const file = matter.read(filePath);
		const { data: currentFrontMatter } = file;

		if (!currentFrontMatter.title) {
			return;
		}
		const relativeFromDocsDirectory = relative("docs", filePath);
		const parts = relativeFromDocsDirectory.split("/");
		parts.pop();
		const section = parts.join("/");

		file.data = {
			...currentFrontMatter,
		};

		const slugSection = relativeFromDocsDirectory.replace(".md", "");
		const pathParts = slugSection.split("/");
		
		// Remove numeric prefix from all parts
		const cleanedParts = pathParts.map(part => part.replace(PATTERN_TITLE_PREFIX, ""));
		
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
		if (i === mdFilePaths.length - 1 || !mdFilePaths[i + 1].includes(section)) {
			file.data.next = false;
			console.log(">>> next false");
		} else {
			file.data.next = true;
			console.log(">>> next true");
		}
		
		if (dryRun) {
			console.log(`[DRY RUN] Would update: ${filePath}`);
			console.log(`[DRY RUN] New slug: ${file.data.slug}`);
			console.log(`[DRY RUN] Prev: ${file.data.prev}, Next: ${file.data.next}`);
		} else {
			const updatedFileContent = matter.stringify(file, {});
			writeFile(filePath, updatedFileContent);
		}
	}
}

// updates the frontmatter of mdx files
if (require.main === module) {
	const directories: Array<string> = [];
	const filePaths: Array<string> = [];
	
	// Check for --dry-run flag
	const dryRun = process.argv.includes("--dry-run");
	const argsToProcess = dryRun ? process.argv.slice(2, -1) : process.argv.slice(2);

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