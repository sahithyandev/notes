// Doolittle LU decomposition recorded one entry at a time, with exact
// fractions so the shown arithmetic matches a hand calculation. Each step
// stores the partly filled L and U (null = not yet computed), the entry just
// computed, the already-known entries it used, and the 2 equations as TeX.

interface Frac {
  n: number;
  d: number;
}

const gcd = (a: number, b: number): number => {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 1;
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
};
const frac = (n: number, d = 1): Frac => {
  if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0)
    return { n: 0, d: 1 };
  const g = gcd(n, d) || 1;
  const s = d < 0 ? -1 : 1;
  return { n: (s * n) / g, d: (s * d) / g };
};
const sub = (a: Frac, b: Frac) => frac(a.n * b.d - b.n * a.d, a.d * b.d);
const mul = (a: Frac, b: Frac) => frac(a.n * b.n, a.d * b.d);
const div = (a: Frac, b: Frac) => frac(a.n * b.d, a.d * b.n);

export const fracTex = (f: Frac) =>
  f.d === 1
    ? `${f.n}`
    : `${f.n < 0 ? "-" : ""}\\tfrac{${Math.abs(f.n)}}{${f.d}}`;
const paren = (f: Frac) => (f.n < 0 ? `(${fracTex(f)})` : fracTex(f));

export type Cell = Frac | null;
export type Used = { m: "l" | "u"; r: number; c: number };

export interface LuStep {
  label: string;
  kind: "start" | "l" | "u";
  // 0-based position of the entry just computed.
  r: number;
  c: number;
  L: Cell[][];
  U: Cell[][];
  used: Used[];
  eq: string[];
}

const SUB = "₀₁₂₃₄₅₆₇₈₉";
const subscript = (v: number) =>
  String(v)
    .split("")
    .map((d) => SUB[Number(d)])
    .join("");

// Crout LU decomposition — $u_{ii} = 1$, column of $L$ then row of $U$.
// Same `LuStep` shape so the Astro component can render both interchangeably.

export function computeCroutSteps(a: number[][]): LuStep[] {
  const n = a.length;
  const A = a.map((row) => row.map((v) => frac(v)));
  const L: Cell[][] = Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => (r < c ? frac(0) : null)),
  );
  const U: Cell[][] = Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) =>
      r === c ? frac(1) : r > c ? frac(0) : null,
    ),
  );
  const snapshot = (m: Cell[][]) => m.map((row) => row.slice());
  const steps: LuStep[] = [];
  const push = (s: Omit<LuStep, "L" | "U">) =>
    steps.push({ ...s, L: snapshot(L), U: snapshot(U) });

  push({ label: "Start", kind: "start", r: -1, c: -1, used: [], eq: [] });

  const l = (r: number, c: number) => L[r][c] as Frac;
  const u = (r: number, c: number) => U[r][c] as Frac;
  const ix = (r: number, c: number) => `${r + 1}${c + 1}`;

  for (let k = 0; k < n; k++) {
    // Column of L
    for (let i = k; i < n; i++) {
      let v = A[i][k];
      const used: Used[] = [];
      const sym: string[] = [];
      const num: string[] = [];
      for (let j = 0; j < k; j++) {
        v = sub(v, mul(l(i, j), u(j, k)));
        used.push({ m: "l", r: i, c: j }, { m: "u", r: j, c: k });
        sym.push(`l_{${ix(i, j)}} u_{${ix(j, k)}}`);
        num.push(`${paren(l(i, j))}${paren(u(j, k))}`);
      }
      L[i][k] = v;
      const target = `l_{${ix(i, k)}}`;
      const aik = `a_{${ix(i, k)}}`;
      const row = sym.length
        ? `${aik} = ${sym.join(" + ")} + ${target}`
        : `${aik} = ${target}`;
      const calc = sym.length
        ? `${target} = ${aik} - ${sym.join(" - ")} = ${fracTex(A[i][k])} - ${num.join(" - ")} = ${fracTex(v)}`
        : `${target} = ${aik} = ${fracTex(v)}`;
      push({
        label: `Column ${k + 1} of L, l${subscript(i + 1)}${subscript(k + 1)}`,
        kind: "l",
        r: i,
        c: k,
        used,
        eq: [row, calc],
      });
    }

    // Row of U (off-diagonal only, u_kk = 1 is fixed)
    if (l(k, k).n === 0) {
      throw new Error("CroutWalkthrough: zero pivot, pivoting is needed.");
    }
    for (let j = k + 1; j < n; j++) {
      let v = A[k][j];
      const used: Used[] = [{ m: "l", r: k, c: k }];
      const sym: string[] = [];
      const num: string[] = [];
      for (let p = 0; p < k; p++) {
        v = sub(v, mul(l(k, p), u(p, j)));
        used.push({ m: "l", r: k, c: p }, { m: "u", r: p, c: j });
        sym.push(`l_{${ix(k, p)}} u_{${ix(p, j)}}`);
        num.push(`${paren(l(k, p))}${paren(u(p, j))}`);
      }
      const w = div(v, l(k, k));
      U[k][j] = w;
      const target = `u_{${ix(k, j)}}`;
      const akj = `a_{${ix(k, j)}}`;
      const kkk = `l_{${ix(k, k)}}`;
      const row = `${akj} = ${[...sym, `${target} ${kkk}`].join(" + ")}`;
      const calc = sym.length
        ? `${target} = \\dfrac{${akj} - ${sym.join(" - ")}}{${kkk}} = \\dfrac{${fracTex(A[k][j])} - ${num.join(" - ")}}{${paren(l(k, k))}} = ${fracTex(w)}`
        : `${target} = \\dfrac{${akj}}{${kkk}} = \\dfrac{${fracTex(A[k][j])}}{${paren(l(k, k))}} = ${fracTex(w)}`;
      push({
        label: `Row ${k + 1} of U, u${subscript(k + 1)}${subscript(j + 1)}`,
        kind: "u",
        r: k,
        c: j,
        used,
        eq: [row, calc],
      });
    }
  }
  return steps;
}

export function computeLuSteps(a: number[][]): LuStep[] {
  const n = a.length;
  const A = a.map((row) => row.map((v) => frac(v)));
  const L: Cell[][] = Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) =>
      r === c ? frac(1) : c > r ? frac(0) : null,
    ),
  );
  const U: Cell[][] = Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => (r > c ? frac(0) : null)),
  );
  const snapshot = (m: Cell[][]) => m.map((row) => row.slice());
  const steps: LuStep[] = [];
  const push = (s: Omit<LuStep, "L" | "U">) =>
    steps.push({ ...s, L: snapshot(L), U: snapshot(U) });

  push({ label: "Start", kind: "start", r: -1, c: -1, used: [], eq: [] });

  const l = (r: number, c: number) => L[r][c] as Frac;
  const u = (r: number, c: number) => U[r][c] as Frac;
  const ix = (r: number, c: number) => `${r + 1}${c + 1}`;

  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      let v = A[i][j];
      const used: Used[] = [];
      const sym: string[] = [];
      const num: string[] = [];
      for (let k = 0; k < i; k++) {
        v = sub(v, mul(l(i, k), u(k, j)));
        used.push({ m: "l", r: i, c: k }, { m: "u", r: k, c: j });
        sym.push(`l_{${ix(i, k)}} u_{${ix(k, j)}}`);
        num.push(`${paren(l(i, k))}${paren(u(k, j))}`);
      }
      U[i][j] = v;
      const target = `u_{${ix(i, j)}}`;
      const aij = `a_{${ix(i, j)}}`;
      const row = sym.length
        ? `${aij} = ${sym.join(" + ")} + ${target}`
        : `${aij} = ${target}`;
      const calc = sym.length
        ? `${target} = ${aij} - ${sym.join(" - ")} = ${fracTex(A[i][j])} - ${num.join(" - ")} = ${fracTex(v)}`
        : `${target} = ${aij} = ${fracTex(v)}`;
      push({
        label: `Row ${i + 1} of U, u${subscript(i + 1)}${subscript(j + 1)}`,
        kind: "u",
        r: i,
        c: j,
        used,
        eq: [row, calc],
      });
    }
    for (let j = i + 1; j < n; j++) {
      const pivot = u(i, i);
      if (pivot.n === 0) {
        throw new Error("LuWalkthrough: zero pivot, pivoting is needed.");
      }
      let top = A[j][i];
      const used: Used[] = [{ m: "u", r: i, c: i }];
      const sym: string[] = [];
      const num: string[] = [];
      for (let k = 0; k < i; k++) {
        top = sub(top, mul(l(j, k), u(k, i)));
        used.push({ m: "l", r: j, c: k }, { m: "u", r: k, c: i });
        sym.push(`l_{${ix(j, k)}} u_{${ix(k, i)}}`);
        num.push(`${paren(l(j, k))}${paren(u(k, i))}`);
      }
      const v = div(top, pivot);
      L[j][i] = v;
      const target = `l_{${ix(j, i)}}`;
      const aji = `a_{${ix(j, i)}}`;
      const uii = `u_{${ix(i, i)}}`;
      const row = `${aji} = ${[...sym, `${target} ${uii}`].join(" + ")}`;
      const calc = sym.length
        ? `${target} = \\dfrac{${aji} - ${sym.join(" - ")}}{${uii}} = \\dfrac{${fracTex(A[j][i])} - ${num.join(" - ")}}{${paren(pivot)}} = ${fracTex(v)}`
        : `${target} = \\dfrac{${aji}}{${uii}} = \\dfrac{${fracTex(A[j][i])}}{${paren(pivot)}} = ${fracTex(v)}`;
      push({
        label: `Column ${i + 1} of L, l${subscript(j + 1)}${subscript(i + 1)}`,
        kind: "l",
        r: j,
        c: i,
        used,
        eq: [row, calc],
      });
    }
  }
  return steps;
}
