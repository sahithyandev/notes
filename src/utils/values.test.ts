import { test, expect } from "bun:test";
import { isWip, isElective } from "./values";

test("isWip matches semester and module prefixes", () => {
  expect(isWip("s5/thermodynamics/intro")).toBe(true); // under s5
  expect(isWip("s5")).toBe(true); // the sem itself
  expect(isWip("s5x/foo")).toBe(false); // no false prefix hit
  expect(isWip("s4/linear-algebra/intro")).toBe(false); // other sem
});

test("isElective matches module prefixes", () => {
  expect(isElective("s5/image-processing")).toBe(true); // the module itself
  expect(isElective("s5/image-processing/intro")).toBe(true); // note under it
  expect(isElective("s5/image-processing-2")).toBe(false); // no false prefix hit
  expect(isElective("s5/numerical-methods/intro")).toBe(false); // other module
});
