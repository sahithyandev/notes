import { checkTitleCase } from "../integrations/notes-style-validator/core/titlecase";
import { tex } from "../utils/tex";

export interface GlossarySource {
  id: string;
  title: string;
  body: string;
}

export interface GlossaryEntry {
  alias: string;
  term: string;
  noteTitle: string;
  href: string;
}

interface Context {
  position: number;
  text: string;
  anchor?: string;
}

/**
 * Reads the author-facing <Aka> convention without needing to render MDX.
 * A component belongs to the closest preceding heading or list item, which is
 * how aliases are introduced throughout the notes.
 */
export function extractGlossaryEntries(
  source: GlossarySource,
): GlossaryEntry[] {
  const contexts = contextsIn(source.body);
  const entries: GlossaryEntry[] = [];
  const aka = /<Aka(?:\s[^>]*)?>([\s\S]*?)<\/Aka>/g;

  for (const match of source.body.matchAll(aka)) {
    const alias = plainText(match[1]);
    if (!alias) continue;

    const position = match.index ?? 0;
    const context = [...contexts]
      .reverse()
      .find((candidate) => candidate.position <= position);
    const term = context?.text || source.title;
    const anchor = context?.anchor ? `#${context.anchor}` : "";

    entries.push({
      alias,
      term,
      noteTitle: source.title,
      href: `/${source.id}${anchor}`,
    });
  }

  return entries;
}

export function buildGlossary(sources: GlossarySource[]): GlossaryEntry[] {
  return sources
    .flatMap(extractGlossaryEntries)
    .sort((a, b) =>
      a.alias.localeCompare(b.alias, undefined, { sensitivity: "base" }),
    );
}

/** Renders inline TeX while escaping all non-math source text. */
export function renderGlossaryText(value: string): string {
  const math = /\$([^$\n]+?)\$/g;
  let html = "";
  let previous = 0;

  for (const match of value.matchAll(math)) {
    const index = match.index ?? 0;
    html += escapeHtml(value.slice(previous, index));
    html += tex(match[1]);
    previous = index + match[0].length;
  }

  return html + escapeHtml(value.slice(previous));
}

/** Applies the note title-casing rules while retaining acronyms and TeX. */
export function titleCaseGlossaryAlias(alias: string): string {
  const math: string[] = [];
  const masked = alias.replace(/\$[^$\n]+?\$/g, (match) => {
    const placeholder = `mathplaceholder${math.length}x`;
    math.push(match);
    return placeholder;
  });

  let cased = checkTitleCase(masked).corrected;
  for (let index = 0; index < math.length; index++) {
    cased = cased.replace(
      new RegExp(`mathplaceholder${index}x`, "gi"),
      math[index],
    );
  }
  return cased;
}

function contextsIn(body: string): Context[] {
  const contexts: Context[] = [];
  let offset = 0;

  for (const line of body.split("\n")) {
    const heading = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (heading) {
      const text = plainText(heading[2]);
      if (text) {
        contexts.push({
          position: offset,
          text,
          anchor: headingSlug(text),
        });
      }
    }

    const listItem = /^\s*[-*+]\s+(.+?)\s*$/.exec(line);
    if (listItem) {
      const text = plainText(listItem[1]);
      if (text) contexts.push({ position: offset, text });
    }

    offset += line.length + 1;
  }

  return contexts;
}

function plainText(value: string): string {
  return value
    .replace(/<Aka(?:\s[^>]*)?>[\s\S]*?<\/Aka>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/!?(?:\[([^\]]+)\])\([^)]+\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function headingSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-");
}
function escapeHtml(value: string): string {
  return value.replace(/[&<>\"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
    };
    return entities[character];
  });
}
