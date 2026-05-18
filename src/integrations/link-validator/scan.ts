import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import matter from "gray-matter";

export type LinkKind = "doc" | "image" | "in-page";

export interface ExtractedLink {
  raw: string;
  /** The path part (no anchor, no trailing slash) */
  target: string;
  anchor: string | null;
  kind: LinkKind;
  line: number;
}

export interface ScannedFile {
  file: string;
  /** Frontmatter slug (public URL path, no leading slash) */
  slug: string;
  headings: Set<string>;
  links: ExtractedLink[];
}

// GitHub-style heading slugger matching @astrojs/markdown-remark behavior
function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-");
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

// Strips markdown formatting from heading text (bold, italic, backticks, links)
function stripMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`]/g, "")
    .trim();
}

function extractHeadings(content: string): Set<string> {
  const headings = new Set<string>();
  for (const line of content.split("\n")) {
    const m = /^#{1,6}\s+(.+)$/.exec(line);
    if (m) {
      headings.add(slugifyHeading(stripMarkdown(m[1])));
    }
  }
  return headings;
}

function frontmatterOffset(raw: string): number {
  const m = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  if (!m) return 0;
  return m[0].split("\n").length - 1;
}

function extractLinks(content: string, lineOffset: number): ExtractedLink[] {
  const links: ExtractedLink[] = [];
  const lines = content.split("\n");

  // Non-image markdown links
  const docLinkRe = /(?<!!)\[(?:[^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  // Image links
  const imgLinkRe = /!\[(?:[^\]]*)\]\(([^)\s]+)/g;

  function parseLinkUrl(
    raw: string,
    kind: "doc" | "image",
    lineNum: number,
  ): ExtractedLink | null {
    // Skip external and non-http protocols
    if (
      raw.startsWith("http:") ||
      raw.startsWith("https:") ||
      raw.startsWith("mailto:") ||
      raw.startsWith("tel:")
    ) {
      return null;
    }

    if (kind === "image") {
      // Only handle relative image paths
      if (!raw.startsWith(".")) return null;
      return {
        raw,
        target: raw,
        anchor: null,
        kind: "image",
        line: lineNum,
      };
    }

    // In-page anchor only
    if (raw.startsWith("#")) {
      return {
        raw,
        target: "",
        anchor: raw.slice(1),
        kind: "in-page",
        line: lineNum,
      };
    }

    // Absolute slug path
    if (raw.startsWith("/")) {
      const hashIdx = raw.indexOf("#");
      const anchor = hashIdx !== -1 ? raw.slice(hashIdx + 1) : null;
      const path = hashIdx !== -1 ? raw.slice(0, hashIdx) : raw;
      // Normalise trailing slash
      const target = path.replace(/\/+$/, "") || "/";
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

export function scanDocs(docsRoot: string): ScannedFile[] {
  const files = walkDocs(docsRoot);
  return files.map((file) => {
    const raw = readFileSync(file, "utf-8");
    const { data, content } = matter(raw);
    const slug: string = data.slug ?? "";
    const headings = extractHeadings(content);
    const links = extractLinks(content, frontmatterOffset(raw));
    return { file, slug, headings, links };
  });
}

export function resolveImageCandidates(sourceFile: string): string[] {
  const imagesDir = join(dirname(sourceFile), "images");
  try {
    return readdirSync(imagesDir).map((name) => `./images/${name}`);
  } catch {
    return [];
  }
}

export function imageExists(sourceFile: string, relPath: string): boolean {
  try {
    statSync(resolve(dirname(sourceFile), relPath));
    return true;
  } catch {
    return false;
  }
}
