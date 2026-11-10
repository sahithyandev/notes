import { describe, beforeAll, afterAll, test, expect } from "bun:test";
import { TemporaryNotesDirectory } from "./temporary-notes-directory";
import { existsSync, statSync } from "node:fs";

describe("TemporaryNotesDirectory", () => {
  let notes: TemporaryNotesDirectory;

  beforeAll(() => {
    notes = new TemporaryNotesDirectory();
  });

  afterAll(() => {
    notes.remove();
  });

  test("creates a temporary directory", () => {
    expect(notes.root).not.toBeEmpty();
    expect(existsSync(notes.root)).toBeTrue();
  });
});
