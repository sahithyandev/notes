import { expect, test } from "bun:test";
import { computeFixedPointSteps, formatFixed } from "./fixed-point";

// The map G of the worked example in the fixed-point note.
const G = (x: number[]) => [
  (1 / 3) * Math.cos(x[1] * x[2]) + 1 / 6,
  (1 / 9) * Math.sqrt(x[0] ** 2 + Math.sin(x[2]) + 1.06) - 0.1,
  -(1 / 20) * Math.exp(-x[0] * x[1]) - (10 * Math.PI - 3) / 60,
];

test("the example reproduces the iterates of the note", () => {
  const steps = computeFixedPointSteps([0.1, 0.1, -0.1], G, 3);
  expect(steps).toHaveLength(4);
  expect(steps[0].x).toEqual([0.1, 0.1, -0.1]);
  expect(steps[1].x[0]).toBeCloseTo(0.499983, 6);
  expect(steps[1].x[1]).toBeCloseTo(0.0094411, 7);
  expect(steps[1].x[2]).toBeCloseTo(-0.5231013, 7);
  expect(steps[2].x[1]).toBeCloseTo(0.00002557, 8);
  expect(steps[3].x[1]).toBeCloseTo(0.00001234, 8);
  expect(steps[3].x[2]).toBeCloseTo(-0.5235981, 7);
});

test("the change is the difference from the previous step", () => {
  const steps = computeFixedPointSteps([0.1, 0.1, -0.1], G, 2);
  expect(steps[0].delta).toBeNull();
  expect(steps[0].norm).toBeNull();
  const d1 = steps[1].delta!;
  expect(d1[0]).toBeCloseTo(steps[1].x[0] - steps[0].x[0], 12);
  expect(d1[2]).toBeCloseTo(steps[1].x[2] - steps[0].x[2], 12);
  expect(steps[1].norm).toBeCloseTo(Math.max(...d1.map(Math.abs)), 12);
});

test("the norm is the largest absolute change", () => {
  const steps = computeFixedPointSteps([0.1, 0.1, -0.1], G, 3);
  expect(steps[1].norm).toBeCloseTo(0.4231013, 7);
  expect(steps[2].norm).toBeCloseTo(0.00941558, 8);
  expect(steps[3].norm).toBeCloseTo(0.00023483, 8);
  // Every later step is a smaller change than the one before it.
  const norms = steps.slice(1).map((s) => s.norm!);
  for (let i = 1; i < norms.length; i++) {
    expect(norms[i]).toBeLessThan(norms[i - 1]);
  }
});

test("a map that changes the size of the vector is rejected", () => {
  expect(() => computeFixedPointSteps([1], () => [1, 2], 1)).toThrow(
    /2 components, expected 1/,
  );
});

test("formatFixed keeps the sign and drops a negative zero", () => {
  expect(formatFixed(0.4999833334, 5)).toBe("0.49998");
  expect(formatFixed(-0.5231012672, 5)).toBe("-0.52310");
  expect(formatFixed(-0.0000001, 5)).toBe("0.00000");
  expect(formatFixed(-0, 5)).toBe("0.00000");
  expect(formatFixed(1.2601e-5, 8)).toBe("0.00001260");
});
