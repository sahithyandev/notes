export const MATH_BLOCK_KINDS = ["Theorem", "Definition"] as const;

export type MathBlockKind = (typeof MATH_BLOCK_KINDS)[number];

export function isMathBlockKind(name: string): name is MathBlockKind {
  return (MATH_BLOCK_KINDS as readonly string[]).includes(name);
}

/** Heading depth for a block's `level` attribute. Only 2 and 3 are valid. */
export function mathBlockDepth(level: string | undefined): 2 | 3 | null {
  if (level === undefined || level === "2") return 2;
  if (level === "3") return 3;
  return null;
}
