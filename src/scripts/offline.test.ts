import { test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

let mod: typeof import("./offline");

beforeAll(async () => {
  await GlobalRegistrator.register({ url: "https://example.com/s1/a/note" });
  mod = await import("./offline");
});

afterAll(async () => {
  await GlobalRegistrator.unregister();
});

function setOnline(value: boolean) {
  Object.defineProperty(navigator, "onLine", {
    value,
    configurable: true,
  });
}

function mockCaches(entries: Record<string, Response>) {
  (globalThis as any).caches = {
    keys: async () => ["sn-pages-v1"],
    open: async () => ({
      match: async (key: string) => entries[key],
    }),
  };
}

const stamped = (at: number) =>
  new Response("x", { headers: { [mod.AT_HEADER]: String(at) } });

beforeEach(() => {
  setOnline(true);
  document.documentElement.removeAttribute("data-offline");
  document.body.innerHTML = "";
});

test("syncOfflineUi toggles data-offline and disables online-only controls", () => {
  document.body.innerHTML = `<a class="note-action-btn"></a><button class="note-feedback-btn"></button>`;
  setOnline(false);
  mod.syncOfflineUi();
  expect(document.documentElement.hasAttribute("data-offline")).toBe(true);
  expect(
    document.querySelector(".note-action-btn")!.getAttribute("aria-disabled"),
  ).toBe("true");
  expect(
    (document.querySelector(".note-feedback-btn") as HTMLButtonElement)
      .disabled,
  ).toBe(true);

  setOnline(true);
  mod.syncOfflineUi();
  expect(document.documentElement.hasAttribute("data-offline")).toBe(false);
  expect(
    document.querySelector(".note-action-btn")!.hasAttribute("aria-disabled"),
  ).toBe(false);
  expect(
    (document.querySelector(".note-feedback-btn") as HTMLButtonElement)
      .disabled,
  ).toBe(false);
});

test("isFresh expires entries after 30 days", () => {
  const now = Date.now();
  expect(mod.isFresh(stamped(now - 1000), now)).toBe(true);
  expect(mod.isFresh(stamped(now - mod.MAX_AGE_MS - 1), now)).toBe(false);
  expect(mod.isFresh(new Response("x"), now)).toBe(false);
});

test("normalizePath drops trailing slashes but keeps the root", () => {
  expect(mod.normalizePath("/s1/a/")).toBe("/s1/a");
  expect(mod.normalizePath("/")).toBe("/");
});

test("initOfflineStatus reveals the badge for a fresh cached page", async () => {
  document.body.innerHTML = `<span data-offline-badge hidden></span>`;
  mockCaches({ "https://example.com/s1/a/note": stamped(Date.now()) });
  await mod.initOfflineStatus();
  expect(
    (document.querySelector("[data-offline-badge]") as HTMLElement).hidden,
  ).toBe(false);
});

test("initOfflineStatus keeps the badge hidden for an expired cached page", async () => {
  document.body.innerHTML = `<span data-offline-badge hidden></span>`;
  setOnline(false);
  mockCaches({
    "https://example.com/s1/a/note": stamped(Date.now() - mod.MAX_AGE_MS - 1),
  });
  await mod.initOfflineStatus();
  expect(
    (document.querySelector("[data-offline-badge]") as HTMLElement).hidden,
  ).toBe(true);
});

test("the update toast shows and hides", () => {
  document.body.innerHTML = `<div id="sn-update-toast" hidden></div>`;
  const toast = document.getElementById("sn-update-toast")!;
  mod.showUpdateToast();
  expect(toast.hidden).toBe(false);
  mod.hideUpdateToast();
  expect(toast.hidden).toBe(true);
});
