import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scanFiles, type ScannedFile } from "./scan.ts";

/** Scans a single in-memory note body via a throwaway temp file. Test-only. */
export function scanOne(content: string): ScannedFile {
  const dir = mkdtempSync(join(tmpdir(), "nsv-"));
  writeFileSync(join(dir, "01-x.mdx"), content);
  const [f] = scanFiles(dir);
  rmSync(dir, { recursive: true, force: true });
  return f;
}
