import { test, expect } from "bun:test";
import { checkTitleDash } from "./title-dash.ts";
import { scanOne } from "../test-helpers.ts";

function note(frontmatterExtra: string, body = "Body text."): string {
  return `---\ntitle: X\nslug: s1/mathematics/foo\n${frontmatterExtra}\n---\n\n${body}\n`;
}

test("flags an em dash in the title", () => {
  const f = scanOne(
    `---\ntitle: Foo — Bar\nslug: s1/mathematics/foo\n---\n\nBody.\n`,
  );
  const violations = checkTitleDash(f);
  expect(violations).toHaveLength(1);
  expect(violations[0].snippet).toBe("Foo — Bar");
});

test("flags an en dash in the title", () => {
  const f = scanOne(
    `---\ntitle: Foo – Bar\nslug: s1/mathematics/foo\n---\n\nBody.\n`,
  );
  const violations = checkTitleDash(f);
  expect(violations).toHaveLength(1);
  expect(violations[0].snippet).toBe("Foo – Bar");
});

test("flags an em dash in sidebar.label", () => {
  const f = scanOne(note("sidebar:\n  order: 1\n  label: Foo — Bar"));
  const violations = checkTitleDash(f);
  expect(violations).toHaveLength(1);
  expect(violations[0].snippet).toBe("Foo — Bar");
});

test("flags an en dash in sidebar.label", () => {
  const f = scanOne(note("sidebar:\n  order: 1\n  label: Foo – Bar"));
  const violations = checkTitleDash(f);
  expect(violations).toHaveLength(1);
  expect(violations[0].snippet).toBe("Foo – Bar");
});

test("flags both title and sidebar.label independently", () => {
  const f = scanOne(
    `---\ntitle: A — B\nslug: s1/mathematics/foo\nsidebar:\n  order: 1\n  label: C – D\n---\n\nBody.\n`,
  );
  expect(checkTitleDash(f)).toHaveLength(2);
});

test("does not flag a title or label without a dash", () => {
  const f = scanOne(note("sidebar:\n  order: 1\n  label: Foo Bar"));
  expect(checkTitleDash(f)).toHaveLength(0);
});

test("does not flag an unspaced en dash range in the title", () => {
  const f = scanOne(
    `---\ntitle: History 1978–2020\nslug: s1/mathematics/foo\n---\n\nBody.\n`,
  );
  expect(checkTitleDash(f)).toHaveLength(0);
});

test("does not flag an unspaced en dash compound name in sidebar.label", () => {
  const f = scanOne(note("sidebar:\n  order: 1\n  label: Beattie–Bridgeman"));
  expect(checkTitleDash(f)).toHaveLength(0);
});

test("does not flag when sidebar.label is absent", () => {
  const f = scanOne(note(""));
  expect(checkTitleDash(f)).toHaveLength(0);
});
