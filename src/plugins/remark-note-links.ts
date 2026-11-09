import { dirname, relative, sep } from "node:path";
import { visit } from "unist-util-visit";

const NUMERIC_PREFIX = /^\d+-/;
const EXTERNAL_PROTOCOL = /^[a-z][a-z\d+.-]*:/i;

function publicPathFromSource(sourcePath: string, docsRoot?: string): string {
  let docsRelative: string;
  if (docsRoot) {
    docsRelative = relative(docsRoot, sourcePath);
  } else {
    const docsMarker = `${sep}docs${sep}`;
    const docsIndex = sourcePath.lastIndexOf(docsMarker);
    if (docsIndex === -1) return "";
    docsRelative = relative(
      sourcePath.slice(0, docsIndex + docsMarker.length),
      sourcePath,
    );
  }

  return docsRelative
    .replace(/\.mdx?$/i, "")
    .split(/[\\/]/)
    .map((segment) => segment.replace(NUMERIC_PREFIX, ""))
    .join("/");
}

function splitUrl(url: string): {
  path: string;
  suffix: string;
} {
  const match = url.match(/^([^?#]*)([?#].*)?$/);
  return { path: match?.[1] ?? url, suffix: match?.[2] ?? "" };
}

export function normalizeNoteLink(
  url: string,
  sourcePath: string,
  docsRoot?: string,
): string | null {
  if (
    !url ||
    url.startsWith("<") ||
    url.startsWith("/") ||
    url.startsWith("#") ||
    url.startsWith("//") ||
    EXTERNAL_PROTOCOL.test(url)
  ) {
    return null;
  }

  const { path, suffix } = splitUrl(url);
  if (!path) return null;

  // The validator's lightweight Markdown matcher can encounter bracketed
  // math expressions that resemble links. Note slugs in this site are
  // hyphenated, so an underscore-only bare token is not a note URL.
  if (!path.includes("/") && path.includes("_")) return null;

  const notePath = publicPathFromSource(sourcePath, docsRoot);
  if (!notePath) return null;

  // A path beginning with sN is conventionally a site-root note URL in the
  // notes corpus, even when it was written without a leading slash.
  const sourceDir = notePath.slice(0, notePath.lastIndexOf("/"));
  const target = /^s\d+(?:\/|$)/i.test(path) ? path : `${sourceDir}/${path}`;

  const segments: string[] = [];
  for (const segment of target.split(/[\\/]/)) {
    if (!segment || segment === ".") continue;
    if (segment === "..") {
      segments.pop();
    } else {
      segments.push(segment.replace(NUMERIC_PREFIX, ""));
    }
  }

  return `/${segments.join("/")}${suffix}`;
}

/** Resolve note-internal Markdown links against the note's public URL. */
export function remarkNoteLinks() {
  return (tree: unknown, file: { path?: string }) => {
    if (!file.path) return;

    visit(tree, "link", (node: { url?: string }) => {
      if (node.url) {
        const normalized = normalizeNoteLink(node.url, file.path!);
        if (normalized) node.url = normalized;
      }
    });
  };
}
