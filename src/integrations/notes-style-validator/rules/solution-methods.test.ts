import { expect, test } from "bun:test";
import { checkSolutionMethods } from "./solution-methods.ts";
import { scanOne } from "../test-helpers.ts";

test("allows a Solution with no Method children", () => {
  expect(checkSolutionMethods(scanOne("<Solution>answer</Solution>"))).toEqual(
    [],
  );
});

test("allows a Solution with multiple Method children", () => {
  const f = scanOne(
    [
      "<Solution>",
      '<Method label="First">one</Method>',
      '<Method label="Second">two</Method>',
      "</Solution>",
    ].join("\n"),
  );
  expect(checkSolutionMethods(f)).toEqual([]);
});

test("flags a Solution with exactly one Method child", () => {
  const f = scanOne(
    ["<Solution>", '<Method label="Only">answer</Method>', "</Solution>"].join(
      "\n",
    ),
  );
  expect(checkSolutionMethods(f)).toMatchObject([
    {
      line: 1,
      rule: "solution-methods",
      snippet: "solution-with-one-method",
    },
  ]);
});

test("flags a Solution with one self-closing Method child", () => {
  const f = scanOne(["<Solution>", "<Method />", "</Solution>"].join("\n"));
  expect(checkSolutionMethods(f)).toHaveLength(1);
});

test("ignores Solution and Method tags in fenced code", () => {
  const f = scanOne(
    ["```mdx", "<Solution>", "<Method>", "</Solution>", "```"].join("\n"),
  );
  expect(checkSolutionMethods(f)).toEqual([]);
});
