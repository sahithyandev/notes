import { test, expect } from "bun:test";
import { checkAdjacentList } from "./adjacent-list.ts";
import { scanOne } from "../test-helpers.ts";

test("flags 2 lists separated only by a blank line", () => {
  const f = scanOne(["- a", "- b", "", "- c", "- d"].join("\n"));
  const v = checkAdjacentList(f);
  expect(v).toHaveLength(1);
  expect(v[0].line).toBe(4);
});

test("flags lists with different markers", () => {
  const f = scanOne(["- a", "", "* b"].join("\n"));
  expect(checkAdjacentList(f)).toHaveLength(1);
});

test("flags when the 1st list ends with an indented description", () => {
  const f = scanOne(["- Label  ", "  description", "", "- other"].join("\n"));
  expect(checkAdjacentList(f)).toHaveLength(1);
});

test("does not flag lists separated by prose", () => {
  const f = scanOne(["- a", "", "prose", "", "- b"].join("\n"));
  expect(checkAdjacentList(f)).toHaveLength(0);
});

test("does not flag a tight list", () => {
  const f = scanOne(["- a", "- b", "- c"].join("\n"));
  expect(checkAdjacentList(f)).toHaveLength(0);
});

test("flags a blank line between an item with a nested list and the next item", () => {
  const f = scanOne(["- a", "", "  - nested", "", "- b"].join("\n"));
  expect(checkAdjacentList(f)).toHaveLength(1);
  expect(checkAdjacentList(f)[0].line).toBe(5);
});

test("does not flag a list after a block equation", () => {
  const f = scanOne(["- a", "", "$$", "x", "$$", "", "- b"].join("\n"));
  expect(checkAdjacentList(f)).toHaveLength(0);
});

test("does not flag lists on either side of a code fence", () => {
  const f = scanOne(["- a", "", "```", "- x", "```", "", "- b"].join("\n"));
  expect(checkAdjacentList(f)).toHaveLength(0);
});

test("does not flag lists on either side of a Note", () => {
  const f = scanOne(["- a", "", "<Note>", "", "- b", "", "</Note>"].join("\n"));
  expect(checkAdjacentList(f)).toHaveLength(0);
});

test("does not treat an ordered list as unordered", () => {
  const f = scanOne(["- a", "", "1. b"].join("\n"));
  expect(checkAdjacentList(f)).toHaveLength(0);
});
