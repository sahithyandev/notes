import { test, expect } from "bun:test";
import { checkWhatIsHeading } from "./what-is-heading.ts";
import { scanOne } from "../test-helpers.ts";

const note = (heading: string) =>
  ["---", "title: Demand", "---", "", heading, "", "body"].join("\n");

test("flags 'What Is X?' headings", () => {
  const violations = checkWhatIsHeading(scanOne(note("## What Is a Market?")));
  expect(violations).toHaveLength(1);
  expect(violations[0].line).toBe(5);
  expect(violations[0].text).toContain('"Market"');
});

test("flags 'What Are X?' at any heading level", () => {
  expect(
    checkWhatIsHeading(scanOne(note("#### What are Quarks"))),
  ).toHaveLength(1);
});

test("does not flag other headings", () => {
  expect(checkWhatIsHeading(scanOne(note("## Market")))).toHaveLength(0);
  expect(checkWhatIsHeading(scanOne(note("## Whatever Is Left")))).toHaveLength(
    0,
  );
});
