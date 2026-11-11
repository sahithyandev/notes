import { readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";

const IMAGE_EXTENSIONS = new Set([
  ".avif",
  ".bmp",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".webp",
]);

function imageFilesUnder(dir: string, result: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) imageFilesUnder(file, result);
    else if (
      IMAGE_EXTENSIONS.has(file.slice(file.lastIndexOf(".")).toLowerCase())
    ) {
      result.push(file);
    }
  }
  return result;
}

function docsImageFiles(docsRoot: string): string[] {
  const result: string[] = [];

  function walk(dir: string): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const child = join(dir, entry.name);
      if (entry.name === "images") imageFilesUnder(child, result);
      else walk(child);
    }
  }

  walk(docsRoot);
  return result;
}

function referencedImages(files: ScannedFile[]): Set<string> {
  const referenced = new Set<string>();
  const importRe = /(?:from\s+|import\s*)["']([^"']+)["']/g;

  for (const file of files) {
    for (const link of file.links) {
      if (link.kind === "image") {
        referenced.add(resolve(dirname(file.file), link.target));
      }
    }

    for (const [index, line] of file.lines.entries()) {
      if (file.lineIsCode[index]) continue;
      for (const match of line.matchAll(importRe)) {
        if (match[1].startsWith(".")) {
          referenced.add(resolve(dirname(file.file), match[1]));
        }
      }
    }
  }

  return referenced;
}

export function findUnusedImages(
  files: ScannedFile[],
  docsRoot: string,
): string[] {
  const referenced = referencedImages(files);
  return docsImageFiles(docsRoot).filter(
    (file) => !referenced.has(resolve(file)),
  );
}

export function checkUnusedImages(
  files: ScannedFile[],
  docsRoot: string,
): Array<{ file: string; violation: Violation }> {
  return findUnusedImages(files, docsRoot).map((file) => {
    const path = `docs/${relative(docsRoot, file)}`;
    return {
      file,
      violation: {
        rule: "unused-image",
        line: 1,
        text: `image ${path} is not linked from any note`,
        snippet: path,
      },
    };
  });
}
