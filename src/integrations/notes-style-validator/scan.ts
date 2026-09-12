import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { maskFile, maskWholeLine } from "./mask.ts";

export interface ScannedHeading {
  level: number;
  text: string;
  line: number;
}

export interface ScannedFile {
  file: string;
  /** Full file split on "\n", 1-based via lines[i - 1]. */
  lines: string[];
  /** Same length, and same per-line character length, as `lines`. */
  maskedLines: string[];
  /** True for lines inside a fenced code block (including the frontmatter). */
  lineIsCode: boolean[];
  title: string;
  titleLine: number;
  headings: ScannedHeading[];
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

function frontmatterLineCount(raw: string): number {
  const m = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  if (!m) return 0;
  return m[0].split("\n").length - 1;
}

// Line number of the `title:` frontmatter field within the raw file (1-based).
function titleLineOf(raw: string): number {
  const lines = raw.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (i === 0 && lines[i].trim() !== "---") return 1;
    if (/^title:\s*/.test(lines[i])) return i + 1;
    if (i > 0 && lines[i].trim() === "---") break;
  }
  return 1;
}

function extractHeadings(
  content: string,
  lineOffset: number,
): ScannedHeading[] {
  const headings: ScannedHeading[] = [];
  const lines = content.split("\n");
  let inFence = false;
  let fenceMarker = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fence = /^\s*(```+|~~~+)/.exec(line);
    if (fence) {
      if (!inFence) {
        inFence = true;
        fenceMarker = fence[1][0];
      } else if (fence[1][0] === fenceMarker) {
        inFence = false;
      }
      continue;
    }
    if (inFence) continue;

    const m = /^(#{2,4})\s+(.+?)\s*$/.exec(line);
    if (m) {
      headings.push({
        level: m[1].length,
        text: m[2],
        line: i + 1 + lineOffset,
      });
    }
  }
  return headings;
}

export function scanFiles(docsRoot: string): ScannedFile[] {
  return walkDocs(docsRoot).map((file) => {
    const raw = readFileSync(file, "utf-8");
    const { data, content } = matter(raw);
    const { lines, maskedLines, lineIsCode } = maskFile(raw);

    // Frontmatter is never prose: mask it so YAML colons/dashes can't trip
    // the prose rules (label-description, em-dash, collapsed-label).
    const fmLines = frontmatterLineCount(raw);
    for (let i = 0; i < fmLines && i < lines.length; i++) {
      lineIsCode[i] = true;
      maskedLines[i] = maskWholeLine(lines[i]);
    }

    return {
      file,
      lines,
      maskedLines,
      lineIsCode,
      title: typeof data.title === "string" ? data.title : "",
      titleLine: titleLineOf(raw),
      headings: extractHeadings(content, fmLines),
    };
  });
}
