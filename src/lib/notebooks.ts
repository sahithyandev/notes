import type { CollectionEntry } from "astro:content";
import { titleize } from "../utils";

export interface NotebookLink {
  title: string;
  href: string;
}

export interface NotebookItem {
  id: string;
  url: string;
  bytes: number;
  notes: NotebookLink[];
}

// One folder level of the docs tree that holds notebooks, directly or below.
// The root has an empty segment and label; its own notebooks sit at the top.
export interface NotebookGroup {
  segment: string;
  label: string;
  notebooks: NotebookItem[];
  children: NotebookGroup[];
}

const NUMERIC_PREFIX = /^\d+-/;

function labelFor(segment: string, depth: number): string {
  const sem = segment.match(/^s(\d)$/);
  if (depth === 0 && sem) return `Semester ${sem[1]}`;
  return titleize(segment.replace(NUMERIC_PREFIX, ""));
}

export function formatBytes(bytes: number): string {
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

// Groups notebooks by the folders above their `notebooks/` directory, so
// s5/numerical-methods/notebooks/x.nb lands under Semester 5 > Numerical Methods.
// Folders are only created for notebooks that exist, so no heading is ever
// rendered without content under it.
export function buildNotebookTree(
  notebooks: CollectionEntry<"notebooks">[],
  notes: CollectionEntry<"notes">[],
): NotebookGroup {
  const notesByNotebook = new Map<string, NotebookLink[]>();
  for (const note of notes) {
    for (const ref of note.data.notebooks ?? []) {
      const links = notesByNotebook.get(ref.id) ?? [];
      links.push({ title: note.data.title, href: `/${note.id}` });
      notesByNotebook.set(ref.id, links);
    }
  }

  const root: NotebookGroup = {
    segment: "",
    label: "",
    notebooks: [],
    children: [],
  };

  for (const entry of notebooks) {
    const dirs = entry.data.path.split("/").slice(0, -1);
    if (dirs.at(-1) === "notebooks") dirs.pop();

    let node = root;
    for (const [depth, segment] of dirs.entries()) {
      let child = node.children.find((c) => c.segment === segment);
      if (!child) {
        child = {
          segment,
          label: labelFor(segment, depth),
          notebooks: [],
          children: [],
        };
        node.children.push(child);
      }
      node = child;
    }

    node.notebooks.push({
      id: entry.id,
      url: entry.data.url,
      bytes: entry.data.bytes,
      notes: notesByNotebook.get(entry.id) ?? [],
    });
  }

  const sort = (group: NotebookGroup) => {
    group.children.sort((a, b) =>
      a.segment.localeCompare(b.segment, undefined, { numeric: true }),
    );
    group.notebooks.sort((a, b) => a.id.localeCompare(b.id));
    group.children.forEach(sort);
  };
  sort(root);

  return root;
}
