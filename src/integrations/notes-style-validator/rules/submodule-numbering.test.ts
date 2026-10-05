import { test, expect } from "bun:test";
import { checkSubmoduleNumbering } from "./submodule-numbering.ts";
import { withScannedFiles } from "../test-helpers.ts";

const C = ["---", "title: X", "---", "", "content"].join("\n");

test("flags submodules whose numbering continues from another submodule", () => {
  withScannedFiles(
    {
      "s1/mod/a/01-x.mdx": C,
      "s1/mod/a/02-y.mdx": C,
      "s1/mod/b/03-z.mdx": C,
      "s1/mod/b/04-w.mdx": C,
    },
    (files) => {
      expect(checkSubmoduleNumbering(files)).toHaveLength(2);
    },
  );
});

test("does not flag numbering that restarts per submodule", () => {
  withScannedFiles(
    {
      "s1/mod/a/01-x.mdx": C,
      "s1/mod/a/02-y.mdx": C,
      "s1/mod/b/01-z.mdx": C,
    },
    (files) => {
      expect(checkSubmoduleNumbering(files)).toHaveLength(0);
    },
  );
});

test("ignores notes directly under a module", () => {
  withScannedFiles({ "s1/mod/05-x.mdx": C }, (files) => {
    expect(checkSubmoduleNumbering(files)).toHaveLength(0);
  });
});
