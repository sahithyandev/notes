import { test, expect } from "bun:test";
import { checkDuplicateHeading } from "./duplicate-heading.ts";
import { scanOne } from "../test-helpers.ts";

test("flags a heading repeated at the same level", () => {
  const f = scanOne(
    [
      "---",
      "title: Demand",
      "---",
      "",
      "## Elasticity",
      "",
      "body",
      "",
      "## Elasticity",
      "",
      "more body",
    ].join("\n"),
  );
  const violations = checkDuplicateHeading(f);
  expect(violations).toHaveLength(1);
  expect(violations[0].line).toBe(9);
  expect(violations[0].text).toContain("line 5");
});

test("flags case-insensitively and ignores markdown formatting", () => {
  const f = scanOne(
    [
      "---",
      "title: Demand",
      "---",
      "",
      "## **Elasticity**",
      "",
      "body",
      "",
      "## elasticity",
      "",
      "more body",
    ].join("\n"),
  );
  expect(checkDuplicateHeading(f)).toHaveLength(1);
});

test("flags the same text repeated at a different heading level", () => {
  const f = scanOne(
    [
      "---",
      "title: Demand",
      "---",
      "",
      "## Elasticity",
      "",
      "### Elasticity",
      "",
      "body",
    ].join("\n"),
  );
  expect(checkDuplicateHeading(f)).toHaveLength(1);
});

test("does not flag distinct headings", () => {
  const f = scanOne(
    [
      "---",
      "title: Demand",
      "---",
      "",
      "## Elasticity",
      "",
      "## Supply",
      "",
      "body",
    ].join("\n"),
  );
  expect(checkDuplicateHeading(f)).toHaveLength(0);
});
