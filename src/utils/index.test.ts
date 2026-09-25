import { test, expect } from "bun:test";
import {
  titleize,
  calculateReadTime,
  generateDescription,
  calculateWordCount,
} from "./index";

test("titleize expands a whole-string abbreviation", () => {
  expect(titleize("iot")).toBe("Internet of Things"); // special-cased, not just uppercased
  expect(titleize("api")).toBe("API");
});

test("titleize capitalizes hyphenated segments and expands per-word abbreviations", () => {
  expect(titleize("data-structures")).toBe("Data Structures");
  expect(titleize("ai-and-machine-learning")).toBe("AI and Machine Learning");
});

test("titleize keeps minor words lowercase except in first position", () => {
  expect(titleize("theory-of-electricity")).toBe("Theory of Electricity");
  expect(titleize("of-mice-and-men")).toBe("Of Mice and Men"); // "of" capitalized only because it's first
});

test("calculateWordCount counts words in a string", () => {
  expect(calculateWordCount("")).toBe(0);
  expect(calculateWordCount("Hello world")).toBe(2);
});

test("calculateWordCount ignores import/export lines and JSX/expression syntax", () => {
  const content = `import Note from "../components/note.astro";

Hello world.

<Note type="tip" title="Careful">
  This is a clarification.
</Note>

<TransportationTable data={someData} />

export const foo = 1;`;
  // "Hello world." (2) + "This is a clarification." (4) = 6
  expect(calculateWordCount(content)).toBe(6);
});

test("calculateWordCount strips heading markers but keeps heading text", () => {
  const content = "## Section Title\n\n### Subsection\n\nBody text.";
  // "Section Title" (2) + "Subsection" (1) + "Body text." (2) = 5
  expect(calculateWordCount(content)).toBe(5);
});

test("calculateReadTime rounds up to the nearest minute", () => {
  expect(calculateReadTime(200)).toBe(1);
  expect(calculateReadTime(201)).toBe(2);
});

test("generateDescription only looks at the first paragraph", () => {
  const content = "# Title\n\nSecond paragraph ignored.";
  expect(generateDescription(content)).toBe("Title"); // "#" stripped, rest of content untouched
});

test("generateDescription strips bold, code, and underscore markers", () => {
  const content = "This is **bold** and `code` and _emphasis_.";
  expect(generateDescription(content)).toBe(
    "This is bold and code and emphasis.",
  );
});

// generateDescription strips `[`/`]` globally before running its link/image
// regexes, so those regexes (which require brackets) never actually match.
// These tests document the current behavior rather than the apparently
// intended one.
test("generateDescription does not actually strip link syntax (brackets are stripped first)", () => {
  const content = "See the [link](https://x.com) for details.";
  expect(generateDescription(content)).toBe(
    "See the link(https://x.com) for details.",
  );
});

test("generateDescription does not actually strip image syntax (brackets are stripped first)", () => {
  const content = "Some text ![alt](./img.png) more text.";
  expect(generateDescription(content)).toBe(
    "Some text !alt(./img.png) more text.",
  );
});

test("generateDescription truncates long paragraphs to 160 chars with an ellipsis", () => {
  const longText = "a".repeat(200);
  const result = generateDescription(longText);
  expect(result.length).toBe(160);
  expect(result.endsWith("...")).toBe(true);
});
