import { test, expect } from "bun:test";
import { checkLabelDescription } from "./label-description.ts";
import { scanOne } from "../test-helpers.ts";

test("flags a plain label:description bullet", () => {
  const f = scanOne("- DES: 16 rounds, Feistel structure, 48-bit round keys.");
  expect(checkLabelDescription(f)).toHaveLength(1);
});

test("exempts a math-glossary bullet", () => {
  const f = scanOne(
    "- $L$: unit lower triangular, $n \\times n$ with all diagonal entries $1$",
  );
  expect(checkLabelDescription(f)).toHaveLength(0);
});

test("exempts a bullet whose label is partly math", () => {
  const f = scanOne("- $(1)$ is $\\le$: add slack $s_1$.");
  expect(checkLabelDescription(f)).toHaveLength(0);
});

test("exempts an inline-code label", () => {
  const f = scanOne("- `IN`: $I(2,3)$ and $N(0,2)$ form a rectangle.");
  expect(checkLabelDescription(f)).toHaveLength(0);
});

test("flags a markdown link label with a URL, not exempting it", () => {
  const f = scanOne("- [text](https://example.com): Description of the link.");
  expect(checkLabelDescription(f)).toHaveLength(1);
});

test("does not flag a long prose bullet with a mid-sentence colon", () => {
  const f = scanOne(
    "- After the first pass completes and every worker has reported: the coordinator merges results.",
  );
  expect(checkLabelDescription(f)).toHaveLength(0);
});

test("does not flag a bullet with no colon", () => {
  const f = scanOne(
    "- Continuous intensity\n  No fixed set of allowed values.",
  );
  expect(checkLabelDescription(f)).toHaveLength(0);
});
