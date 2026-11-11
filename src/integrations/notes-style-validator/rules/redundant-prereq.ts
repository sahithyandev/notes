import { basename, dirname } from "node:path";
import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";
import {
  orderFromFilePath,
  resolvePrereqSlug,
} from "../../../utils/note-path.ts";

function resolvedPrereq(f: ScannedFile, value: string): string {
  return resolvePrereqSlug(f.slug, value);
}

// A note in a numbered sequence inherits the prerequisites of the immediately
// preceding note in the same directory. Repeating one there adds noise and
// makes it look like the later note has an independent dependency.
export function checkRedundantPrereqs(
  files: ScannedFile[],
): Array<{ file: string; violation: Violation }> {
  const byDir = new Map<string, ScannedFile[]>();
  for (const f of files) {
    const dir = dirname(f.file);
    if (!byDir.has(dir)) byDir.set(dir, []);
    byDir.get(dir)!.push(f);
  }

  const out: Array<{ file: string; violation: Violation }> = [];
  for (const entries of byDir.values()) {
    entries.sort(
      (a, b) => orderFromFilePath(a.file) - orderFromFilePath(b.file),
    );

    for (let index = 1; index < entries.length; index++) {
      const previous = entries[index - 1];
      const current = entries[index];
      const previousOrder = orderFromFilePath(previous.file);
      const currentOrder = orderFromFilePath(current.file);

      // A missing note breaks the consecutive sequence. The numbering rule
      // reports that gap separately.
      if (currentOrder !== previousOrder + 1) continue;

      const previousPrereqs = new Set(
        previous.prereqs.map(({ value }) => resolvedPrereq(previous, value)),
      );
      for (const { value, line } of current.prereqs) {
        if (!previousPrereqs.has(resolvedPrereq(current, value))) continue;
        out.push({
          file: current.file,
          violation: {
            rule: "redundant-prereq",
            line,
            text: `prereq "${value}" is inherited from the preceding note "${basename(previous.file)}"; remove it here`,
            snippet: value,
          },
        });
      }
    }
  }

  return out;
}
