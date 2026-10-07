import { test, expect } from "bun:test";
import { checkForwardLinks } from "./forward-link.ts";
import { withScannedFiles } from "../test-helpers.ts";

const note = (body: string) => ["---", "title: X", "---", "", body].join("\n");

test("flags a link to a later note in the same module", () => {
  withScannedFiles(
    {
      "s1/mod/01-a.mdx": note("See [b](/s1/mod/b)."),
      "s1/mod/02-b.mdx": note("content"),
    },
    (files) => {
      const out = checkForwardLinks(files);
      expect(out).toHaveLength(1);
      expect(out[0].violation.rule).toBe("forward-link");
      expect(out[0].violation.line).toBe(5);
    },
  );
});

test("does not flag a link to an earlier note", () => {
  withScannedFiles(
    {
      "s1/mod/01-a.mdx": note("content"),
      "s1/mod/02-b.mdx": note("See [a](/s1/mod/a#x)."),
    },
    (files) => {
      expect(checkForwardLinks(files)).toHaveLength(0);
    },
  );
});

test("does not flag a link to a later note in another module", () => {
  withScannedFiles(
    {
      "s1/mod/01-a.mdx": note("See [b](/s1/other/b)."),
      "s1/other/02-b.mdx": note("content"),
    },
    (files) => {
      expect(checkForwardLinks(files)).toHaveLength(0);
    },
  );
});

test("does not compare notes across submodules", () => {
  withScannedFiles(
    {
      "s1/mod/x/01-a.mdx": note("See [b](/s1/mod/y/b)."),
      "s1/mod/y/02-b.mdx": note("content"),
    },
    (files) => {
      expect(checkForwardLinks(files)).toHaveLength(0);
    },
  );
});

test("ignores in-page anchors and self links", () => {
  withScannedFiles(
    { "s1/mod/01-a.mdx": note("[h](#h) [a](/s1/mod/a)") },
    (files) => {
      expect(checkForwardLinks(files)).toHaveLength(0);
    },
  );
});
