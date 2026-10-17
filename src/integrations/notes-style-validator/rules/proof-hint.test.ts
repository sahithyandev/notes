import { test, expect } from "bun:test";
import { checkProofHint } from "./proof-hint.ts";
import { scanOne } from "../test-helpers.ts";

test("flags a Note titled Proof Hint, case-insensitively", () => {
  const f = scanOne(
    [
      '<Note title="Proof Hint">',
      "x",
      "</Note>",
      "",
      '<Note title="Proof hint">',
      "y",
      "</Note>",
    ].join("\n"),
  );
  const v = checkProofHint(f);
  expect(v).toHaveLength(2);
  expect(v[0].line).toBe(1);
});

test("ignores Proof components and other Notes", () => {
  const f = scanOne(
    [
      '<Proof label="Proof Hint">',
      "x",
      "</Proof>",
      "",
      '<Note title="Remark">',
      "y",
      "</Note>",
    ].join("\n"),
  );
  expect(checkProofHint(f)).toHaveLength(0);
});

test("ignores fenced code", () => {
  const f = scanOne(["```", '<Note title="Proof Hint">', "```"].join("\n"));
  expect(checkProofHint(f)).toHaveLength(0);
});
