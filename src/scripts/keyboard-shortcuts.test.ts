import { test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

let resolveShortcut: typeof import("./keyboard-shortcuts").resolveShortcut;

beforeAll(async () => {
  await GlobalRegistrator.register();
  ({ resolveShortcut } = await import("./keyboard-shortcuts"));
});

afterAll(async () => {
  await GlobalRegistrator.unregister();
});

beforeEach(() => {
  document.documentElement.classList.remove("study-mode");
  document.body.innerHTML = `
    <a class="note-nav-btn left" href="/a"></a>
    <a class="note-nav-btn right" href="/b"></a>
    <button id="study-toggle"></button>
    <button id="study-zoom-out"></button>
    <button id="study-zoom-in"></button>
    <input id="field" />
    <div id="plain"></div>
    <pre id="code"></pre>`;
});

function press(key: string, init: KeyboardEventInit = {}, targetId = "plain") {
  const target = document.getElementById(targetId)!;
  const e = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  Object.defineProperty(e, "target", { value: target });
  return resolveShortcut(e);
}

test("maps each key to its action", () => {
  expect(press("/")).toBe("search");
  expect(press("t")).toBe("theme");
  expect(press("?", { shiftKey: true })).toBe("help");
  expect(press("ArrowLeft")).toBe("prev");
  expect(press("ArrowRight")).toBe("next");
});

test("f toggles study mode only when the toggle exists", () => {
  expect(press("f")).toBe("study");
  document.getElementById("study-toggle")!.remove();
  expect(press("f")).toBeNull();
});

test("plus and minus zoom only in study mode", () => {
  expect(press("+")).toBeNull();
  expect(press("-")).toBeNull();

  document.documentElement.classList.add("study-mode");
  expect(press("+")).toBe("zoomIn");
  expect(press("-")).toBe("zoomOut");
});

test("ignored while typing in an input", () => {
  expect(press("t", {}, "field")).toBeNull();
  expect(press("/", {}, "field")).toBeNull();
});

test("ignored with Ctrl or Meta held", () => {
  expect(press("t", { ctrlKey: true })).toBeNull();
  expect(press("/", { metaKey: true })).toBeNull();
});

test("ignored when default was prevented", () => {
  const e = new KeyboardEvent("keydown", {
    key: "ArrowLeft",
    cancelable: true,
  });
  e.preventDefault();
  Object.defineProperty(e, "target", {
    value: document.getElementById("plain"),
  });
  expect(resolveShortcut(e)).toBeNull();
});

test("ignored while a dialog is open", () => {
  document.body.insertAdjacentHTML("beforeend", "<dialog open></dialog>");
  expect(press("t")).toBeNull();
});

test("arrows ignored on scrollable code and when no nav link exists", () => {
  expect(press("ArrowLeft", {}, "code")).toBeNull();
  document.querySelectorAll(".note-nav-btn").forEach((el) => el.remove());
  expect(press("ArrowLeft")).toBeNull();
  expect(press("ArrowRight")).toBeNull();
});
