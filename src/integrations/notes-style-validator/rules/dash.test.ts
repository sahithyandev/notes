import { test, expect } from "bun:test";
import { checkDash } from "./dash.ts";
import { scanOne } from "../test-helpers.ts";

test("flags an em dash in prose", () => {
  const f = scanOne(
    "Modern AI is moving toward agentic systems — entities that plan.",
  );
  expect(checkDash(f)).toHaveLength(1);
});

test("flags a spaced en dash standing in for an em dash", () => {
  const f = scanOne(
    "Physical Market – buyers, sellers, and goods/services are in contact.",
  );
  expect(checkDash(f)).toHaveLength(1);
});

test("does not flag an unspaced en dash in a numeric range", () => {
  const f = scanOne("Bus Architecture (1978–Present) came next.");
  expect(checkDash(f)).toHaveLength(0);
});

test("does not flag an unspaced en dash joining a two-part proper noun", () => {
  const f = scanOne("The Beattie–Bridgeman Equation is used here.");
  expect(checkDash(f)).toHaveLength(0);
});

test("flags an en dash with a space on only one side", () => {
  const f = scanOne("The range is 40-80% – roughly.");
  expect(checkDash(f)).toHaveLength(1);
});

test("does not flag a dash inside a fenced code block", () => {
  const f = scanOne(["```", "// a comment — with a dash", "```"].join("\n"));
  expect(checkDash(f)).toHaveLength(0);
});

test("does not flag an em dash used alone as an empty table cell filler", () => {
  const f = scanOne("| a | b |\n| --- | --- |\n| x | — |");
  expect(checkDash(f)).toHaveLength(0);
});

test("does not flag an en dash used alone as an empty table cell filler", () => {
  const f = scanOne("| a | b |\n| --- | --- |\n| x | – |");
  expect(checkDash(f)).toHaveLength(0);
});

test("flags an em dash inside a table cell that also has real text", () => {
  const f = scanOne("| a | b |\n| --- | --- |\n| x | y — z |");
  expect(checkDash(f)).toHaveLength(1);
});

test("flags a spaced en dash inside a table cell that also has real text", () => {
  const f = scanOne("| a | b |\n| --- | --- |\n| x | y – z |");
  expect(checkDash(f)).toHaveLength(1);
});
