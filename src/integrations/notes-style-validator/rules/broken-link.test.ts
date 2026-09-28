import { test, expect } from "bun:test";
import { findBrokenLinks } from "./broken-link.ts";
import { withScannedFiles } from "../test-helpers.ts";

test("flags a doc link to a slug that doesn't exist", () => {
  withScannedFiles(
    {
      "s1/mod/01-a.mdx": `---\ntitle: A\n---\n\nSee [b](/s1/mod/nonexistent).\n`,
    },
    (files) => {
      const violations = findBrokenLinks(files);
      expect(violations).toHaveLength(1);
      expect(violations[0].kind).toBe("broken-link");
    },
  );
});

test("does not flag a doc link to a slug that exists", () => {
  withScannedFiles(
    {
      "s1/mod/01-a.mdx": `---\ntitle: A\n---\n\nSee [b](/s1/mod/b).\n`,
      "s1/mod/02-b.mdx": `---\ntitle: B\n---\n\nBody.\n`,
    },
    (files) => {
      expect(findBrokenLinks(files)).toHaveLength(0);
    },
  );
});

test("respects extraValidUrls for redirected slugs", () => {
  withScannedFiles(
    {
      "s1/mod/01-a.mdx": `---\ntitle: A\n---\n\nSee [old](/s1/old-module).\n`,
    },
    (files) => {
      expect(findBrokenLinks(files, ["/s1/old-module"])).toHaveLength(0);
    },
  );
});

test("flags a broken in-page anchor within the same file", () => {
  withScannedFiles(
    {
      "s1/mod/01-a.mdx": `---\ntitle: A\n---\n\n## Real Heading\n\nSee [x](#missing-heading).\n`,
    },
    (files) => {
      const violations = findBrokenLinks(files);
      expect(violations).toHaveLength(1);
      expect(violations[0].kind).toBe("broken-anchor");
    },
  );
});

test("does not flag an in-page anchor that matches a real heading", () => {
  withScannedFiles(
    {
      "s1/mod/01-a.mdx": `---\ntitle: A\n---\n\n## Real Heading\n\nSee [x](#real-heading).\n`,
    },
    (files) => {
      expect(findBrokenLinks(files)).toHaveLength(0);
    },
  );
});

test("flags a broken anchor on a link to another (valid) note", () => {
  withScannedFiles(
    {
      "s1/mod/01-a.mdx": `---\ntitle: A\n---\n\nSee [b](/s1/mod/b#missing).\n`,
      "s1/mod/02-b.mdx": `---\ntitle: B\n---\n\n## Existing\n`,
    },
    (files) => {
      const violations = findBrokenLinks(files);
      expect(violations).toHaveLength(1);
      expect(violations[0].kind).toBe("broken-anchor");
    },
  );
});

test("skips external links entirely", () => {
  withScannedFiles(
    {
      "s1/mod/01-a.mdx": `---\ntitle: A\n---\n\nSee [ext](https://example.com/nonexistent).\n`,
    },
    (files) => {
      expect(findBrokenLinks(files)).toHaveLength(0);
    },
  );
});

test("flags a relative image link that doesn't exist on disk", () => {
  withScannedFiles(
    {
      "s1/mod/01-a.mdx": `---\ntitle: A\n---\n\n![alt](./images/missing.png)\n`,
    },
    (files) => {
      const violations = findBrokenLinks(files);
      expect(violations).toHaveLength(1);
      expect(violations[0].kind).toBe("missing-image");
    },
  );
});

test("does not flag a relative image link that exists on disk", () => {
  withScannedFiles(
    {
      "s1/mod/01-a.mdx": `---\ntitle: A\n---\n\n![alt](./images/real.png)\n`,
      "s1/mod/images/real.png": "not actually a png, just needs to exist",
    },
    (files) => {
      expect(findBrokenLinks(files)).toHaveLength(0);
    },
  );
});

test("suggests a close match for a near-miss slug", () => {
  withScannedFiles(
    {
      "s1/mod/01-a.mdx": `---\ntitle: A\n---\n\nSee [b](/s1/mod/bb).\n`,
      "s1/mod/02-b.mdx": `---\ntitle: B\n---\n\nBody.\n`,
    },
    (files) => {
      const violations = findBrokenLinks(files);
      expect(violations).toHaveLength(1);
      expect(violations[0].suggestions.length).toBeGreaterThan(0);
      expect(violations[0].suggestions[0].candidate).toBe("/s1/mod/b");
    },
  );
});
