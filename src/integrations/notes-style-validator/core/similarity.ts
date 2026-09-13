function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      curr[j] =
        a[i - 1] === b[j - 1]
          ? prev[j - 1]
          : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
    }
    prev = curr;
  }
  return prev[n];
}

export function score(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

export interface Suggestion {
  candidate: string;
  score: number;
}

const SUGGESTION_THRESHOLD = 0.55;
const MAX_SUGGESTIONS = 3;

export function suggest(
  broken: string,
  candidates: Iterable<string>,
): Suggestion[] {
  const results: Suggestion[] = [];
  for (const c of candidates) {
    const s = score(broken, c);
    if (s >= SUGGESTION_THRESHOLD) {
      results.push({ candidate: c, score: s });
    }
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, MAX_SUGGESTIONS);
}
