import { join } from "node:path";
import { beforeAll, describe, expect, test } from "bun:test";
import { scanModuleRedirects } from "../module-redirects/scan.ts";
import { RULES } from "./report.ts";
import { validate } from "./validate.ts";

describe("notes-style-validator corpus", () => {
  let reports: ReturnType<typeof validate>["reports"];
  let matchedFileCount = 0;

  beforeAll(() => {
    const docsRoot = join(import.meta.dir, "../../../docs");

    // Module-redirect targets are valid link destinations even though no note
    // carries those exact slugs.
    const extraValidUrls = Object.keys(scanModuleRedirects(docsRoot));
    const result = validate(docsRoot, extraValidUrls);

    reports = result.reports;
    matchedFileCount = result.matchedFileCount;
  });

  test("scans the notes corpus", () => {
    expect(matchedFileCount).toBeGreaterThan(0);
  });

  for (const rule of RULES) {
    test(`${rule} has no violations`, () => {
      const violations = reports.flatMap((report) =>
        report.violations.filter((violation) => violation.rule === rule),
      );

      expect(violations).toEqual([]);
    });
  }
});
