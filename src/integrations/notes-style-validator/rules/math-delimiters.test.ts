import { test, expect } from "bun:test";
import { checkMathDelimiters } from "./math-delimiters.ts";
import { scanOne } from "../test-helpers.ts";

test("flags \\[ \\] block delimiters", () => {
  const f = scanOne(
    ["At equilibrium:", "", "\\[", "Q_d = Q_s", "\\]"].join("\n"),
  );
  expect(checkMathDelimiters(f)).toHaveLength(2);
});

test("flags \\( \\) inline delimiters", () => {
  const f = scanOne("The equilibrium price is \\(P^*\\).");
  expect(checkMathDelimiters(f)).toHaveLength(2);
});

test("does not flag $$ block math", () => {
  const f = scanOne(["$$", "Q_d = Q_s", "$$"].join("\n"));
  expect(checkMathDelimiters(f)).toHaveLength(0);
});

test("does not flag $ inline math", () => {
  const f = scanOne("The equilibrium price is $P^*$.");
  expect(checkMathDelimiters(f)).toHaveLength(0);
});

test("does not flag \\( \\) inside inline code", () => {
  const f = scanOne("Use `\\(` and `\\)` for LaTeX math in other tools.");
  expect(checkMathDelimiters(f)).toHaveLength(0);
});

test("does not flag \\[ \\] inside a fenced code block", () => {
  const f = scanOne(["```", "\\[", "x", "\\]", "```"].join("\n"));
  expect(checkMathDelimiters(f)).toHaveLength(0);
});
