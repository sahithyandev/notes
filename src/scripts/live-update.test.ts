// Dev-only DOM patching (see live-update.ts's own top comment) had no test
// coverage at all before this file, and bun:test runs without a DOM by
// default - GlobalRegistrator (happy-dom) is registered/unregistered around
// just this file's tests (beforeAll/afterAll) rather than wired into every
// test in the repo, so this is the only file that pays for a DOM.
import { test, expect, mock, beforeAll, afterAll, beforeEach } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

// copy-code.ts/image-zoom.ts/toc-scroll-spy.ts are separate concerns with
// their own modules (and, for toc-scroll-spy, their own real DOM
// measurement logic that happy-dom can't meaningfully exercise) - mocked
// out so these tests stay focused on live-update.ts's own orchestration
// (which element gets swapped/removed/inserted, the sequence guard), not
// their internals.
const initCopyButtons = mock(() => {});
const bindImages = mock(() => {});
let tocCleanupSpy = mock(() => {});
const initTocScrollSpy = mock(() => tocCleanupSpy);

mock.module("./copy-code.ts", () => ({ initCopyButtons }));
mock.module("./image-zoom.ts", () => ({ bindImages }));
mock.module("./toc-scroll-spy.ts", () => ({ initTocScrollSpy }));

beforeAll(async () => {
  await GlobalRegistrator.register();
});

afterAll(async () => {
  await GlobalRegistrator.unregister();
});

// Imported after GlobalRegistrator.register() (top-level await in
// beforeAll runs before this file's other module-level code needs `document`
// to exist) - but static imports are hoisted above beforeAll, so instead this
// is a dynamic import resolved once, lazily, from inside the first test.
let applyContentUpdate: typeof import("./live-update.ts").applyContentUpdate;
let handleContentChangedEvent: typeof import("./live-update.ts").handleContentChangedEvent;

beforeAll(async () => {
  const mod = await import("./live-update.ts");
  applyContentUpdate = mod.applyContentUpdate;
  handleContentChangedEvent = mod.handleContentChangedEvent;
});

function pageHtml(opts: {
  title?: string;
  articleHtml?: string;
  tocHtml?: string;
  breadcrumb?: string;
  sidebarLabel?: string;
}): string {
  const {
    title = "A Note",
    articleHtml = "<article><p>content</p></article>",
    tocHtml = "",
    breadcrumb = "A Note",
    sidebarLabel = "A Note",
  } = opts;
  return `<!doctype html><html><head><title>${title}</title></head><body>
    <div class="right-sidebar">${tocHtml}</div>
    <h1 class="note-title">${title}</h1>
    <span class="breadcrumb-current">${breadcrumb}</span>
    <div class="sb-item-sub active">${sidebarLabel}</div>
    ${articleHtml}
  </body></html>`;
}

function setCurrentPage(html: string): void {
  document.open();
  document.write(html);
  document.close();
}

function fakeResponse(html: string, ok = true, status = 200): Response {
  return {
    ok,
    status,
    text: () => Promise.resolve(html),
  } as Response;
}

beforeEach(() => {
  initCopyButtons.mockClear();
  bindImages.mockClear();
  initTocScrollSpy.mockClear();
  tocCleanupSpy = mock(() => {});
  (globalThis as any).fetch = mock(() =>
    Promise.reject(new Error("fetch not stubbed for this test")),
  );
  (globalThis as any).location.reload = mock(() => {});
});

test("swaps the article content in place and re-binds copy/zoom/scripts on it", async () => {
  setCurrentPage(pageHtml({ articleHtml: "<article><p>old</p></article>" }));
  (globalThis as any).fetch = mock(() =>
    Promise.resolve(
      fakeResponse(pageHtml({ articleHtml: "<article><p>new</p></article>" })),
    ),
  );

  await applyContentUpdate();

  const article = document.querySelector("article");
  expect(article?.textContent).toBe("new");
  expect(initCopyButtons).toHaveBeenCalledTimes(1);
  expect(initCopyButtons.mock.calls[0][0]).toBe(article);
  expect(bindImages).toHaveBeenCalledTimes(1);
  expect(bindImages.mock.calls[0][0]).toBe(article);
});

test("TOC branch: replaces an existing toc-container with the fetched one", async () => {
  setCurrentPage(
    pageHtml({ tocHtml: '<nav class="toc-container" data-v="old"></nav>' }),
  );
  (globalThis as any).fetch = mock(() =>
    Promise.resolve(
      fakeResponse(
        pageHtml({
          tocHtml: '<nav class="toc-container" data-v="new"></nav>',
        }),
      ),
    ),
  );

  await applyContentUpdate();

  const tocs = document.querySelectorAll(".right-sidebar .toc-container");
  expect(tocs.length).toBe(1);
  expect(tocs[0].getAttribute("data-v")).toBe("new");
  expect(initTocScrollSpy).toHaveBeenCalledTimes(1);
});

test("TOC branch: removes the toc-container when the fetched page has none", async () => {
  setCurrentPage(pageHtml({ tocHtml: '<nav class="toc-container"></nav>' }));
  (globalThis as any).fetch = mock(() =>
    Promise.resolve(fakeResponse(pageHtml({ tocHtml: "" }))),
  );

  await applyContentUpdate();

  expect(document.querySelector(".right-sidebar .toc-container")).toBeNull();
  expect(initTocScrollSpy).not.toHaveBeenCalled();
});

test("TOC branch: inserts a toc-container when the current page had none", async () => {
  setCurrentPage(pageHtml({ tocHtml: "" }));
  (globalThis as any).fetch = mock(() =>
    Promise.resolve(
      fakeResponse(
        pageHtml({ tocHtml: '<nav class="toc-container" data-v="x"></nav>' }),
      ),
    ),
  );

  await applyContentUpdate();

  const toc = document.querySelector(".right-sidebar .toc-container");
  expect(toc).not.toBeNull();
  expect(toc?.getAttribute("data-v")).toBe("x");
  expect(initTocScrollSpy).toHaveBeenCalledTimes(1);
});

test("tears down the previous TOC scroll-spy run before starting the next one", async () => {
  setCurrentPage(
    pageHtml({ tocHtml: '<nav class="toc-container" data-v="a"></nav>' }),
  );
  (globalThis as any).fetch = mock(() =>
    Promise.resolve(
      fakeResponse(
        pageHtml({ tocHtml: '<nav class="toc-container" data-v="b"></nav>' }),
      ),
    ),
  );
  await applyContentUpdate();
  const firstCleanup = tocCleanupSpy;
  expect(firstCleanup).not.toHaveBeenCalled();

  (globalThis as any).fetch = mock(() =>
    Promise.resolve(
      fakeResponse(
        pageHtml({ tocHtml: '<nav class="toc-container" data-v="c"></nav>' }),
      ),
    ),
  );
  await applyContentUpdate();

  expect(firstCleanup).toHaveBeenCalledTimes(1);
});

test("syncs title, breadcrumb and sidebar-label text without touching other markup", async () => {
  setCurrentPage(
    pageHtml({
      title: "Old Title",
      breadcrumb: "Old Title",
      sidebarLabel: "Old Title",
    }),
  );
  (globalThis as any).fetch = mock(() =>
    Promise.resolve(
      fakeResponse(
        pageHtml({
          title: "New Title",
          breadcrumb: "New Title",
          sidebarLabel: "New Title",
        }),
      ),
    ),
  );

  await applyContentUpdate();

  expect(document.title).toBe("New Title");
  expect(document.querySelector(".note-title")?.textContent).toBe("New Title");
  expect(document.querySelector(".breadcrumb-current")?.textContent).toBe(
    "New Title",
  );
  expect(document.querySelector(".sb-item-sub.active")?.textContent).toBe(
    "New Title",
  );
});

test("falls back to a full reload when the fetch fails", async () => {
  setCurrentPage(pageHtml({}));
  (globalThis as any).fetch = mock(() =>
    Promise.reject(new Error("network down")),
  );

  handleContentChangedEvent();
  // handleContentChangedEvent() is fire-and-forget (mirrors the real
  // import.meta.hot.on() callback, which can't await it either) - let its
  // internal applyContentUpdate().catch() actually run.
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(location.reload).toHaveBeenCalledTimes(1);
});

test("falls back to a full reload when the fetched page has no <article>", async () => {
  setCurrentPage(pageHtml({}));
  (globalThis as any).fetch = mock(() =>
    Promise.resolve(
      fakeResponse(
        `<!doctype html><html><head><title>x</title></head><body>no article here</body></html>`,
      ),
    ),
  );

  handleContentChangedEvent();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(location.reload).toHaveBeenCalledTimes(1);
});

test("a stale in-flight update doesn't clobber a newer one that already applied", async () => {
  setCurrentPage(pageHtml({ articleHtml: "<article><p>old</p></article>" }));

  let resolveFirst!: (res: Response) => void;
  let resolveSecond!: (res: Response) => void;
  const first = new Promise<Response>((r) => (resolveFirst = r));
  const second = new Promise<Response>((r) => (resolveSecond = r));
  let call = 0;
  (globalThis as any).fetch = mock(() => (call++ === 0 ? first : second));

  // Call 1 starts (and its fetch is in flight) before call 2 starts.
  const p1 = applyContentUpdate();
  await Promise.resolve();
  const p2 = applyContentUpdate();

  // Call 2's response lands first and gets applied...
  resolveSecond(
    fakeResponse(pageHtml({ articleHtml: "<article><p>new2</p></article>" })),
  );
  await p2;
  expect(document.querySelector("article")?.textContent).toBe("new2");

  // ...then call 1's slower response finally arrives. Without the sequence
  // guard this would silently revert the page back to "new1".
  resolveFirst(
    fakeResponse(pageHtml({ articleHtml: "<article><p>new1</p></article>" })),
  );
  await p1;

  expect(document.querySelector("article")?.textContent).toBe("new2");
});
