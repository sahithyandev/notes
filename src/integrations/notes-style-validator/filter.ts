// Matches a docs-relative file path against a --filter value scoped to a
// semester ("s1"), module ("s1/mathematics"), submodule
// ("s1/mathematics/matrices"), or a single note ("diagonalization" or
// "s1/mathematics/matrices/diagonalization"). Numeric directory/file
// prefixes are stripped from both sides before matching, so the filter never
// needs to know them, and matching looks for the filter's segments as a
// contiguous run anywhere in the path — not just as a root-anchored prefix —
// so a bare module or note name works regardless of which semester it's in.

function stripNumericPrefix(segment: string): string {
  return segment.replace(/^\d+-/, "");
}

export function normalizeForFilter(docsRelativePath: string): string {
  return docsRelativePath
    .replace(/^docs\//, "")
    .replace(/\.(mdx?|md)$/i, "")
    .split("/")
    .map(stripNumericPrefix)
    .join("/");
}

export function matchesFilter(
  docsRelativePath: string,
  filter: string | undefined,
): boolean {
  const needle = (filter ?? "").trim().replace(/^\/+|\/+$/g, "");
  if (!needle) return true;

  const pathSegments = normalizeForFilter(docsRelativePath)
    .toLowerCase()
    .split("/");
  const needleSegments = needle
    .split("/")
    .map((seg) => stripNumericPrefix(seg).toLowerCase());

  for (let i = 0; i + needleSegments.length <= pathSegments.length; i++) {
    if (needleSegments.every((seg, j) => pathSegments[i + j] === seg)) {
      return true;
    }
  }
  return false;
}
