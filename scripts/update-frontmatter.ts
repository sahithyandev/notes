import { writeFile } from "node:fs/promises";
import matter from "gray-matter";

// updates the frontmatter of mdx files
// and format with prettier
(async () => {
	const mdxFilePaths = process.argv.slice(2);
	for (const filepath of mdxFilePaths) {
		const file = matter.read(filepath);
		const { data: currentFrontMatter } = file;

		const updatedFrontMatter = {
			...currentFrontMatter,
			dateCreated: currentFrontMatter.dateCreated || new Date(),
			lastUpdatedOn: new Date(),
		};

		file.data = updatedFrontMatter;
		const updatedFileContent = matter.stringify(file);
		await writeFile(filepath, updatedFileContent);
	}
})();

// for testing
// process.exit(27);