import { test, expect } from "bun:test";
import { isWip } from "./values";

test("isWip matches semester and module prefixes", () => {
  expect(isWip("s5/thermodynamics/intro")).toBe(true); // under s5
  expect(isWip("s5")).toBe(true); // the sem itself
  expect(isWip("s5x/foo")).toBe(false); // no false prefix hit
  expect(isWip("s4/linear-algebra/intro")).toBe(false); // other sem
});
