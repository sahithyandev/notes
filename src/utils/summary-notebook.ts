// Each module with a summary notebook has one, named `<module>-summary.nb`
// in its notebooks/ folder. Every note in the module links to it, so the link
// comes from the note's slug instead of its frontmatter.
const SUFFIX = "-summary";

/**
 * Id of the summary notebook for a note, given the note's slug. For
 * `s5/numerical-methods/gaussian-elimination` this is
 * `numerical-methods-summary`. Returns null for a note that is not in a module.
 */
export function summaryNotebookId(slug: string): string | null {
  const segments = slug.split("/");
  if (segments.length < 3) return null;
  return `${segments[segments.length - 2]}${SUFFIX}`;
}
