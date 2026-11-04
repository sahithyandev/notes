import { test, expect } from "bun:test";
import { checkMathBlock, findMathBlockPeriodEdits } from "./math-block.ts";
import { scanOne } from "../test-helpers.ts";

test("accepts a Proof right after its Theorem", () => {
  const f = scanOne(
    [
      "<Theorem>",
      "statement",
      "</Theorem>",
      "",
      "<Proof>",
      "x",
      "</Proof>",
    ].join("\n"),
  );
  expect(checkMathBlock(f)).toHaveLength(0);
});

test("accepts a Note between a Theorem and its Proof", () => {
  const f = scanOne(
    [
      "<Theorem>",
      "statement",
      "</Theorem>",
      "",
      "<Note>",
      "remark",
      "</Note>",
      "",
      "<Proof>",
      "x",
      "</Proof>",
    ].join("\n"),
  );
  expect(checkMathBlock(f)).toHaveLength(0);
});

test("flags a Proof that follows prose", () => {
  const f = scanOne(
    [
      "<Theorem>",
      "s",
      "</Theorem>",
      "",
      "some prose",
      "",
      "<Proof>",
      "x",
      "</Proof>",
    ].join("\n"),
  );
  expect(checkMathBlock(f)).toHaveLength(1);
});

test("flags a Proof that follows a Definition", () => {
  const f = scanOne(
    ["<Definition>", "d", "</Definition>", "", "<Proof>", "x", "</Proof>"].join(
      "\n",
    ),
  );
  expect(checkMathBlock(f)).toHaveLength(1);
});

test("flags two adjacent Formulas", () => {
  const f = scanOne(
    [
      "<Formula>",
      "$$a$$",
      "</Formula>",
      "",
      "<Formula>",
      "$$b$$",
      "</Formula>",
    ].join("\n"),
  );
  expect(checkMathBlock(f)).toHaveLength(1);
});

test("does not flag Formulas separated by prose", () => {
  const f = scanOne(
    [
      "<Formula>",
      "$$a$$",
      "</Formula>",
      "",
      "and then",
      "",
      "<Formula>",
      "$$b$$",
      "</Formula>",
    ].join("\n"),
  );
  expect(checkMathBlock(f)).toHaveLength(0);
});

test("flags an invalid level", () => {
  const f = scanOne(['<Theorem level="4">', "s", "</Theorem>"].join("\n"));
  expect(checkMathBlock(f)).toHaveLength(1);
});

test("accepts level 3", () => {
  const f = scanOne(
    ['<Definition level="3">', "d", "</Definition>"].join("\n"),
  );
  expect(checkMathBlock(f)).toHaveLength(0);
});

test("accepts a Proof Hint without a preceding Theorem", () => {
  const f = scanOne(
    ["A plain claim.", "", '<Proof label="Proof Hint">', "x", "</Proof>"].join(
      "\n",
    ),
  );
  expect(checkMathBlock(f)).toHaveLength(0);
});

test("flags a display math block that ends with a period", () => {
  const f = scanOne(["$$", "x = y.", "$$"].join("\n"));
  expect(checkMathBlock(f)).toEqual([
    expect.objectContaining({
      line: 2,
      text: "math blocks must not end with a period",
      snippet: "period-terminated-math",
    }),
  ]);
});

test("flags a single-line display math block that ends with a period", () => {
  const f = scanOne("$$x = y.$$ ");
  expect(checkMathBlock(f)).toHaveLength(1);
});

test("accepts display math without a terminal period", () => {
  const f = scanOne(["$$", "x = y", "$$"].join("\n"));
  expect(checkMathBlock(f)).toHaveLength(0);
});

test("does not inspect display-math-looking text inside inline code", () => {
  const f = scanOne("Use `$$x = y.$$` as a literal example.");
  expect(checkMathBlock(f)).toHaveLength(0);
});

test("returns exact edits for terminal periods", () => {
  const f = scanOne(["$$", "x = y.  ", "$$"].join("\n"));
  expect(findMathBlockPeriodEdits(f)).toEqual([{ line: 2, start: 5, end: 6 }]);
});
