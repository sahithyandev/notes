const LOWERCASE = new Set([
  "and",
  "or",
  "the",
  "a",
  "an",
  "of",
  "in",
  "on",
  "for",
  "to",
]);

const ABBREVIATIONS: Record<string, string> = {
  iot: "Internet of Things",
  ai: "AI",
  ml: "ML",
  os: "OS",
  db: "DB",
  api: "API",
  html: "HTML",
  css: "CSS",
  js: "JS",
  ui: "UI",
  ux: "UX",
  http: "HTTP",
  https: "HTTPS",
  url: "URL",
  sql: "SQL",
  io: "I/O",
  cpu: "CPU",
  gpu: "GPU",
  ram: "RAM",
  tcp: "TCP",
  udp: "UDP",
  ip: "IP",
  dns: "DNS",
};

export function stripMdxSyntax(content: string): string {
  return content
    .replace(/\$\$[\s\S]*?\$\$/g, "")
    .replace(/\$[^$\n]+\$/g, "x")
    .replace(/^import .*$/gm, "")
    .replace(/^export .*$/gm, "")
    .replace(/<\/?[A-Za-z][^>]*>/g, " ")
    .replace(/^#{1,6}\s+/gm, "");
}

export function calculateWordCount(content: string): number {
  if (!content) return 0;
  const words = stripMdxSyntax(content).trim().split(/\s+/).filter(Boolean);
  return words.length;
}

export function calculateReadTime(wordCount: number): number {
  return Math.ceil(wordCount / 200);
}

const DESCRIPTION_MAX_LENGTH = 160;

// Blocks that aren't prose: headings, lists, tables, quotes, rules, images, raw HTML/JSX.
const NON_PROSE_BLOCK =
  /^(#{1,6}\s|[-*+]\s|\d+[.)]\s|\||>|---|\*\*\*|!\[|<|(import|export)\s)/;

// Reduces inline TeX to readable plain text (`\\mathbb{R}^n` becomes `R n`).
function flattenMath(_match: string, tex: string): string {
  return tex
    .replace(/\\(?:mathbb|mathbf|boldsymbol|mathrm|text)\s*\{([^}]*)\}/g, "$1")
    .replace(/\\[a-zA-Z]+/g, " ")
    .replace(/[{}^_\\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateDescription(text: string): string {
  return text.length > DESCRIPTION_MAX_LENGTH
    ? text.substring(0, DESCRIPTION_MAX_LENGTH - 3) + "..."
    : text;
}

export function generateDescription(
  content: string,
  override?: string,
): string {
  const explicit = override?.trim();
  if (explicit) return truncateDescription(explicit);

  const withoutBlocks = content
    .replace(/^(```|~~~)[\s\S]*?^\1.*$/gm, "")
    .replace(/\$\$[\s\S]*?\$\$/g, "")
    .replace(/^<([A-Z][\w.]*)\b[^>]*[^/]>[\s\S]*?^<\/\1>\s*$/gm, "")
    .replace(/^<[A-Z][\w.]*\b[^>]*\/>\s*$/gm, "");
  const prose = withoutBlocks
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .find((block) => block && !NON_PROSE_BLOCK.test(block));
  if (!prose) return "";

  const cleanText = stripMdxSyntax(prose.replace(/\$([^$]+)\$/g, flattenMath))
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*`_\[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return truncateDescription(cleanText);
}

export function titleize(s: string): string {
  if (ABBREVIATIONS[s]) return ABBREVIATIONS[s];
  return s
    .split("-")
    .map((word, i) => {
      const abbreviationsLookup = ABBREVIATIONS[word];
      if (abbreviationsLookup) return abbreviationsLookup;
      if (i > 0 && LOWERCASE.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}
