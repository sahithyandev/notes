import { test, expect } from "bun:test";
import { checkRedundantPrereqs } from "./redundant-prereq.ts";
import { withScannedFiles } from "../test-helpers.ts";

function note(prereqs: string): string {
  return `---\ntitle: Note\nprereqs:\n  - ${prereqs}\n---\n\nBody.\n`;
}

test("flags repeated prerequisites throughout a consecutive sequence", () => {
  withScannedFiles(
    {
      "s5/calculus/complex-functions/01-introduction.mdx": note("s1/first"),
      "s5/calculus/complex-functions/02-limits.mdx": note("s1/first"),
      "s5/calculus/complex-functions/03-continuity.mdx": note("s1/first"),
    },
    (files) => {
      const violations = checkRedundantPrereqs(files);
      expect(violations).toHaveLength(2);
      expect(violations.map(({ file }) => file)).toEqual([
        expect.stringMatching(/02-limits\.mdx$/),
        expect.stringMatching(/03-continuity\.mdx$/),
      ]);
    },
  );
});

test("resolves relative prerequisites before comparing notes", () => {
  withScannedFiles(
    {
      "s5/calculus/complex-functions/01-introduction.mdx": note(
        "../../../s1/mathematics/complex-analysis/introduction",
      ),
      "s5/calculus/complex-functions/02-limits.mdx": note(
        "../../../s1/mathematics/complex-analysis/introduction",
      ),
    },
    (files) => expect(checkRedundantPrereqs(files)).toHaveLength(1),
  );
});

test("does not flag a different prerequisite or a non-consecutive note", () => {
  withScannedFiles(
    {
      "s5/calculus/complex-functions/01-introduction.mdx": note("s1/first"),
      "s5/calculus/complex-functions/03-derivatives.mdx": note("s1/first"),
    },
    (files) => expect(checkRedundantPrereqs(files)).toHaveLength(0),
  );
});
