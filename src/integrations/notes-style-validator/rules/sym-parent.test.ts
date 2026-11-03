import { expect, test } from "bun:test";
import { checkSymParent } from "./sym-parent.ts";
import { scanOne } from "../test-helpers.ts";

test("allows Sym entries inside Symbols", () => {
  const f = scanOne(
    [
      "<Symbols>",
      '  <Sym s="x">an unknown</Sym>',
      "</Symbols>",
      '<Symbols><Sym s="y">another unknown</Sym></Symbols>',
    ].join("\n"),
  );

  expect(checkSymParent(f)).toHaveLength(0);
});

test("flags Sym entries outside Symbols", () => {
  const f = scanOne(
    ['<Sym s="x">an unknown</Sym>', "", "<Symbols />", '<Sym s="y" />'].join(
      "\n",
    ),
  );

  const violations = checkSymParent(f);
  expect(violations).toHaveLength(2);
  expect(violations.map((v) => v.line)).toEqual([1, 4]);
});

test("ignores Sym tags in fenced code", () => {
  const f = scanOne(
    ["```mdx", '<Sym s="x">an unknown</Sym>', "```"].join("\n"),
  );

  expect(checkSymParent(f)).toHaveLength(0);
});
