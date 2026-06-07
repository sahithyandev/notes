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

export function calculateReadTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / 200);
}

export function generateDescription(content: string): string {
  const firstParagraph = content.split("\n\n")[0];
  const cleanText = firstParagraph
    .replace(/[#*`_\[\]]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
    .trim();
  return cleanText.length > 160
    ? cleanText.substring(0, 157) + "..."
    : cleanText;
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
