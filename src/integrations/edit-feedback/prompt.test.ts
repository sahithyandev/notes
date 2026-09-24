import { test, expect } from "bun:test";
import {
  buildRequestMessage,
  buildRefineMessage,
  buildMismatchMessage,
} from "./prompt.ts";

test("buildRequestMessage includes all provided fields", () => {
  const msg = buildRequestMessage({
    filePath: "docs/s1/foo.md",
    slug: "s1/foo",
    selection: "the fox jumps",
    heading: "Introduction",
    context: "before ... the fox jumps ... after",
    comment: "make this shorter",
  });
  expect(msg).toContain("docs/s1/foo.md");
  expect(msg).toContain("s1/foo");
  expect(msg).toContain("Introduction");
  expect(msg).toContain("the fox jumps");
  expect(msg).toContain("before ... the fox jumps ... after");
  expect(msg).toContain("make this shorter");
});

test("buildRequestMessage omits missing optional fields", () => {
  const msg = buildRequestMessage({
    filePath: "docs/s1/foo.md",
    slug: "s1/foo",
    selection: "text",
    comment: "fix it",
  });
  expect(msg).not.toContain("Nearest heading");
  expect(msg).not.toContain("Surrounding context");
});

test("buildRefineMessage wraps the comment", () => {
  expect(buildRefineMessage("also fix the typo")).toContain(
    "also fix the typo",
  );
});

test("buildMismatchMessage lists every mismatch", () => {
  const msg = buildMismatchMessage([
    { old: "a", occurrences: 0 },
    { old: "b", occurrences: 2 },
  ]);
  expect(msg).toContain('"a" was found 0 time(s)');
  expect(msg).toContain('"b" was found 2 time(s)');
});
