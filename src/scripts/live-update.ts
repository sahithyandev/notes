// Dev-only: when dev-reload-lock (../integrations/dev-reload-lock/index.ts)
// decides a docs/**/*.{md,mdx} change is safe to patch in place, it sends
// CONTENT_CHANGED_EVENT with the changed file paths instead of the usual
// full-reload. If one of them is the note currently open, this fetches the
// freshly-rendered page and swaps the article/TOC/title/breadcrumb/sidebar-
// label in place - no white flash, no scroll jump, no live-edit-bar remount.
// Anything else (a component/code change, a new/removed note, a change to
// some other note) still gets Vite's normal full-reload; this script never
// intercepts those.
import {
  CONTENT_CHANGED_EVENT,
  type ContentChangedData,
} from "../integrations/dev-reload-lock/protocol.ts";
import { initCopyButtons } from "./copy-code.ts";
import { bindImages } from "./image-zoom.ts";
import { initTocScrollSpy } from "./toc-scroll-spy.ts";

// Astro/Vite dev-serves each component's own script as its own ES module
// URL (e.g. ".../walkthrough.astro?astro&type=script..."), and the browser
// only ever runs a module's top-level code once per URL - a second <script>
// tag pointing at an already-loaded URL is a no-op. These are the
// illustration scripts embedded directly in the article's own rendered
// markup (copy-code/image-zoom/TOC are page-level scripts, handled
// separately above, not found by this scan). A cache-busting query param
// forces a genuinely fresh module instance, which re-runs its top-level
// `document.querySelectorAll(...).forEach(init...)` sweep - safe to do
// broadly since every one of these follows that same idiom (see
// walkthrough.astro, flow-diagram.astro, sensitivity-rhs-slider.astro, ...):
// it only ever touches elements that exist in the document right now, and
// the ones from before this swap are already gone.
async function reExecuteScripts(root: ParentNode): Promise<void> {
  const scripts = [...root.querySelectorAll("script")];
  for (const old of scripts) {
    const src = old.getAttribute("src");
    if (!src) {
      // No known case in this codebase (every component script here is
      // src-based, not inlined - see CLAUDE.md), but recreate rather than
      // silently skip on the off chance one shows up: a script inserted via
      // DOMParser/innerHTML never executes as-is, inline or not.
      const fresh = document.createElement("script");
      for (const attr of old.attributes) {
        fresh.setAttribute(attr.name, attr.value);
      }
      fresh.textContent = old.textContent;
      old.replaceWith(fresh);
      continue;
    }
    const url = new URL(src, location.href);
    url.searchParams.set("t", Date.now().toString());
    try {
      await import(/* @vite-ignore */ url.href);
    } catch (err) {
      console.error("[live-update] failed to re-run script", src, err);
    }
  }
}

let tocCleanup: (() => void) | null = null;

// Live Edit auto-applies edits with no review pause, so a single feedback
// item can trigger several content changes in quick succession - each one
// calling applyContentUpdate() again before the previous call's fetch has
// resolved. Without a guard, a slow response for change N could land (and
// patch the DOM) after change N+1 already applied, silently reverting the
// page to stale content. Each call is tagged with an incrementing id at the
// start; if a newer call has already started (or finished) by the time an
// older one's fetch resolves, the older one bails before touching the DOM
// instead of clobbering what's already there.
let latestUpdateId = 0;

export async function applyContentUpdate(): Promise<void> {
  const updateId = ++latestUpdateId;
  const res = await fetch(location.pathname + location.search);
  if (!res.ok)
    throw new Error(`fetch ${location.pathname} failed: ${res.status}`);
  const html = await res.text();
  if (updateId !== latestUpdateId) return;
  const nextDoc = new DOMParser().parseFromString(html, "text/html");

  const oldArticle = document.querySelector("article");
  const newArticle = nextDoc.querySelector("article");
  if (!oldArticle || !newArticle) {
    throw new Error("couldn't find <article> in the current or fetched page");
  }
  document.adoptNode(newArticle);
  oldArticle.replaceWith(newArticle);
  await reExecuteScripts(newArticle);
  initCopyButtons(newArticle);
  bindImages(newArticle);

  // TOC: swap the whole rendered block (it's fully derived from headings,
  // nothing in it needs to survive) and always re-run the scroll-spy after,
  // tearing down the previous run's listeners first - see
  // toc-scroll-spy.ts's own comment on why that matters here.
  const oldToc = document.querySelector(".right-sidebar .toc-container");
  const newToc = nextDoc.querySelector(".right-sidebar .toc-container");
  const tocHost = document.querySelector(".right-sidebar");
  tocCleanup?.();
  tocCleanup = null;
  if (newToc) document.adoptNode(newToc);
  if (oldToc && newToc) {
    oldToc.replaceWith(newToc);
  } else if (oldToc && !newToc) {
    oldToc.remove();
  } else if (!oldToc && newToc && tocHost) {
    tocHost.prepend(newToc);
  }
  if (newToc) tocCleanup = initTocScrollSpy();

  // Bits outside <article> that are still derived from this note's own
  // frontmatter/headings - a text-only sync, not a subtree swap, so none of
  // the sidebar's own collapse/expand state or scroll position is disturbed.
  document.title = nextDoc.title;
  const oldH1 = document.querySelector(".note-title");
  const newH1 = nextDoc.querySelector(".note-title");
  if (oldH1 && newH1) oldH1.textContent = newH1.textContent;

  const oldCrumb = document.querySelector(".breadcrumb-current");
  const newCrumb = nextDoc.querySelector(".breadcrumb-current");
  if (oldCrumb && newCrumb) oldCrumb.textContent = newCrumb.textContent;

  const activeSidebarItem = document.querySelector(".sb-item-sub.active");
  const newActiveSidebarItem = nextDoc.querySelector(".sb-item-sub.active");
  if (activeSidebarItem && newActiveSidebarItem) {
    activeSidebarItem.textContent = newActiveSidebarItem.textContent;
  }
}

// Extracted out of init()'s hot.on() callback so it can be exercised
// directly in tests without needing a real import.meta.hot.
export function handleContentChangedEvent(): void {
  applyContentUpdate().catch((err) => {
    // Whatever went wrong (network error, the page's shape not matching
    // what this script expects, ...), a real reload is always correct -
    // never leave the page showing stale content just to avoid one.
    console.error(
      "[live-update] optimistic update failed, falling back to a full reload:",
      err,
    );
    location.reload();
  });
}

function init(): void {
  if (!import.meta.hot) return;
  const filePath = document.getElementById("live-edit-selection")?.dataset
    .filePath;
  if (!filePath) return;

  import.meta.hot.on(CONTENT_CHANGED_EVENT, (data: ContentChangedData) => {
    if (!data.files.includes(filePath)) return;
    handleContentChangedEvent();
  });
}

init();
