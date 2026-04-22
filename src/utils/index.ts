const EXCEPTIONS = new Set(["and", "or", "the", "a", "an"]);

export function titleize(s: string): string {
  return s
    .split("-")
    .map((word) => (EXCEPTIONS.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(" ");
}