import { expect, test } from "bun:test";
import { computeCroutSteps, computeLuSteps } from "./lu-steps";

const val = (c: { n: number; d: number } | null) => (c ? c.n / c.d : null);

test("Doolittle steps reproduce the worked example", () => {
  const steps = computeLuSteps([
    [2, 1, -1],
    [-3, -1, 2],
    [-2, 1, 2],
  ]);
  expect(steps).toHaveLength(10);
  const last = steps[steps.length - 1];
  expect(last.L.map((r) => r.map(val))).toEqual([
    [1, 0, 0],
    [-1.5, 1, 0],
    [-1, 4, 1],
  ]);
  expect(last.U.map((r) => r.map(val))).toEqual([
    [2, 1, -1],
    [0, 0.5, 0.5],
    [0, 0, -1],
  ]);
});

test("fractions stay exact", () => {
  const steps = computeLuSteps([
    [2, -1, 0],
    [-1, 2, -1],
    [0, -1, 2],
  ]);
  expect(steps[steps.length - 1].U[2][2]).toEqual({ n: 4, d: 3 });
});

test("Crout steps reproduce the worked example", () => {
  const steps = computeCroutSteps([
    [2, 1, -1],
    [-3, -1, 2],
    [-2, 1, 2],
  ]);
  expect(steps).toHaveLength(10);
  const last = steps[steps.length - 1];
  expect(last.L.map((r) => r.map(val))).toEqual([
    [2, 0, 0],
    [-3, 0.5, 0],
    [-2, 2, -1],
  ]);
  expect(last.U.map((r) => r.map(val))).toEqual([
    [1, 0.5, -0.5],
    [0, 1, 1],
    [0, 0, 1],
  ]);
});

test("Crout prefills the structural zeros", () => {
  const steps = computeCroutSteps([
    [2, 1, -1],
    [-3, -1, 2],
    [-2, 1, 2],
  ]);
  const start = steps[0];
  expect(start.L[0][1]).toEqual({ n: 0, d: 1 });
  expect(start.U[1][0]).toEqual({ n: 0, d: 1 });
  expect(start.L[1][0]).toBeNull();
  expect(start.U[0][1]).toBeNull();
});
