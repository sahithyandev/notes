import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

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

function compareDirs(a: string, b: string): number {
  const aMatch = DIR_PREFIX.exec(a);
  const bMatch = DIR_PREFIX.exec(b);
  if (aMatch && bMatch) {
    const order = Number(aMatch[1]) - Number(bMatch[1]);
    if (order !== 0) return order;
  } else if (aMatch) {
    return -1;
  } else if (bMatch) {
    return 1;
  }
  return a.localeCompare(b);
}

function stripDirPrefix(name: string): string {
  const m = DIR_PREFIX.exec(name);
  return m ? m[2] : name;
}

interface FirstNote {
  order: number;
  slug: string;
}

export type ModuleRedirects = Record<string, string>;
export type ModuleRedirectChangeListener = (redirects: ModuleRedirects) => void;

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

function firstModuleNote(dir: string): FirstNote | null {
  for (const sub of subdirs(dir).sort(compareDirs)) {
    const first = firstNote(join(dir, sub));
    if (first) {
      return {
        order: first.order,
        slug: `${stripDirPrefix(sub)}/${first.slug}`,
      };
    }
  }

  return firstNote(dir);
}

function serialize(redirects: ModuleRedirects): string {
  return JSON.stringify(
    Object.entries(redirects).sort(([a], [b]) => a.localeCompare(b)),
  );
}

/** Scans module directories and reports when their redirect map changes. */
export class ModuleRedirectsScanner {
  readonly docsRoot: string;
  private redirects: ModuleRedirects = {};
  private snapshot = "";
  private readonly listeners = new Set<ModuleRedirectChangeListener>();

  constructor(docsRoot: string = join(process.cwd(), "docs")) {
    this.docsRoot = docsRoot;
    this.scan();
  }

  scan(): ModuleRedirects {
    const redirects: ModuleRedirects = {};

    for (const sem of subdirs(this.docsRoot)) {
      const semDir = join(this.docsRoot, sem);

      for (const mod of subdirs(semDir).sort()) {
        const modDir = join(semDir, mod);

        const modFirst = firstModuleNote(modDir);
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

    this.redirects = redirects;
    this.snapshot = serialize(redirects);
    return redirects;
  }

  get current(): ModuleRedirects {
    return this.redirects;
  }

  onChange(listener: ModuleRedirectChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  isInDocs(path: string): boolean {
    return !relative(this.docsRoot, path).startsWith("..");
  }

  handleChange(path: string): void {
    if (!this.isInDocs(path)) return;

    const previous = this.snapshot;
    const next = this.scan();
    if (serialize(next) === previous) return;

    for (const listener of this.listeners) listener(next);
  }
}
