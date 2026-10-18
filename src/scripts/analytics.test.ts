import { test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

let mod: typeof import("./analytics");
let calls: unknown[][] = [];

beforeAll(async () => {
  await GlobalRegistrator.register({ url: "https://example.com/a" });
  mod = await import("./analytics");
});

afterAll(async () => {
  await GlobalRegistrator.unregister();
});

beforeEach(() => {
  calls = [];
  (window as any).stonks = { event: (...args: unknown[]) => calls.push(args) };
});

const el = (html: string, selector: string) => {
  document.body.innerHTML = html;
  return document.querySelector(selector)!;
};

test("durationBucket", () => {
  expect(mod.durationBucket(5_000)).toBe("<30s");
  expect(mod.durationBucket(30_000)).toBe("30s-2m");
  expect(mod.durationBucket(120_000)).toBe("2-5m");
  expect(mod.durationBucket(300_000)).toBe("5-15m");
  expect(mod.durationBucket(900_000)).toBe("15m+");
});

test("navSource classifies note links", () => {
  expect(
    mod.navSource(
      el(`<a class="note-nav-btn left" href="/a"><b>x</b></a>`, "b"),
    ),
  ).toBe("prev");
  expect(
    mod.navSource(el(`<a class="note-nav-btn right" href="/a">x</a>`, "a")),
  ).toBe("next");
  expect(mod.navSource(el(`<a class="sb-item-sub" href="/a">x</a>`, "a"))).toBe(
    "sidebar",
  );
  expect(
    mod.navSource(el(`<aside class="prereqs"><a href="/a">x</a></aside>`, "a")),
  ).toBe("prereq");
  expect(
    mod.navSource(el(`<article><a href="/a/b">x</a></article>`, "a")),
  ).toBe("inline_link");
  expect(
    mod.navSource(el(`<article><a href="https://x.com">x</a></article>`, "a")),
  ).toBeNull();
  expect(mod.navSource(el(`<p>x</p>`, "p"))).toBeNull();
});

test("track forwards to stonks and swallows errors", () => {
  mod.track("a");
  mod.track("b", { k: 1 });
  mod.track("c", "/p", { k: 2 });
  expect(calls).toEqual([["a"], ["b", { k: 1 }], ["c", "/p", { k: 2 }]]);
  (window as any).stonks = {
    event: () => {
      throw new Error("boom");
    },
  };
  expect(() => mod.track("d")).not.toThrow();
});

test("trackOnce dedupes until initAnalytics resets", () => {
  mod.initAnalytics();
  mod.trackOnce("k", "e");
  mod.trackOnce("k", "e");
  expect(calls.length).toBe(1);
  mod.initAnalytics();
  mod.trackOnce("k", "e");
  expect(calls.length).toBe(2);
});

test("clicks on a note link emit note_nav with source and path", () => {
  mod.initAnalytics();
  const link = el(`<a class="note-nav-btn right" href="/s1/m/next">x</a>`, "a");
  link.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(calls).toEqual([["note_nav", "/s1/m/next", { source: "next" }]]);
});
