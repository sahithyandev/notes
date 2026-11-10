import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { ModuleRedirectsScanner } from "./scan.ts";
import { getModuleRedirectsScanner } from "./scanner-cache.ts";
import { TemporaryNotesDirectory } from "./temporary-notes-directory.ts";

describe("module-redirects", () => {
  test("scans module and submodule redirects to the first note", () => {
    const notes = new TemporaryNotesDirectory();
    try {
      notes.addNote("s1/algebra/5-later.mdx");
      notes.addNote("s1/algebra/1-basics/3-limits.md");
      notes.addNote("s1/algebra/1-basics/1-introduction.md");
      notes.addNote("s1/algebra/4-geometry/1-points.md");

      expect(new ModuleRedirectsScanner(notes.root).current).toEqual({
        "/s1/algebra": "/s1/algebra/basics/introduction",
        "/s1/algebra/basics": "/s1/algebra/basics/introduction",
        "/s1/algebra/geometry": "/s1/algebra/geometry/points",
      });
    } finally {
      notes.remove();
    }
  });

  test("redirects a module link to the first submodule", () => {
    const notes = new TemporaryNotesDirectory();
    try {
      notes.addNote("s1/algebra/2-geometry/1-points.md");
      notes.addNote("s1/algebra/1-basics/9-last.md");

      expect(new ModuleRedirectsScanner(notes.root).current).toEqual({
        "/s1/algebra": "/s1/algebra/basics/last",
        "/s1/algebra/geometry": "/s1/algebra/geometry/points",
        "/s1/algebra/basics": "/s1/algebra/basics/last",
      });
    } finally {
      notes.remove();
    }
  });

  test("ignores excluded directories", () => {
    const notes = new TemporaryNotesDirectory();
    try {
      notes.addNote("s1/algebra/1-basics/1-introduction.md");
      notes.addNote("s1/algebra/images/1-image.md");
      notes.addNote("s1/algebra/summary/1-summary.md");

      expect(new ModuleRedirectsScanner(notes.root).current).toEqual({
        "/s1/algebra": "/s1/algebra/basics/introduction",
        "/s1/algebra/basics": "/s1/algebra/basics/introduction",
      });
    } finally {
      notes.remove();
    }
  });

  test("does not create redirects for semester routes", () => {
    const notes = new TemporaryNotesDirectory();
    try {
      notes.addNote("s1/algebra/1-introduction.md");

      expect(new ModuleRedirectsScanner(notes.root).current).toEqual({
        "/s1/algebra": "/s1/algebra/introduction",
      });
    } finally {
      notes.remove();
    }
  });

  test("notifies listeners only when redirects change", () => {
    const notes = new TemporaryNotesDirectory();
    try {
      const second = notes.addNote("s1/algebra/2-second.md");
      const scanner = new ModuleRedirectsScanner(notes.root);
      const changes: Record<string, string>[] = [];
      const unsubscribe = scanner.onChange((redirects) =>
        changes.push(redirects),
      );

      scanner.handleChange(second);
      scanner.handleChange(join(notes.root, "outside/ignored.md"));
      const first = notes.addNote("s1/algebra/0-first.md");
      scanner.handleChange(first);

      expect(changes).toHaveLength(1);
      expect(changes[0]["/s1/algebra"]).toBe("/s1/algebra/first");

      unsubscribe();
      const earliest = notes.addNote("s1/algebra/new-submodule/1-note.md");
      scanner.handleChange(earliest);
      expect(changes).toHaveLength(1);
    } finally {
      notes.remove();
    }
  });

  test("reuses and refreshes the shared scanner", () => {
    const notes = new TemporaryNotesDirectory();
    try {
      notes.addNote("s1/algebra/2-second.md");
      const first = getModuleRedirectsScanner(notes.root);
      const same = getModuleRedirectsScanner(notes.root);

      expect(same).toBe(first);

      const earliest = notes.addNote("s1/algebra/0-first.md");
      first.handleChange(earliest);

      expect(same.current["/s1/algebra"]).toBe("/s1/algebra/first");
    } finally {
      notes.remove();
    }
  });
});
