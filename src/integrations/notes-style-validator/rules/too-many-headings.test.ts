import { test, expect } from "bun:test";
import { checkTooManyHeadings } from "./too-many-headings.ts";
import { scanOne } from "../test-helpers.ts";

function note(count: number, level = "##"): string {
  const body = Array.from(
    { length: count },
    (_, i) => `${level} Part ${i}\n\nbody\n`,
  );
  return ["---", "title: Big", "---", "", ...body].join("\n");
}

test("flags a note over the limit at the first excess heading", () => {
  const violations = checkTooManyHeadings(scanOne(note(41)));
  expect(violations).toHaveLength(1);
  expect(violations[0].text).toContain("41 headings");
  expect(violations[0].line).toBe(5 + 40 * 4);
});

test("does not flag a note at the limit", () => {
  expect(checkTooManyHeadings(scanOne(note(40)))).toHaveLength(0);
});

test("ignores headings inside fenced code", () => {
  const fenced = ["```", ...Array.from({ length: 50 }, () => "## x"), "```"];
  const src = ["---", "title: Big", "---", "", ...fenced].join("\n");
  expect(checkTooManyHeadings(scanOne(src))).toHaveLength(0);
});
