import { test, expect } from "bun:test";
import { checkEmDash } from "./em-dash.ts";
import { scanOne } from "../test-helpers.ts";

test("flags an em dash in prose", () => {
  const f = scanOne(
    "Modern AI is moving toward agentic systems — entities that plan.",
  );
  expect(checkEmDash(f)).toHaveLength(1);
});

test("does not flag an em dash inside a fenced code block", () => {
  const f = scanOne(["```", "// a comment — with a dash", "```"].join("\n"));
  expect(checkEmDash(f)).toHaveLength(0);
});

test("does not flag an em dash used alone as an empty table cell filler", () => {
  const f = scanOne("| a | b |\n| --- | --- |\n| x | — |");
  expect(checkEmDash(f)).toHaveLength(0);
});

test("flags an em dash inside a table cell that also has real text", () => {
  const f = scanOne("| a | b |\n| --- | --- |\n| x | y — z |");
  expect(checkEmDash(f)).toHaveLength(1);
});
