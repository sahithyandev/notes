import { readFileSync } from "node:fs";
import { test, expect } from "bun:test";
import { validate } from "./validate.ts";
import { withScannedFiles } from "./test-helpers.ts";

test("auto-fixes terminal periods in math blocks before validating", () => {
  withScannedFiles({ "01-example.mdx": "$$\nx = y.\n$$\n" }, (files) => {
    const docsRoot = files[0].file.replace(/\/01-example\.mdx$/, "");
    const result = validate(docsRoot, [], undefined, true);

    expect(result.autoFixedCount).toBe(1);
    expect(result.count).toBe(0);
    expect(readFileSync(files[0].file, "utf8")).toBe("$$\nx = y\n$$\n");
  });
});

test("does not auto-fix by default", () => {
  withScannedFiles({ "01-example.mdx": "$$\nx = y.\n$$\n" }, (files) => {
    const docsRoot = files[0].file.replace(/\/01-example\.mdx$/, "");
    const result = validate(docsRoot);

    expect(result.autoFixedCount).toBe(0);
    expect(result.count).toBe(1);
    expect(readFileSync(files[0].file, "utf8")).toBe("$$\nx = y.\n$$\n");
  });
});
