import { test, expect } from "bun:test";
import { checkCollapsedLabel } from "./collapsed-label.ts";
import { scanOne } from "../test-helpers.ts";

test("flags a short label with no hard break before its continuation", () => {
  const f = scanOne("- Same row\n  Both letters share a row in the grid.");
  expect(checkCollapsedLabel(f)).toHaveLength(1);
});

test("does not flag a label with two trailing spaces", () => {
  const f = scanOne("- Same row  \n  Both letters share a row in the grid.");
  expect(checkCollapsedLabel(f)).toHaveLength(0);
});

test("does not flag a label with a trailing backslash", () => {
  const f = scanOne("- **Euler**\\\n  Uses a fixed step size throughout.");
  expect(checkCollapsedLabel(f)).toHaveLength(0);
});

test("does not flag two independent bullets at the same indent", () => {
  const f = scanOne("- First point\n- Second point");
  expect(checkCollapsedLabel(f)).toHaveLength(0);
});

test("does not flag a bullet already handled by label-description", () => {
  const f = scanOne("- DES: 16 rounds\n  more text about it");
  expect(checkCollapsedLabel(f)).toHaveLength(0);
});

test("does not flag a sentence wrapped across source lines ending in a dangling preposition", () => {
  const f = scanOne(
    "- Use of\n  [circuit breakers](/x/circuit-breakers)/[fuses](/x/fuses/)",
  );
  expect(checkCollapsedLabel(f)).toHaveLength(0);
});

test("does not flag a label split mid-link (unbalanced brackets)", () => {
  const f = scanOne("- [Earthing](/x/earthing) of\n  equipment");
  expect(checkCollapsedLabel(f)).toHaveLength(0);
});

test("does not flag a wrapped clause whose continuation is lowercase", () => {
  const f = scanOne("- high stiffness (= high\n  modulus of elasticity)");
  expect(checkCollapsedLabel(f)).toHaveLength(0);
});

test("does not flag a label ending in a trailing hyphen", () => {
  const f = scanOne(
    "- current operated protection -\n  trips on leakage current.",
  );
  expect(checkCollapsedLabel(f)).toHaveLength(0);
});
