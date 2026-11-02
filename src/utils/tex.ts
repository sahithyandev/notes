import katex from "katex";

export const tex = (v: string) =>
  katex.renderToString(v, { throwOnError: false, strict: false });

export type InlineTexPart =
  { type: "text"; value: string } | { type: "tex"; value: string };

// Splits a prose string into plain-text and `$...$` TeX fragments. Rendering
// text through Astro keeps it escaped; only the TeX fragments are passed to
// KaTeX with `set:html`.
export function parseInlineTex(value: string): InlineTexPart[] {
  const parts: InlineTexPart[] = [];
  const inlineTex = /\$([^$\n]+)\$/g;
  let index = 0;

  for (const match of value.matchAll(inlineTex)) {
    const [source, expression] = match;
    const start = match.index!;

    if (start > index) {
      parts.push({ type: "text", value: value.slice(index, start) });
    }
    parts.push({ type: "tex", value: expression });
    index = start + source.length;
  }

  if (index < value.length || parts.length === 0) {
    parts.push({ type: "text", value: value.slice(index) });
  }

  return parts;
}

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => HTML_ENTITIES[character]);

// Renders prose with inline `$...$` TeX without treating the prose as math.
// This is safe to use with Astro's `set:html`.
export const inlineTex = (value: string) =>
  parseInlineTex(value)
    .map((part) =>
      part.type === "tex" ? tex(part.value) : escapeHtml(part.value),
    )
    .join("");
