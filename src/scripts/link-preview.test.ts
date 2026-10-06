// link-preview.ts's pure helpers need a DOM (DOMParser, cloneNode), so
// GlobalRegistrator (happy-dom) is registered around just this file, same as
// live-update.test.ts.
import { test, expect, beforeAll, afterAll } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

beforeAll(async () => {
  await GlobalRegistrator.register();
});

afterAll(async () => {
  await GlobalRegistrator.unregister();
});

type Mod = typeof import("./link-preview.ts");
let parseNoteHref: Mod["parseNoteHref"];
let extractPreview: Mod["extractPreview"];

beforeAll(async () => {
  const mod = await import("./link-preview.ts");
  parseNoteHref = mod.parseNoteHref;
  extractPreview = mod.extractPreview;
});

const ORIGIN = "https://notes.example";
const HERE = "/s5/numerical-methods/jacobian-matrix";

function parse(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

const PAGE = `
<h1 class="note-title">Gaussian Elimination</h1>
<article>
  <p id="p1">Intro one with <a href="/s1/x/y">a link</a> and $x$.</p>
  <p>Intro two.</p>
  <p>Intro three.</p>
  <h2 id="partial-pivoting">Partial Pivoting</h2>
  <script>1</script>
  <p id="pp">Pivot text.</p>
  <figure><img src="a.png" /></figure>
  <ul><li>item</li></ul>
  <p>Too far.</p>
  <h2 id="back-substitution">Back Substitution</h2>
  <p>Back text.</p>
</article>`;

test("parseNoteHref accepts note links and anchors", () => {
  expect(
    parseNoteHref("/s5/numerical-methods/gaussian-elimination", HERE, ORIGIN),
  ).toEqual({ path: "/s5/numerical-methods/gaussian-elimination", hash: "" });
  expect(
    parseNoteHref(
      "/s5/numerical-methods/gaussian-elimination#pivot",
      HERE,
      ORIGIN,
    ),
  ).toEqual({
    path: "/s5/numerical-methods/gaussian-elimination",
    hash: "pivot",
  });
  expect(parseNoteHref("#example", HERE, ORIGIN)).toEqual({
    path: HERE,
    hash: "example",
  });
});

test("parseNoteHref rejects external, og, api and file links", () => {
  expect(parseNoteHref("https://example.com/s1/a/b", HERE, ORIGIN)).toBeNull();
  expect(parseNoteHref("/og/s1/a/b.jpg", HERE, ORIGIN)).toBeNull();
  expect(parseNoteHref("/api/votes", HERE, ORIGIN)).toBeNull();
  expect(parseNoteHref("/s1/a/images/x.png", HERE, ORIGIN)).toBeNull();
  expect(parseNoteHref("/s5/numerical-methods", HERE, ORIGIN)).toBeNull();
});

test("extractPreview returns the first 2 intro blocks", () => {
  const p = extractPreview(parse(PAGE), "")!;
  expect(p.title).toBe("Gaussian Elimination");
  expect(p.sectionTitle).toBeUndefined();
  expect(p.bodyNodes.map((n) => n.textContent)).toEqual([
    "Intro one with a link and $x$.",
    "Intro two.",
  ]);
});

test("extractPreview returns a section and stops at the next heading", () => {
  const p = extractPreview(parse(PAGE), "partial-pivoting")!;
  expect(p.sectionTitle).toBe("Partial Pivoting");
  expect(p.bodyNodes.map((n) => n.tagName)).toEqual(["P", "UL"]);
  expect(p.bodyNodes[0].textContent).toBe("Pivot text.");
});

test("extractPreview falls back to the intro for an unknown anchor", () => {
  const p = extractPreview(parse(PAGE), "nope")!;
  expect(p.sectionTitle).toBeUndefined();
  expect(p.bodyNodes[0].textContent).toContain("Intro one");
});

test("extractPreview strips ids and turns links into spans", () => {
  const p = extractPreview(parse(PAGE), "")!;
  expect(p.bodyNodes[0].hasAttribute("id")).toBe(false);
  expect(p.bodyNodes[0].querySelector("a")).toBeNull();
  expect(p.bodyNodes[0].querySelector("span")?.textContent).toBe("a link");
});

test("extractPreview returns null without a title or article", () => {
  expect(extractPreview(parse("<p>hi</p>"), "")).toBeNull();
});
