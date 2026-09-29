import { test, expect } from "bun:test";
import { checkPrereqScope } from "./prereq-scope.ts";
import { scanOne } from "../test-helpers.ts";

const NOTE_PATH = "s1/mathematics/real-analysis/01-foo.mdx";

function note(frontmatterExtra: string, body = "Body text."): string {
  return `---\ntitle: X\n${frontmatterExtra}\n---\n\n${body}\n`;
}

test("flags a prereq in the same module (block-sequence form)", () => {
  const f = scanOne(
    note(
      "prereqs:\n  - s1/mathematics/real-analysis/bar\n  - s0/other-module/baz",
    ),
    NOTE_PATH,
  );
  const violations = checkPrereqScope(f);
  expect(violations).toHaveLength(1);
  expect(violations[0].snippet).toBe("s1/mathematics/real-analysis/bar");
});

test("flags a prereq in the same module (inline array form)", () => {
  const f = scanOne(
    note("prereqs: [s1/mathematics/real-analysis/bar]"),
    NOTE_PATH,
  );
  expect(checkPrereqScope(f)).toHaveLength(1);
});

test("does not flag a prereq in a different module in an earlier semester", () => {
  const f = scanOne(
    note("prereqs:\n  - s1/other-module/baz"),
    "s2/mathematics/foo/01-bar.mdx",
  );
  expect(checkPrereqScope(f)).toHaveLength(0);
});

test("flags a prereq in a later semester", () => {
  const f = scanOne(note("prereqs:\n  - s5/other-module/baz"), NOTE_PATH);
  const violations = checkPrereqScope(f);
  expect(violations).toHaveLength(1);
  expect(violations[0].snippet).toBe("s5/other-module/baz");
});

test("does not flag a prereq in the same semester but a different module", () => {
  const f = scanOne(note("prereqs:\n  - s1/other-module/baz"), NOTE_PATH);
  expect(checkPrereqScope(f)).toHaveLength(0);
});

test("strips an anchor before comparing module scope", () => {
  const f = scanOne(
    note("prereqs:\n  - s1/mathematics/real-analysis/bar#some-heading"),
    NOTE_PATH,
  );
  expect(checkPrereqScope(f)).toHaveLength(1);
});

test("does not flag when there are no prereqs", () => {
  const f = scanOne(note(""), NOTE_PATH);
  expect(checkPrereqScope(f)).toHaveLength(0);
});
