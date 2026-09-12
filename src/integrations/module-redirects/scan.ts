import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const FILE_PREFIX = /^(\d+)-(.+)\.mdx?$/;
const DIR_PREFIX = /^(\d+)-(.+)$/;
const EXCLUDED = new Set(["images", "summary"]);

function isDir(p: string): boolean {
  return statSync(p).isDirectory();
}

function subdirs(dir: string): string[] {
  return readdirSync(dir).filter(
    (name) => !EXCLUDED.has(name) && isDir(join(dir, name)),
  );
}

function stripDirPrefix(name: string): string {
  const m = DIR_PREFIX.exec(name);
  return m ? m[2] : name;
}

interface FirstNote {
  order: number;
  slug: string;
}

// Recursively finds the slug of the lowest-order note under `dir`.
function firstNote(dir: string): FirstNote | null {
  let best: FirstNote | null = null;

  for (const name of readdirSync(dir)) {
    if (EXCLUDED.has(name)) continue;
    const full = join(dir, name);

    let candidate: FirstNote | undefined;
    if (isDir(full)) {
      const sub = firstNote(full);
      if (sub)
        candidate = {
          order: sub.order,
          slug: `${stripDirPrefix(name)}/${sub.slug}`,
        };
    } else {
      const m = FILE_PREFIX.exec(name);
      if (m) candidate = { order: Number(m[1]), slug: m[2] };
    }

    if (candidate && (!best || candidate.order < best.order)) best = candidate;
  }

  return best;
}

export function scanModuleRedirects(docsRoot: string): Record<string, string> {
  const redirects: Record<string, string> = {};

  for (const sem of subdirs(docsRoot)) {
    const semDir = join(docsRoot, sem);

    for (const mod of subdirs(semDir).sort()) {
      const modDir = join(semDir, mod);

      const modFirst = firstNote(modDir);
      if (modFirst) {
        redirects[`/${sem}/${mod}`] = `/${sem}/${mod}/${modFirst.slug}`;
      }

      for (const sub of subdirs(modDir)) {
        const subSlug = stripDirPrefix(sub);
        const subFirst = firstNote(join(modDir, sub));
        if (subFirst) {
          redirects[`/${sem}/${mod}/${subSlug}`] =
            `/${sem}/${mod}/${subSlug}/${subFirst.slug}`;
        }
      }
    }
  }

  return redirects;
}
