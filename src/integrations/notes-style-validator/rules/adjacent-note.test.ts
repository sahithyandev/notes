import { test, expect } from "bun:test";
import { checkAdjacentNote } from "./adjacent-note.ts";
import { scanOne } from "../test-helpers.ts";

test("flags two same-type Notes separated only by a blank line", () => {
  const f = scanOne(
    [
      '<Note title="Proof Hint">',
      "hint text",
      "</Note>",
      "",
      '<Note title="Example">',
      "example text",
      "</Note>",
    ].join("\n"),
  );
  expect(checkAdjacentNote(f)).toHaveLength(1);
});

test("does not flag Notes of different resolved type", () => {
  const f = scanOne(
    [
      '<Note type="tip">',
      "a",
      "</Note>",
      "",
      '<Note type="danger">',
      "b",
      "</Note>",
    ].join("\n"),
  );
  expect(checkAdjacentNote(f)).toHaveLength(0);
});

test("does not flag Notes separated by real content", () => {
  const f = scanOne(
    [
      "<Note>",
      "a",
      "</Note>",
      "",
      "some prose in between",
      "",
      "<Note>",
      "b",
      "</Note>",
    ].join("\n"),
  );
  expect(checkAdjacentNote(f)).toHaveLength(0);
});

test("handles a single-quoted title containing a double quote", () => {
  const f = scanOne(
    [
      '<Note title=\'Euler "Path"?\' type="caution">',
      "a",
      "</Note>",
      "",
      '<Note type="caution">',
      "b",
      "</Note>",
    ].join("\n"),
  );
  expect(checkAdjacentNote(f)).toHaveLength(1);
});

test("a code fence inside a Note is not mistaken for the Note's close tag", () => {
  const f = scanOne(
    [
      "<Note>",
      "```",
      "example showing </Note> as literal text",
      "```",
      "real content",
      "</Note>",
      "",
      "<Note>",
      "b",
      "</Note>",
    ].join("\n"),
  );
  // The fenced lines are masked as code and skipped, so the literal
  // "</Note>" inside them must not be mistaken for the real close tag —
  // the real close comes later, and these two Notes ARE adjacent.
  expect(checkAdjacentNote(f)).toHaveLength(1);
});
