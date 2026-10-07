import { basename, dirname } from "node:path";
import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";
import { orderFromFilePath } from "../../../utils/note-path.ts";

// A note may only link to notes that come before it in its module. A link to
// a later sibling points the reader at material they haven't covered yet,
// the same reason prereq-scope bans prereqs on a later semester. Sibling means
// the same directory, so notes in different submodules are never compared.
// Corpus-wide, since it needs the target note's filename to know its order.
export function checkForwardLinks(
  files: ScannedFile[],
): Array<{ file: string; violation: Violation }> {
  const bySlug = new Map<string, ScannedFile>();
  for (const f of files) {
    if (f.slug) bySlug.set(`/${f.slug}`, f);
  }

  const out: Array<{ file: string; violation: Violation }> = [];
  for (const f of files) {
    const ownOrder = orderFromFilePath(f.file);
    for (const link of f.links) {
      if (link.kind !== "doc") continue;
      const target = bySlug.get(link.target);
      if (!target || dirname(target.file) !== dirname(f.file)) continue;
      if (orderFromFilePath(target.file) <= ownOrder) continue;
      out.push({
        file: f.file,
        violation: {
          rule: "forward-link",
          line: link.line,
          text: `link to "${basename(target.file)}", which comes after this note in the module`,
          snippet: link.raw,
        },
      });
    }
  }
  return out;
}
