// Articles, coordinating conjunctions, and short prepositions that stay
// lowercase in title case unless first or last.
export const MINOR_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "nor",
  "but",
  "so",
  "yet",
  "for",
  "of",
  "in",
  "on",
  "at",
  "to",
  "by",
  "up",
  "as",
  "if",
  "via",
  "with",
  "from",
  "into",
  "over",
  "per",
  "than",
  "that",
  "vs",
  "vs.",
  "are",
]);

// Domain terms that are correctly lowercase wherever they appear.
// Grow this list as the backlog is worked through.
export const ALLOWED_LOWERCASE = new Set([
  "vtable",
  "mx2",
  "rms",
  "sin",
  "cos",
  "tan",
  "cot",
  "sec",
  "csc",
  "log",
  "ln",
  "exp",
  "setuid",
  "de",
  "iff",
  "f",
  "g",
  "h",
  "x",
  "y",
  "z",
  "n",
  "m",
  "i",
  "j",
  "k",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "a",
  "b",
  "c",
  "d",
  "e",
  "th",
  "st",
  "nd",
  "rd",
]);

const HAS_ASCII_LETTER = /[A-Za-z]/;
const LEADING_PUNCT = /^[^A-Za-z0-9$`]+/;

function isAllowedLowercase(word: string): boolean {
  return ALLOWED_LOWERCASE.has(word.toLowerCase());
}

// A token whose casing must not be touched: math, code, mixed-case acronyms,
// or purely non-alphabetic content.
function isProtected(token: string): boolean {
  if (token.includes("$") || token.includes("`")) return true;
  // Markdown link or path/URL fragment: leave casing untouched.
  if (token.includes("[") || token.includes("]") || token.includes("/")) {
    return true;
  }
  if (!HAS_ASCII_LETTER.test(token)) return true;
  const core = token.replace(LEADING_PUNCT, "");
  // Uppercase letter anywhere past the first character => deliberate casing.
  if (/[A-Z]/.test(core.slice(1))) return true;
  return false;
}

function capitalizeFirst(word: string): string {
  const m = LEADING_PUNCT.exec(word);
  const lead = m ? m[0] : "";
  const rest = word.slice(lead.length);
  if (!rest) return word;
  return lead + rest[0].toUpperCase() + rest.slice(1);
}

function lowercaseFirst(word: string): string {
  const m = LEADING_PUNCT.exec(word);
  const lead = m ? m[0] : "";
  const rest = word.slice(lead.length);
  if (!rest) return word;
  return lead + rest[0].toLowerCase() + rest.slice(1);
}

function firstLetterIsUpper(word: string): boolean {
  const core = word.replace(LEADING_PUNCT, "");
  return (
    core.length > 0 &&
    core[0] === core[0].toUpperCase() &&
    /[A-Za-z]/.test(core[0])
  );
}

// Correct one whitespace-delimited token. `forceCap` is set for the first,
// last, and post-colon positions.
function fixToken(token: string, forceCap: boolean): string {
  if (isProtected(token)) return token;

  if (token.includes("-")) {
    const segs = token.split("-");
    return segs
      .map((seg, idx) => {
        if (!seg) return seg;
        if (isProtected(seg)) return seg;
        // Allowed-lowercase terms stay lowercase everywhere, even at an edge.
        if (isAllowedLowercase(seg)) return seg;
        const isEdge = forceCap && (idx === 0 || idx === segs.length - 1);
        if (!isEdge && MINOR_WORDS.has(seg.toLowerCase())) {
          return lowercaseFirst(seg);
        }
        return capitalizeFirst(seg);
      })
      .join("-");
  }

  // Allowed-lowercase terms stay lowercase everywhere, even first or last.
  if (isAllowedLowercase(token)) return token;
  if (!forceCap && MINOR_WORDS.has(token.toLowerCase())) {
    return lowercaseFirst(token);
  }
  return capitalizeFirst(token);
}

export interface TitleCaseResult {
  ok: boolean;
  corrected: string;
}

export function checkTitleCase(text: string): TitleCaseResult {
  const tokens = text.split(/(\s+)/); // keeps whitespace as separators
  const wordIdx: number[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (i % 2 === 0 && tokens[i].length > 0) wordIdx.push(i);
  }

  for (let w = 0; w < wordIdx.length; w++) {
    const ti = wordIdx[w];
    const prevWord = w > 0 ? tokens[wordIdx[w - 1]] : "";
    const forceCap =
      w === 0 || w === wordIdx.length - 1 || /:$/.test(prevWord.trim());
    tokens[ti] = fixToken(tokens[ti], forceCap);
  }

  const corrected = tokens.join("");
  return { ok: corrected === text, corrected };
}

// Exposed for potential reuse / testing.
export { firstLetterIsUpper };
