import { test, expect } from "bun:test";
import { maskFile, MASK_CHAR } from "./mask.ts";

test("masking preserves total length and line count", () => {
  const raw = "a $x$ b\n```\ncode $y$\n```\nprose";
  const { lines, maskedLines } = maskFile(raw);
  expect(maskedLines.length).toBe(lines.length);
  for (let i = 0; i < lines.length; i++) {
    expect(maskedLines[i].length).toBe(lines[i].length);
  }
});

test("fenced code block is masked and marked as code", () => {
  const raw = [
    "prose",
    "```",
    "let x = 1; // — not a real em dash rule hit",
    "```",
    "more",
  ].join("\n");
  const { maskedLines, lineIsCode } = maskFile(raw);
  expect(lineIsCode).toEqual([false, true, true, true, false]);
  expect(maskedLines[2]).toBe(
    MASK_CHAR.repeat("let x = 1; // — not a real em dash rule hit".length),
  );
});

test("~~~ fences are tracked the same as ``` fences", () => {
  const raw = ["~~~", "code line", "~~~"].join("\n");
  const { lineIsCode } = maskFile(raw);
  expect(lineIsCode).toEqual([true, true, true]);
});

test("a fence nested inside prose that later resumes (e.g. inside a Note) is still masked", () => {
  const raw = ["<Note>", "```", "x = 1", "```", "</Note>"].join("\n");
  const { lineIsCode } = maskFile(raw);
  expect(lineIsCode).toEqual([false, true, true, true, false]);
});

test("inline code span is masked, math outside it is not", () => {
  const raw = "the value `$x$` equals $y$ here";
  const { maskedLines } = maskFile(raw);
  const masked = maskedLines[0];
  expect(masked.includes("`$x$`")).toBe(false);
  expect(masked.includes("$y$")).toBe(false);
  expect(masked.startsWith("the value ")).toBe(true);
});

test("multi-line display math block is masked entirely", () => {
  const raw = ["Here:", "$$", "PA = LU", "$$", "done"].join("\n");
  const { maskedLines, lineIsCode } = maskFile(raw);
  expect(lineIsCode).toEqual([false, false, false, false, false]);
  expect(maskedLines[1]).toBe(MASK_CHAR.repeat(2));
  expect(maskedLines[2]).toBe(MASK_CHAR.repeat("PA = LU".length));
  expect(maskedLines[3]).toBe(MASK_CHAR.repeat(2));
  expect(maskedLines[4]).toBe("done");
});

test("a stray unmatched $ does not swallow the rest of the line", () => {
  const raw = "price is $5 and nothing closes it";
  const { maskedLines } = maskFile(raw);
  expect(maskedLines[0]).toBe(raw);
});
