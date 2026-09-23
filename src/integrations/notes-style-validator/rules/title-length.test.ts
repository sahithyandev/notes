import { test, expect } from "bun:test";
import { checkTitleLength } from "./title-length.ts";
import { scanOne } from "../test-helpers.ts";

function note(title: string, body = "Body text."): string {
  return `---\ntitle: ${title}\nslug: s1/mathematics/foo\n---\n\n${body}\n`;
}

test("flags a title over 40 characters", () => {
  const f = scanOne(note("Finite-Difference Method for Linear BVP Systems"));
  const violations = checkTitleLength(f);
  expect(violations).toHaveLength(1);
  expect(violations[0].snippet).toBe(
    "Finite-Difference Method for Linear BVP Systems",
  );
});

test("does not flag a title at exactly 40 characters", () => {
  const f = scanOne(note("A".repeat(40)));
  expect(checkTitleLength(f)).toHaveLength(0);
});

test("does not flag a short title", () => {
  const f = scanOne(note("Linear Finite-Difference Method"));
  expect(checkTitleLength(f)).toHaveLength(0);
});

test("does not flag a long 'Introduction to' title", () => {
  const f = scanOne(
    note("Introduction to Computer Organization and Digital Design"),
  );
  expect(checkTitleLength(f)).toHaveLength(0);
});
