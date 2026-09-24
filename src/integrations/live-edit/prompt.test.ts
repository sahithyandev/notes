import { test, expect } from "bun:test";
import {
  buildRequestMessage,
  buildRefineMessage,
  buildMismatchMessage,
} from "./prompt.ts";

test("buildRequestMessage includes all provided selection fields", () => {
  const msg = buildRequestMessage({
    kind: "selection",
    filePath: "docs/s1/foo.md",
    selection: "the fox jumps",
    heading: "Introduction",
    context: "before ... the fox jumps ... after",
    comment: "make this shorter",
  });
  expect(msg).toContain("docs/s1/foo.md");
  expect(msg).toContain("Introduction");
  expect(msg).toContain("the fox jumps");
  expect(msg).toContain("before ... the fox jumps ... after");
  expect(msg).toContain("make this shorter");
});

test("buildRequestMessage omits missing optional selection fields", () => {
  const msg = buildRequestMessage({
    kind: "selection",
    filePath: "docs/s1/foo.md",
    selection: "text",
    comment: "fix it",
  });
  expect(msg).not.toContain("Nearest heading");
  expect(msg).not.toContain("Surrounding context");
});

test("buildRequestMessage lists a single whole-note file plainly", () => {
  const msg = buildRequestMessage({
    kind: "whole-note",
    files: ["docs/s1/foo.md"],
    comment: "tighten the intro",
  });
  expect(msg).toContain("docs/s1/foo.md");
  expect(msg).toContain("tighten the intro");
  expect(msg).not.toContain("merging");
});

test("buildRequestMessage flags a multi-file whole-note request", () => {
  const msg = buildRequestMessage({
    kind: "whole-note",
    files: ["docs/a.md", "docs/b.md"],
    comment: "merge a into b",
  });
  expect(msg).toContain("docs/a.md");
  expect(msg).toContain("docs/b.md");
  expect(msg).toContain("merging");
});

test("buildRefineMessage wraps the comment", () => {
  expect(buildRefineMessage("also fix the typo")).toContain(
    "also fix the typo",
  );
});

test("buildMismatchMessage lists every mismatch grouped by file", () => {
  const msg = buildMismatchMessage([
    { file: "docs/a.md", mismatches: [{ old: "a", occurrences: 0 }] },
    { file: "docs/b.md", mismatches: [{ old: "b", occurrences: 2 }] },
  ]);
  expect(msg).toContain("docs/a.md");
  expect(msg).toContain('"a" was found 0 time(s)');
  expect(msg).toContain("docs/b.md");
  expect(msg).toContain('"b" was found 2 time(s)');
});

test("buildMismatchMessage also lists deletion mismatches", () => {
  const msg = buildMismatchMessage(
    [],
    [{ file: "docs/c.md", reason: "file no longer exists" }],
  );
  expect(msg).toContain("docs/c.md");
  expect(msg).toContain("file no longer exists");
});
