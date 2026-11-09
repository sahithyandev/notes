import { test, expect } from "bun:test";
import { isElective } from "./values";

test("isElective matches module prefixes", () => {
  expect(isElective("s5/image-processing")).toBe(true); // the module itself
  expect(isElective("s5/image-processing/intro")).toBe(true); // note under it
  expect(isElective("s5/image-processing-2")).toBe(false); // no false prefix hit
  expect(isElective("s5/numerical-methods/intro")).toBe(false); // other module
});
