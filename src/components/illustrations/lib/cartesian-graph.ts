export type GraphDomain = readonly [number, number];

export type GraphAxis = {
  label: string;
  domain: GraphDomain;
};

export type GraphCurve = {
  /** A mathematical relation, expressed in graph coordinates. */
  equation: (x: number) => number | null | undefined;
  /**
   * Horizontal translation in graph units. Positive values shift the complete
   * relation right, preserving the base equation's shape and slope.
   */
  xShift?: number;
  /** Optional analytic derivative. Enables exact tangent lines. */
  derivative?: (x: number) => number;
  /** Defaults to the full x-axis domain. */
  domain?: GraphDomain;
  /** More samples make a sharply changing relation smoother. Defaults to 72. */
  samples?: number;
  tone: "s5" | "ct" | "pt" | "key" | "ink";
  dashed?: boolean;
  round?: boolean;
  label?: string;
  /** The x coordinate at which to place the curve label. */
  labelAt?: number;
  labelDx?: number;
  labelDy?: number;
  tangents?: GraphTangent[];
};

export type GraphTangent = {
  /** The graph x coordinate where the tangent touches the relation. */
  at: number;
  /** The visible x-range of the tangent. Defaults to one unit either side. */
  domain?: GraphDomain;
  /** Overrides the curve derivative when a local slope is known directly. */
  slope?: number;
  tone?: GraphCurve["tone"];
  dashed?: boolean;
  label?: string;
  labelDx?: number;
  labelDy?: number;
};

export type GraphPoint = {
  x: number;
  y: number;
  tone?: GraphCurve["tone"];
  radius?: number;
  label?: string;
  labelDx?: number;
  labelDy?: number;
  labelTone?: GraphCurve["tone"];
  /** Draw dashed projections to the two axes. */
  guides?: boolean | "x" | "y";
};

export type GraphLine = {
  from: GraphCoordinate;
  to: GraphCoordinate;
  tone?: GraphCurve["tone"];
  dashed?: boolean;
  /** Render as a muted dashed projection line. */
  guide?: boolean;
  /** Add open arrowheads to a directional line. */
  arrow?: "start" | "end" | "both";
  width?: number;
};

export type GraphArea = {
  points: GraphCoordinate[];
  tone: GraphCurve["tone"];
  opacity?: number;
};

export type GraphLabel = {
  text: string;
  x: number;
  y: number;
  tone?: GraphCurve["tone"];
  anchor?: "start" | "middle" | "end";
  dx?: number;
  dy?: number;
  size?: number;
  weight?: number;
};

export type GraphCoordinate = { x: number; y: number };

export type GraphGeometry = {
  x0: number;
  y0: number;
  top: number;
  right: number;
  xDomain: GraphDomain;
  yDomain: GraphDomain;
};

const finite = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value);

export function xToSvg(x: number, geometry: GraphGeometry) {
  const [min, max] = geometry.xDomain;
  return (
    geometry.x0 + ((x - min) / (max - min)) * (geometry.right - geometry.x0)
  );
}

export function yToSvg(y: number, geometry: GraphGeometry) {
  const [min, max] = geometry.yDomain;
  return geometry.y0 - ((y - min) / (max - min)) * (geometry.y0 - geometry.top);
}

export function curveY(curve: GraphCurve, x: number) {
  return curve.equation(x - (curve.xShift ?? 0));
}

export function tangentSlope(curve: GraphCurve, tangent: GraphTangent) {
  if (tangent.slope !== undefined) return tangent.slope;
  if (curve.derivative)
    return curve.derivative(tangent.at - (curve.xShift ?? 0));
  throw new Error(
    "A graph tangent needs either tangent.slope or curve.derivative.",
  );
}

/** Samples an equation into SVG path data. Invalid values intentionally break a path. */
export function equationPath(curve: GraphCurve, geometry: GraphGeometry) {
  const [start, end] = curve.domain ?? geometry.xDomain;
  const samples = Math.max(2, curve.samples ?? 72);
  let path = "";
  let penDown = false;

  for (let index = 0; index < samples; index++) {
    const x = start + ((end - start) * index) / (samples - 1);
    const y = curveY(curve, x);
    if (!finite(y)) {
      penDown = false;
      continue;
    }

    path += `${penDown ? "L" : "M"} ${xToSvg(x, geometry).toFixed(2)} ${yToSvg(y, geometry).toFixed(2)} `;
    penDown = true;
  }

  return path.trim();
}
