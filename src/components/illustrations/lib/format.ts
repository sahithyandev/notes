// Shared by the sensitivity sliders' render loops.
const SUBSCRIPT: Record<string, string> = { "1": "₁", "2": "₂", "3": "₃" };

export const fmt = (n: number) => {
  const rounded = Math.round(n * 100) / 100;
  return Object.is(rounded, -0) ? "0" : String(rounded);
};

export const label = (name: string) => {
  const [base, idx] = name.split("_");
  return `${base}${SUBSCRIPT[idx] ?? idx}`;
};
