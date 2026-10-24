import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";
import { summaryNotebookId } from "../../../utils/summary-notebook.ts";

// A note's `notebooks` frontmatter lists Wolfram notebooks (.nb) offered as
// downloads at the end of the note. Each entry is a basename without the
// extension. The .nb files sit anywhere under docs/ (usually a module's
// notebooks/ folder) and are served at /notebooks/<name>.nb.
//
// Two failure modes are caught here, both of which ship a broken download
// link without any other signal:
//
//  1. A note references a notebook that isn't on disk (a typo, or a file that
//     was renamed and the frontmatter wasn't updated).
//  2. A notebook sits under docs/ but no note references it, so it is never
//     reachable from the site.
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

    if (!f.notebookFiles.has(value)) {
      violations.push({
        rule: "notebook-file",
        line,
        text: `notebook "${value}.nb" does not exist under docs/`,
        snippet: value,
      });
    }
  }

  return violations;
}

// .nb files under docs/ that no note links to.
export function checkNotebookFiles(
  files: ScannedFile[],
): Array<{ file: string; violation: Violation }> {
  const notebookFiles = files[0]?.notebookFiles;
  if (!notebookFiles) return [];

  // A module's summary notebook is linked from every note in that module, so
  // it counts as referenced whenever one of those notes exists.
  const referenced = new Set(
    files.flatMap((f) => {
      const summary = summaryNotebookId(f.slug);
      return [
        ...f.notebooks.map((n) => n.value),
        ...(summary ? [summary] : []),
      ];
    }),
  );

  const out: Array<{ file: string; violation: Violation }> = [];
  for (const [name, path] of notebookFiles) {
    if (referenced.has(name)) continue;
    out.push({
      file: `docs/${path}`,
      violation: {
        rule: "notebook-file",
        line: 1,
        text: `notebook "${name}.nb" is not linked from any note`,
        snippet: `${name}.nb`,
      },
    });
  }

  return out;
}
