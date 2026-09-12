import { test, expect } from "bun:test";
import { violationKey } from "./baseline.ts";

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
