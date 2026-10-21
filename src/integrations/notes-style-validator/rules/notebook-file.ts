import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";

// A note's `notebooks` frontmatter lists Wolfram notebooks (.nb) offered as
// downloads at the end of the note. Each entry is a basename without the
// extension, resolving to /notebooks/<name>.nb, served from
// public/notebooks/.
//
// Two failure modes are caught here, both of which ship a broken download
// link without any other signal:
//
//  1. A note references a notebook that isn't on disk (a typo, or a file that
//     was renamed and the frontmatter wasn't updated).
//  2. A notebook sits in public/notebooks/ but no note references it, so it
//     is never reachable from the site.
//
// The second one is corpus-wide, since it needs every note's list.
export function checkNotebookFile(f: ScannedFile): Violation[] {
  const violations: Violation[] = [];

  for (const { value, line } of f.notebooks) {
    if (value.endsWith(".nb")) {
      violations.push({
        rule: "notebook-file",
        line,
        text: `notebook "${value}" should be listed without the .nb extension`,
        snippet: value,
      });
      continue;
    }

    if (!/^[\w-]+$/.test(value)) {
      violations.push({
        rule: "notebook-file",
        line,
        text: `notebook "${value}" is not a valid file name`,
        snippet: value,
      });
      continue;
    }

    if (!existsSync(join(f.notebookDir, `${value}.nb`))) {
      violations.push({
        rule: "notebook-file",
        line,
        text: `notebook "${value}.nb" does not exist in public/notebooks/`,
        snippet: value,
      });
    }
  }

  return violations;
}

// Notebooks in public/notebooks/ that no note links to.
export function checkNotebookFiles(
  files: ScannedFile[],
): Array<{ file: string; violation: Violation }> {
  const notebookDir = files[0]?.notebookDir;
  if (!notebookDir) return [];

  const referenced = new Set(
    files.flatMap((f) => f.notebooks.map((n) => n.value)),
  );

  const out: Array<{ file: string; violation: Violation }> = [];
  let entries: string[];
  try {
    entries = readdirSync(notebookDir);
  } catch {
    return [];
  }

  for (const entry of entries) {
    if (!entry.endsWith(".nb")) continue;
    const name = entry.slice(0, -".nb".length);
    if (referenced.has(name)) continue;
    out.push({
      file: `public/notebooks/${entry}`,
      violation: {
        rule: "notebook-file",
        line: 1,
        text: `notebook "${entry}" is not linked from any note`,
        snippet: entry,
      },
    });
  }

  return out;
}
