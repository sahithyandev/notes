import { test, expect } from "bun:test";
import { checkFilename } from "./filename.ts";
import { withScannedFiles } from "../test-helpers.ts";

const CONTENT = ["---", "title: X", "slug: s1/x", "---", "", "content"].join(
  "\n",
);

test("flags a filename with uppercase letters", () => {
  withScannedFiles({ "05-Markets-and-Products.mdx": CONTENT }, ([f]) => {
    expect(checkFilename(f)).toHaveLength(1);
  });
});

test("flags a .md filename", () => {
  withScannedFiles({ "05-markets-and-products.md": CONTENT }, ([f]) => {
    expect(checkFilename(f)).toHaveLength(1);
  });
});

test("flags both uppercase letters and .md extension", () => {
  withScannedFiles({ "05-Markets-and-Products.md": CONTENT }, ([f]) => {
    expect(checkFilename(f)).toHaveLength(2);
  });
});

test("does not flag an all-lowercase .mdx filename", () => {
  withScannedFiles({ "05-markets-and-products.mdx": CONTENT }, ([f]) => {
    expect(checkFilename(f)).toHaveLength(0);
  });
});
