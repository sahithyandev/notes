import { expect, test } from "bun:test";
import { checkUnusedImages, findUnusedImages } from "./unused-image.ts";
import { withScannedFiles } from "../test-helpers.ts";

test("accepts Markdown links and MDX image imports", () => {
  withScannedFiles(
    {
      "01-note.mdx": [
        "---",
        "title: Note",
        "---",
        "",
        "![linked](./images/linked.jpg)",
        'import Diagram from "./images/diagram.svg";',
      ].join("\n"),
      "images/linked.jpg": "",
      "images/diagram.svg": "",
      "images/unused.png": "",
    },
    (files) => {
      const docsRoot = files[0].file.replace(/\/01-note\.mdx$/, "");
      expect(findUnusedImages(files, docsRoot)).toEqual([
        `${docsRoot}/images/unused.png`,
      ]);
    },
  );
});

test("reports unused images at the image path", () => {
  withScannedFiles(
    {
      "01-note.mdx": "---\ntitle: Note\n---\n",
      "images/unused.jpg": "",
    },
    (files) => {
      const docsRoot = files[0].file.replace(/\/01-note\.mdx$/, "");
      expect(checkUnusedImages(files, docsRoot)).toEqual([
        {
          file: `${docsRoot}/images/unused.jpg`,
          violation: {
            rule: "unused-image",
            line: 1,
            text: "image docs/images/unused.jpg is not linked from any note",
            snippet: "docs/images/unused.jpg",
          },
        },
      ]);
    },
  );
});
