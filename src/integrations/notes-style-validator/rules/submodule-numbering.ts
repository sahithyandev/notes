import { basename, dirname } from "node:path";
import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";

// Files in a submodule (docs/<sem>/<module>/<submodule>/<note>) must be
// numbered from 01 within that submodule. Numbering that continues across
// submodules (06-, 07-, ... in the 2nd submodule) is flagged.
// Corpus-wide, since it needs to know the lowest number in each directory.
export function checkSubmoduleNumbering(
  files: ScannedFile[],
): Array<{ file: string; violation: Violation }> {
  const byDir = new Map<string, Array<{ f: ScannedFile; n: number }>>();
  for (const f of files) {
    if (f.slug.split("/").length < 4) continue;
    const m = /^(\d+)-/.exec(basename(f.file));
    if (!m) continue;
    const dir = dirname(f.file);
    if (!byDir.has(dir)) byDir.set(dir, []);
    byDir.get(dir)!.push({ f, n: Number(m[1]) });
  }

  const out: Array<{ file: string; violation: Violation }> = [];
  for (const entries of byDir.values()) {
    const min = Math.min(...entries.map((e) => e.n));
    if (min <= 1) continue;
    for (const { f } of entries) {
      const name = basename(f.file);
      out.push({
        file: f.file,
        violation: {
          rule: "submodule-numbering",
          line: 1,
          text: `"${name}" is numbered continuing from another submodule; numbering must restart at 01 in each submodule`,
          snippet: name,
        },
      });
    }
  }
  return out;
}
