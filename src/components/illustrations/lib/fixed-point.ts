// Fixed-point iteration recorded one step at a time. Each step holds the
// iterate x^(k), the change from the previous iterate, and the infinity norm
// of that change. The map G comes from the note, so the same runner serves
// any fixed-point problem.

export interface FixedPointStep {
  k: number;
  // The iterate x^(k).
  x: number[];
  // x^(k) - x^(k-1), null for the starting vector.
  delta: number[] | null;
  // Infinity norm of the change, null for the starting vector.
  norm: number | null;
}

export function computeFixedPointSteps(
  start: number[],
  iterate: (x: number[]) => number[],
  count: number,
): FixedPointStep[] {
  if (start.length === 0) {
    throw new Error("FixedPointTable: the starting vector has no components.");
  }
  const steps: FixedPointStep[] = [
    { k: 0, x: start.slice(), delta: null, norm: null },
  ];
  for (let k = 1; k <= count; k++) {
    const prev = steps[k - 1].x;
    const x = iterate(prev);
    if (x.length !== prev.length) {
      throw new Error(
        `FixedPointTable: the iterate at step ${k} has ${x.length} components, expected ${prev.length}.`,
      );
    }
    const delta = x.map((v, i) => v - prev[i]);
    steps.push({
      k,
      x,
      delta,
      norm: delta.reduce((m, v) => Math.max(m, Math.abs(v)), 0),
    });
  }
  return steps;
}

// Fixed decimals, with the negative zero a rounding step can produce
// ("-0.00000") normalised to "0.00000".
export function formatFixed(v: number, digits: number): string {
  if (Number.isNaN(v)) return "NaN";
  if (!Number.isFinite(v)) return v > 0 ? "∞" : "-∞";
  const s = v.toFixed(digits);
  return /^-0(\.0+)?$/.test(s) ? s.slice(1) : s;
}
