import { expect, test } from "bun:test";
import {
  curveY,
  equationPath,
  tangentSlope,
  xToSvg,
  yToSvg,
  type GraphGeometry,
} from "./cartesian-graph";

const geometry: GraphGeometry = {
  x0: 50,
  y0: 290,
  top: 20,
  right: 390,
  xDomain: [0, 10],
  yDomain: [0, 10],
};

test("converts graph coordinates into the figure coordinate system", () => {
  expect(xToSvg(0, geometry)).toBe(50);
  expect(xToSvg(10, geometry)).toBe(390);
  expect(yToSvg(0, geometry)).toBe(290);
  expect(yToSvg(10, geometry)).toBe(20);
});

test("samples equations and breaks paths at undefined values", () => {
  const path = equationPath(
    { equation: (x) => (x === 5 ? undefined : x), tone: "s5", samples: 3 },
    geometry,
  );
  expect(path).toStartWith("M 50.00 290.00");
  expect(path).toContain("M 390.00 20.00");
  expect(path).not.toContain("L 390.00 20.00");
});

test("shifts a relation without changing its equation", () => {
  const demand = {
    equation: (quantity: number) => 10 - quantity,
    tone: "s5" as const,
  };
  expect(curveY({ ...demand, xShift: -2 }, 3)).toBe(curveY(demand, 5));
  expect(curveY({ ...demand, xShift: 2 }, 7)).toBe(curveY(demand, 5));
});

test("uses the analytic derivative for a tangent at a shifted point", () => {
  const curve = {
    equation: (x: number) => x ** 2,
    derivative: (x: number) => 2 * x,
    xShift: 2,
    tone: "s5" as const,
  };
  expect(tangentSlope(curve, { at: 5 })).toBe(6);
  expect(tangentSlope(curve, { at: 5, slope: 10 })).toBe(10);
});
