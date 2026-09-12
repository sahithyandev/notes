import { test, expect } from "bun:test";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { violationKey, isExcludedFromBaseline } from "./baseline.ts";
import { computeBaselineEntries } from "./validate.ts";

test("key is stable across different snippet whitespace/casing", () => {
  const a = violationKey("docs/s1/x.mdx", "em-dash", "Some Text  here");
  const b = violationKey("docs/s1/x.mdx", "em-dash", "some text here");
  expect(a).toBe(b);
});

test("key differs when the rule differs", () => {
  const a = violationKey("docs/s1/x.mdx", "em-dash", "same snippet");
  const b = violationKey("docs/s1/x.mdx", "label-description", "same snippet");
  expect(a).not.toBe(b);
});

test("key differs when the file differs", () => {
  const a = violationKey("docs/s1/x.mdx", "em-dash", "same snippet");
  const b = violationKey("docs/s1/y.mdx", "em-dash", "same snippet");
  expect(a).not.toBe(b);
});

test("key has no dependency on a line number (not part of the inputs at all)", () => {
  // violationKey's signature has no line parameter — this test exists to
  // document that invariant so a future edit doesn't reintroduce one.
  expect(violationKey.length).toBe(3);
});

test("isExcludedFromBaseline matches only the excluded semester", () => {
  expect(isExcludedFromBaseline("docs/s5/calculus/01-x.mdx")).toBe(true);
  expect(
    isExcludedFromBaseline("docs/s5/computer-security/12-playfair.mdx"),
  ).toBe(true);
  expect(isExcludedFromBaseline("docs/s4/linear-algebra/01-x.mdx")).toBe(false);
  expect(isExcludedFromBaseline("docs/s1/mathematics/01-x.mdx")).toBe(false);
});

test("isExcludedFromBaseline is safe for non-docs or root paths", () => {
  expect(isExcludedFromBaseline("s5/calculus/01-x.mdx")).toBe(false);
  expect(isExcludedFromBaseline("docs/s55/whatever/01-x.mdx")).toBe(false);
  expect(isExcludedFromBaseline("docs/s5")).toBe(false);
});

test("computeBaselineEntries never emits entries for excluded s5 notes", () => {
  const dir = mkdtempSync(join(tmpdir(), "nsv-baseline-"));
  try {
    const note = (title: string, slug: string): string =>
      `---\ntitle: ${title}\nslug: ${slug}\n---\n\nSome body text.\n`;
    for (const [rel, content] of Object.entries({
      "s5/calculus/01-derivatives.mdx": note(
        "the quick brown fox",
        "s5/calculus/derivatives",
      ),
      "s1/math/01-diagonalization.mdx": note(
        "the quick brown fox",
        "s1/math/diagonalization",
      ),
    })) {
      const full = join(dir, rel);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, content);
    }

    const { entries, excludedViolations } = computeBaselineEntries(dir);
    const files = entries.map((e) => e.file);
    expect(files).not.toContain("docs/s5/calculus/01-derivatives.mdx");
    expect(files).toContain("docs/s1/math/01-diagonalization.mdx");
    expect(excludedViolations).toBe(1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
