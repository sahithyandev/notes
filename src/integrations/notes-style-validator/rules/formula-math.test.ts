import { expect, test } from "bun:test";
import { checkFormula } from "./formula-math.ts";
import { scanOne } from "../test-helpers.ts";

test("allows a Formula with exactly 1 display-math block", () => {
  const f = scanOne(["<Formula>", "$$x^2$$", "</Formula>"].join("\n"));
  expect(checkFormula(f)).toHaveLength(0);
});

test("flags a Formula inside a Solution", () => {
  const f = scanOne(
    ["<Solution>", "<Formula>", "$$x^2$$", "</Formula>", "</Solution>"].join(
      "\n",
    ),
  );
  const violations = checkFormula(f);
  expect(violations).toHaveLength(1);
  expect(violations[0]).toMatchObject({
    line: 2,
    snippet: "formula-inside-solution",
  });
});

test("flags a Formula without display math", () => {
  const f = scanOne(["<Formula>", "symbols", "</Formula>"].join("\n"));
  const violations = checkFormula(f);
  expect(violations).toHaveLength(1);
  expect(violations[0]).toMatchObject({
    line: 1,
    snippet: "formula-without-display-math",
  });
});

test("flags a Formula with multiple display-math blocks", () => {
  const f = scanOne(["<Formula>", "$$x$$", "$$y$$", "</Formula>"].join("\n"));
  const violations = checkFormula(f);
  expect(violations).toHaveLength(1);
  expect(violations[0]).toMatchObject({
    line: 1,
    snippet: "formula-with-multiple-display-math",
  });
});

test("ignores display math in fenced code", () => {
  const f = scanOne(
    ["```mdx", "<Formula>", "$$x$$", "</Formula>", "```"].join("\n"),
  );
  expect(checkFormula(f)).toHaveLength(0);
});
