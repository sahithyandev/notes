// Backstop for the caption rule in lib/caption.ts. `astro check` enforces the
// `caption` / `captionSlot` props of Panel and AxesFigure, but it cannot see a
// hand-written <figure>, or a figcaption hidden behind a falsy prop, so this
// scans the sources for both.
import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = import.meta.dir;
const files = readdirSync(dir).filter((f) => f.endsWith(".astro"));

// Returns the opening tag starting at `start`, skipping over `{...}` and quotes
// so a `>` inside an attribute expression does not end it early.
function openingTag(src: string, start: number) {
  let depth = 0;
  let quote = "";
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === quote) quote = "";
    } else if (c === '"' || c === "'" || (c === "`" && depth > 0)) {
      quote = c;
    } else if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === ">" && depth === 0) return src.slice(start, i + 1);
  }
  return src.slice(start);
}

test("illustrations that render a <figure> also render a <figcaption>", () => {
  const missing = files.filter((f) => {
    const src = readFileSync(join(dir, f), "utf8");
    return src.includes("<figure") && !/<figcaption|<FigureCaption/.test(src);
  });
  expect(missing).toEqual([]);
});

test("every Panel and AxesFigure gets a caption", () => {
  const missing: string[] = [];
  for (const f of files) {
    const src = readFileSync(join(dir, f), "utf8");
    for (const m of src.matchAll(/<(Panel|AxesFigure)\b/g)) {
      const tag = openingTag(src, m.index);
      if (!/\bcaption(Slot)?\b/.test(tag)) missing.push(`${f}: <${m[1]}>`);
    }
  }
  expect(missing).toEqual([]);
});
