import { writeFile } from "node:fs/promises";
import matter from "gray-matter";
import { format } from "prettier";

// updates the frontmatter of mdx files
// and format with prettier
(async () => {
  const mdxFilePaths = process.argv.slice(2);
  for (const filepath of mdxFilePaths) {
    if (!filepath.endsWith(".md") && !filepath.endsWith(".mdx")) {
      continue;
    }
    const file = matter.read(filepath);
    const { data: currentFrontMatter } = file;

    const updatedFrontMatter = {
      ...currentFrontMatter,
      dateCreated: currentFrontMatter.dateCreated || new Date(),
      lastUpdatedOn: new Date(),
    };

    file.data = updatedFrontMatter;
    const updatedFileContent = matter.stringify(file.content, file.data);
    const formattedContent = await format(updatedFileContent, { filepath });
    await writeFile(filepath, formattedContent);
  }
})();

// for testing
// process.exit(27);
