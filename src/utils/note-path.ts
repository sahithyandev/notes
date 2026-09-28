// Derives a note's public slug and sidebar order from its file path,
// rather than reading them out of frontmatter. The numeric prefix on each
// path segment is the single source of truth for both; see CLAUDE.md's
// "Slugs & file naming" section.
const NUMERIC_PREFIX = /^\d+-/;

/** relPath is the note's path relative to the `docs/` directory. */
export function slugFromDocsPath(relPath: string): string {
  const noExt = relPath.replace(/\.mdx?$/, "");
  return noExt
    .split("/")
    .map((segment) => segment.replace(NUMERIC_PREFIX, ""))
    .join("/");
}

/** filePath is a note's absolute or repo-relative path; only the basename matters. */
export function orderFromFilePath(filePath: string | undefined): number {
  if (!filePath) return 999;
  const base = filePath.split("/").pop() ?? "";
  const match = base.match(/^(\d+)-/);
  return match ? parseInt(match[1], 10) : 999;
}
