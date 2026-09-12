import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { scanFiles, type ScannedFile } from "./scan.ts";

/** Scans a single in-memory note body via a throwaway temp file. Test-only. */
export function scanOne(content: string): ScannedFile {
  const dir = mkdtempSync(join(tmpdir(), "nsv-"));
  writeFileSync(join(dir, "01-x.mdx"), content);
  const [f] = scanFiles(dir);
  rmSync(dir, { recursive: true, force: true });
  return f;
}

/**
 * Scans several in-memory notes at once via throwaway temp files, for rules
 * that need cross-file context (e.g. broken-link). Keys are relative paths
 * under the temp docs root (may include subdirectories); values are file
 * content.
 *
 * Takes a callback rather than just returning the scanned files: broken-link
 * checks (image existence) do a *live* filesystem stat against each file's
 * own directory, so the temp dir must still exist at check time, not just at
 * scan time. Cleans up even if `fn` throws.
 */
export function withScannedFiles<T>(
  files: Record<string, string>,
  fn: (scanned: ScannedFile[]) => T,
): T {
  const dir = mkdtempSync(join(tmpdir(), "nsv-"));
  try {
    for (const [relPath, content] of Object.entries(files)) {
      const full = join(dir, relPath);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, content);
    }
    return fn(scanFiles(dir));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
