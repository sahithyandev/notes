import { test, expect } from "bun:test";
import { matchesFilter } from "./filter.ts";

const PATH = "docs/s1/mathematics/2-matrices/18-diagonalization.mdx";

test("no filter matches everything", () => {
  expect(matchesFilter(PATH, undefined)).toBe(true);
  expect(matchesFilter(PATH, "")).toBe(true);
  expect(matchesFilter(PATH, "   ")).toBe(true);
});

test("matches a whole semester", () => {
  expect(matchesFilter(PATH, "s1")).toBe(true);
  expect(matchesFilter(PATH, "s2")).toBe(false);
});

test("matches a whole module", () => {
  expect(matchesFilter(PATH, "s1/mathematics")).toBe(true);
  expect(matchesFilter(PATH, "s1/mechanics")).toBe(false);
});

test("matches a submodule by name, ignoring its numeric prefix", () => {
  expect(matchesFilter(PATH, "matrices")).toBe(true);
  expect(matchesFilter(PATH, "s1/mathematics/matrices")).toBe(true);
});

test("matches a submodule even when the filter includes its numeric prefix", () => {
  expect(matchesFilter(PATH, "2-matrices")).toBe(true);
});

test("matches a single note by name from anywhere in the tree", () => {
  expect(matchesFilter(PATH, "diagonalization")).toBe(true);
  expect(matchesFilter(PATH, "18-diagonalization")).toBe(true);
});

test("matches the full path, prefix included", () => {
  expect(
    matchesFilter(PATH, "s1/mathematics/2-matrices/18-diagonalization"),
  ).toBe(true);
});

test("is case-insensitive", () => {
  expect(matchesFilter(PATH, "MATRICES")).toBe(true);
});

test("does not match an unrelated module or note", () => {
  expect(matchesFilter(PATH, "electrical-fundamentals")).toBe(false);
  expect(matchesFilter(PATH, "transpose")).toBe(false);
});

test("does not match a segment sequence out of order", () => {
  expect(matchesFilter(PATH, "matrices/mathematics")).toBe(false);
});

test("tolerates leading/trailing slashes in the filter", () => {
  expect(matchesFilter(PATH, "/s1/mathematics/")).toBe(true);
});
