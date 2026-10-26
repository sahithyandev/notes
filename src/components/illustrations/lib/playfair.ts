const alphabet = "ABCDEFGHIKLMNOPQRSTUVWXYZ";

export interface PlayfairPairExample {
  rule: string;
  input: string;
  output: string;
  description: string;
}

export function buildPlayfairGrid(keyword: string) {
  const normalized = keyword
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .replaceAll("J", "I");
  const letters = Array.from(new Set(`${normalized}${alphabet}`));

  if (letters.length !== 25) {
    throw new Error("Playfair grid requires 25 distinct letters.");
  }

  return Array.from({ length: 5 }, (_, row) =>
    letters.slice(row * 5, row * 5 + 5),
  );
}
