// Derives a note's public slug and sidebar order from its file path,
// rather than reading them out of frontmatter. The numeric prefix on each
// path segment is the single source of truth for both; see .agents/note-writing.md's
// "Slugs & file naming" section.
const NUMERIC_PREFIX = /^\d+-/;

/**
 * Resolves a prerequisite reference relative to the note that declares it.
 * Absolute collection IDs remain unchanged, while `./` and `../` references
 * are resolved from the declaring note's directory. Anchors are preserved.
 */
export function resolvePrereqSlug(
  sourceSlug: string,
  reference: string,
): string {
  const hashIndex = reference.indexOf("#");
  const path = hashIndex === -1 ? reference : reference.slice(0, hashIndex);
  const anchor = hashIndex === -1 ? "" : reference.slice(hashIndex);

  if (!path.startsWith(".")) return reference;

  const sourceDir = sourceSlug.slice(0, sourceSlug.lastIndexOf("/"));
  const segments = `${sourceDir}/${path}`.split("/");
  const resolved: string[] = [];
  for (const segment of segments) {
    if (!segment || segment === ".") continue;
    if (segment === "..") {
      resolved.pop();
    } else {
      resolved.push(segment);
    }
  }
  return `${resolved.join("/")}${anchor}`;
}

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
