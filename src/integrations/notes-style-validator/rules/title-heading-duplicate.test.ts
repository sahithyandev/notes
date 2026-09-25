import { test, expect } from "bun:test";
import { checkTitleHeadingDuplicate } from "./title-heading-duplicate.ts";
import { scanOne } from "../test-helpers.ts";

test("flags a heading that repeats the title verbatim", () => {
  const f = scanOne(
    [
      "---",
      "title: Demand",
      "slug: s1/demand",
      "---",
      "",
      "## Demand",
      "",
      "body",
    ].join("\n"),
  );
  const violations = checkTitleHeadingDuplicate(f);
  expect(violations).toHaveLength(1);
  expect(violations[0].line).toBe(6);
});

test("flags case-insensitively and ignores markdown formatting", () => {
  const f = scanOne(
    [
      "---",
      "title: Demand",
      "slug: s1/demand",
      "---",
      "",
      "## **demand**",
      "",
      "body",
    ].join("\n"),
  );
  expect(checkTitleHeadingDuplicate(f)).toHaveLength(1);
});

test("does not flag a heading that differs from the title", () => {
  const f = scanOne(
    [
      "---",
      "title: Demand",
      "slug: s1/demand",
      "---",
      "",
      "## Law of Demand",
      "",
      "body",
    ].join("\n"),
  );
  expect(checkTitleHeadingDuplicate(f)).toHaveLength(0);
});
