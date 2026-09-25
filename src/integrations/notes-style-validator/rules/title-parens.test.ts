import { test, expect } from "bun:test";
import { checkTitleParens } from "./title-parens.ts";
import { scanOne } from "../test-helpers.ts";

function note(title: string, body = "Body text."): string {
  return `---\ntitle: ${title}\nslug: s1/mathematics/foo\n---\n\n${body}\n`;
}

test("flags a title containing parentheses", () => {
  const f = scanOne(note("Voice over IP (VoIP)"));
  const violations = checkTitleParens(f);
  expect(violations).toHaveLength(1);
  expect(violations[0].snippet).toBe("Voice over IP (VoIP)");
});

test("flags a title containing only an opening or closing paren", () => {
  const f = scanOne(note("Weird Title (unbalanced"));
  expect(checkTitleParens(f)).toHaveLength(1);
});

test("does not flag a title without parentheses", () => {
  const f = scanOne(note("Voice over IP"));
  expect(checkTitleParens(f)).toHaveLength(0);
});
