import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { maskFile, maskWholeLine } from "./mask.ts";

export interface ScannedHeading {
  level: number;
  text: string;
  line: number;
}

export interface ScannedPrereq {
  value: string;
  line: number;
}

export type LinkKind = "doc" | "image" | "in-page";

export interface ExtractedLink {
  raw: string;
  /** The path part (no anchor, no trailing slash). Empty for in-page anchors. */
  target: string;
  anchor: string | null;
  kind: LinkKind;
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
  /** Frontmatter slug (public URL path, no leading slash). */
  slug: string;
  /** GitHub-style anchor slugs for every heading (h1-h6), for in-page/cross-note anchor checks. */
  headingSlugs: Set<string>;
  prereqs: ScannedPrereq[];
  links: ExtractedLink[];
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

// GitHub-style heading slugger matching @astrojs/markdown-remark behavior.
function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-");
}

// Strips markdown formatting from heading text (bold, italic, backticks, links).
function stripHeadingMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`]/g, "")
    .trim();
}

// All heading levels (h1-h6), for anchor-link validation. Distinct from
// `extractHeadings` above, which only tracks h2-h4 for the title-case rule.
function extractHeadingSlugs(content: string): Set<string> {
  const slugs = new Set<string>();
  for (const line of content.split("\n")) {
    const m = /^#{1,6}\s+(.+)$/.exec(line);
    if (m) slugs.add(slugifyHeading(stripHeadingMarkdown(m[1])));
  }
  return slugs;
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

function extractLinks(content: string, lineOffset: number): ExtractedLink[] {
  const links: ExtractedLink[] = [];
  const lines = content.split("\n");

  // Non-image markdown links.
  const docLinkRe = /(?<!!)\[(?:[^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  // Image links.
  const imgLinkRe = /!\[(?:[^\]]*)\]\(([^)\s]+)/g;

  function parseLinkUrl(
    raw: string,
    kind: "doc" | "image",
    lineNum: number,
  ): ExtractedLink | null {
    // Skip external and non-http protocols.
    if (
      raw.startsWith("http:") ||
      raw.startsWith("https:") ||
      raw.startsWith("mailto:") ||
      raw.startsWith("tel:")
    ) {
      return null;
    }

    if (kind === "image") {
      // Only handle relative image paths.
      if (!raw.startsWith(".")) return null;
      return { raw, target: raw, anchor: null, kind: "image", line: lineNum };
    }

    // In-page anchor only.
    if (raw.startsWith("#")) {
      return {
        raw,
        target: "",
        anchor: raw.slice(1),
        kind: "in-page",
        line: lineNum,
      };
    }

    // Absolute slug path.
    if (raw.startsWith("/")) {
      const hashIdx = raw.indexOf("#");
      const anchor = hashIdx !== -1 ? raw.slice(hashIdx + 1) : null;
      const path = hashIdx !== -1 ? raw.slice(0, hashIdx) : raw;
      const target = path.replace(/\/+$/, "") || "/"; // normalize trailing slash
      return { raw, target, anchor, kind: "doc", line: lineNum };
    }

    return null;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1 + lineOffset;

    for (const m of line.matchAll(docLinkRe)) {
      const link = parseLinkUrl(m[1], "doc", lineNum);
      if (link) links.push(link);
    }
    for (const m of line.matchAll(imgLinkRe)) {
      const link = parseLinkUrl(m[1], "image", lineNum);
      if (link) links.push(link);
    }
  }

  return links;
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

    const prereqs = Array.isArray(data.prereqs)
      ? data.prereqs.filter((p): p is string => typeof p === "string")
      : [];

    return {
      file,
      lines,
      maskedLines,
      lineIsCode,
      title: typeof data.title === "string" ? data.title : "",
      titleLine: titleLineOf(raw),
      headings: extractHeadings(content, fmLines),
      slug: typeof data.slug === "string" ? data.slug : "",
      headingSlugs: extractHeadingSlugs(content),
      prereqs: prereqLinesOf(raw, prereqs),
      links: extractLinks(content, fmLines),
    };
  });
}
