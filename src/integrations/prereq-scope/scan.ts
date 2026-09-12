import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";

export interface ScannedPrereq {
  value: string;
  line: number;
}

export interface ScannedFile {
  file: string;
  slug: string;
  prereqs: ScannedPrereq[];
}

const EXCLUDED = new Set(["images", "summary"]);

function walkDocs(dir: string, files: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (EXCLUDED.has(name)) continue;
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walkDocs(full, files);
    } else if (name.endsWith(".md") || name.endsWith(".mdx")) {
      files.push(full);
    }
  }
  return files;
}

// Locates each prereq entry's line number (1-based) within the raw
// frontmatter block, covering both the block-sequence form
// (`prereqs:\n  - a\n  - b`) and the inline form (`prereqs: [a, b]`).
function prereqLinesOf(raw: string, prereqs: string[]): ScannedPrereq[] {
  const lines = raw.split("\n");
  let prereqsLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (i > 0 && lines[i].trim() === "---") break;
    if (/^prereqs:\s*/.test(lines[i])) {
      prereqsLine = i;
      break;
    }
  }
  if (prereqsLine === -1) {
    return prereqs.map((value) => ({ value, line: 1 }));
  }

  // Inline form: `prereqs: [a, b]` — report the `prereqs:` line itself.
  if (/^prereqs:\s*\[/.test(lines[prereqsLine])) {
    return prereqs.map((value) => ({ value, line: prereqsLine + 1 }));
  }

  // Block-sequence form: find each `- <value>` line following `prereqs:`.
  const remaining = new Map<string, number>();
  for (const value of prereqs) {
    if (!remaining.has(value)) remaining.set(value, 0);
  }
  const result: ScannedPrereq[] = [];
  for (let i = prereqsLine + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "---") break;
    const m = /^\s*-\s*(.+?)\s*$/.exec(line);
    if (!m) {
      if (/^\S/.test(line)) break; // next top-level frontmatter key
      continue;
    }
    const value = m[1].replace(/^["']|["']$/g, "");
    if (remaining.has(value)) {
      result.push({ value, line: i + 1 });
    }
  }

  // Fall back to the `prereqs:` line for any entry not matched above
  // (e.g. quoting quirks the regex above didn't anticipate).
  const found = new Set(result.map((r) => r.value));
  for (const value of prereqs) {
    if (!found.has(value)) result.push({ value, line: prereqsLine + 1 });
  }

  return result;
}

export function scanPrereqs(docsRoot: string): ScannedFile[] {
  return walkDocs(docsRoot).map((file) => {
    const raw = readFileSync(file, "utf-8");
    const { data } = matter(raw);
    const slug = typeof data.slug === "string" ? data.slug : "";
    const prereqs = Array.isArray(data.prereqs)
      ? data.prereqs.filter((p): p is string => typeof p === "string")
      : [];
    return {
      file,
      slug,
      prereqs: prereqLinesOf(raw, prereqs),
    };
  });
}
