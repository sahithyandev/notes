import { test, expect } from "bun:test";
import { checkPrereqScope } from "./prereq-scope.ts";
import { scanOne } from "../test-helpers.ts";

function note(frontmatterExtra: string, body = "Body text."): string {
  return `---\ntitle: X\nslug: s1/mathematics/real-analysis/foo\n${frontmatterExtra}\n---\n\n${body}\n`;
}

test("flags a prereq in the same module (block-sequence form)", () => {
  const f = scanOne(
    note(
      "prereqs:\n  - s1/mathematics/real-analysis/bar\n  - s2/other-module/baz",
    ),
  );
  const violations = checkPrereqScope(f);
  expect(violations).toHaveLength(1);
  expect(violations[0].snippet).toBe("s1/mathematics/real-analysis/bar");
});

test("flags a prereq in the same module (inline array form)", () => {
  const f = scanOne(note("prereqs: [s1/mathematics/real-analysis/bar]"));
  expect(checkPrereqScope(f)).toHaveLength(1);
});

test("does not flag a prereq in a different module", () => {
  const f = scanOne(note("prereqs:\n  - s2/other-module/baz"));
  expect(checkPrereqScope(f)).toHaveLength(0);
});

test("strips an anchor before comparing module scope", () => {
  const f = scanOne(
    note("prereqs:\n  - s1/mathematics/real-analysis/bar#some-heading"),
  );
  expect(checkPrereqScope(f)).toHaveLength(1);
});

test("does not flag when there are no prereqs", () => {
  const f = scanOne(note(""));
  expect(checkPrereqScope(f)).toHaveLength(0);
});
