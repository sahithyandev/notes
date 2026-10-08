import { test, expect, beforeAll, afterAll } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

let planScripts: typeof import("./note-swap").planScripts;
let fingerprint: typeof import("./note-swap").fingerprint;
let sidebarShape: typeof import("./note-swap").sidebarShape;

beforeAll(async () => {
  await GlobalRegistrator.register({ url: "https://example.com/a" });
  ({ planScripts, fingerprint, sidebarShape } = await import("./note-swap"));
});

afterAll(async () => {
  await GlobalRegistrator.unregister();
});

const doc = (body: string) =>
  new DOMParser().parseFromString(
    `<html><body>${body}</body></html>`,
    "text/html",
  );
const none = async () => "";

test("runs marked inline scripts and skips already-seen page scripts", async () => {
  const d = doc(
    `<script type="module">pageLevel()</script><script type="module">x();globalThis.__sn_illus=1</script>`,
  );
  const seen = new Set(["text:pageLevel()"]);
  const plan = await planScripts(d, seen, none);
  expect(plan.supported).toBe(true);
  expect(plan.runs).toEqual([
    { kind: "inline", text: "x();globalThis.__sn_illus=1" },
  ]);
});

test("an unknown unmarked script makes the page unsupported", async () => {
  const plan = await planScripts(
    doc(`<script type="module">novel()</script>`),
    new Set(),
    none,
  );
  expect(plan.supported).toBe(false);
});

test("note_view and JSON-LD scripts are ignored", async () => {
  const d = doc(
    `<script>window.stonks.event("note_view")</script><script type="application/ld+json">{}</script>`,
  );
  expect((await planScripts(d, new Set(), none)).supported).toBe(true);
});

test("external scripts are classified by their source", async () => {
  const d = doc(
    `<script type="module" src="/_astro/a.js"></script><script type="module" src="/_astro/b.js"></script>`,
  );
  const read = async (src: string) =>
    src.endsWith("a.js") ? "foo;globalThis.__sn_illus=1" : "bar";
  const seen = new Set(["src:/_astro/b.js"]);
  const plan = await planScripts(d, seen, read);
  expect(plan.supported).toBe(true);
  expect(plan.runs).toEqual([
    { kind: "external", src: "https://example.com/_astro/a.js" },
  ]);
});

test("fingerprint and sidebarShape", () => {
  const d = doc(
    `<script src="/x.js"></script><aside class="sidebar"><a href="/1"></a><a href="/2" class="active"></a></aside>`,
  );
  expect(fingerprint(d.querySelector("script")!)).toBe("src:/x.js");
  expect(sidebarShape(d)).toBe("/1|/2");
});
