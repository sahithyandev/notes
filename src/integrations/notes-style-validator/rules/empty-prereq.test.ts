import { test, expect } from "bun:test";
import { checkEmptyPrereq } from "./empty-prereq.ts";
import { scanOne } from "../test-helpers.ts";

function note(frontmatter: string): string {
  return `---\ntitle: Note\n${frontmatter}\n---\n\nBody.\n`;
}

test("flags an empty block-sequence prerequisite field", () => {
  const violations = checkEmptyPrereq(scanOne(note("prereqs:")));
  expect(violations).toHaveLength(1);
  expect(violations[0].line).toBe(3);
});

test("flags an empty inline prerequisite array", () => {
  expect(checkEmptyPrereq(scanOne(note("prereqs: []")))).toHaveLength(1);
});

test("does not flag a populated or absent prerequisite field", () => {
  expect(
    checkEmptyPrereq(scanOne(note("prereqs:\n  - s1/mathematics/foo"))),
  ).toHaveLength(0);
  expect(
    checkEmptyPrereq(scanOne(note("dateCreated: 2026-01-01"))),
  ).toHaveLength(0);
});
