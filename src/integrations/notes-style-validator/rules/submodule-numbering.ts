import { basename, dirname } from "node:path";
import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";

// Files in a submodule (docs/<sem>/<module>/<submodule>/<note>) must be
// numbered consecutively from 01 within that submodule. This catches both
// numbering that continues across submodules and a missing note number.
// Corpus-wide, since it needs to compare every note in a directory.
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
    entries.sort((a, b) => a.n - b.n);
    const min = Math.min(...entries.map((e) => e.n));
    if (min > 1) {
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

    for (let index = 1; index < entries.length; index++) {
      const previous = entries[index - 1];
      const current = entries[index];
      if (current.n <= previous.n + 1) continue;

      const missing = Array.from(
        { length: current.n - previous.n - 1 },
        (_, offset) => String(previous.n + offset + 1).padStart(2, "0"),
      );
      const name = basename(current.f.file);
      out.push({
        file: current.f.file,
        violation: {
          rule: "submodule-numbering",
          line: 1,
          text: `"${name}" skips missing note number${missing.length === 1 ? "" : "s"} ${missing.join(", ")}`,
          snippet: `${name}:${missing.join(",")}`,
        },
      });
    }
  }
  return out;
}
