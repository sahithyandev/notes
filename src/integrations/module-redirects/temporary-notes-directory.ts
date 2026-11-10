import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

export class TemporaryNotesDirectory {
  readonly root: string;

  constructor() {
    this.root = mkdtempSync(join(tmpdir(), "module-redirects-"));
  }

  addNote(path: string): string {
    const file = join(this.root, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, "---\ntitle: Test\n---\n");
    return file;
  }

  remove(): void {
    rmSync(this.root, { recursive: true });
  }
}
