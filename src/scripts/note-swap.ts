// Soft navigation between note pages (production and dev). Clicking a prev/next button
// or a sidebar note link (or pressing the left/right arrow shortcut) fetches
// the target page and swaps the note content in place, inside a view
// transition, instead of doing a full page load. The nav bar, sidebar and
// every page-level listener stay alive.
//
// Anything this can't swap safely falls back to a normal navigation, decided
// before the DOM is touched: a target that isn't a note, a different sidebar,
// a script it doesn't know how to run, or any error along the way.
//
// Scripts. In the production build nothing script-related lives inside the
// article: component scripts are hoisted into the page as inline or external
// module scripts. They fall into 3 groups:
//  - illustration scripts, tagged with SCRIPT_MARKER by the
//    `illustration-script-marker` Vite plugin (astro.config.mjs). Each one
//    sweeps the document for its own elements when it runs, so they are
//    simply run again after a swap (they are the only ones that may be new).
//  - the per-page `note_view` analytics snippet, replaced by a direct call.
//  - everything else (nav, search, drawers, ...) is page-level and already
//    running. These are matched by fingerprint against what the document has
//    run so far; an unknown one means the target needs something this page
//    doesn't have, so it falls back.
import { initCopyButtons } from "./copy-code.ts";
import { bindImages } from "./image-zoom.ts";
import { initTocScrollSpy } from "./toc-scroll-spy.ts";
import { initNoteFeedback } from "./note-feedback.ts";
import { initRelativeTime } from "./relative-time.ts";

// Built from parts on purpose: a plain literal would be folded back into the
// full marker text, which would then tag this file's own bundle as an
// illustration script.
export const SCRIPT_MARKER = ["__sn", "illus"].join("_");

const NOTE_LINK = "a.note-nav-btn, a.sb-item-sub";
const HEAD_SELECTOR = [
  'meta[name="description"]',
  'link[rel="canonical"]',
  'meta[property^="og:"]',
  'meta[name^="twitter:"]',
  'script[type="application/ld+json"]',
].join(", ");

type ScriptRun =
  { kind: "inline"; text: string } | { kind: "external"; src: string };

export type ScriptPlan = {
  supported: boolean;
  runs: ScriptRun[];
};

// Identity of a script across pages. The dev server serves several scripts
// of one .astro file from the same path, told apart only by their query, so
// the query counts too (minus Vite's volatile `t` timestamp).
export function fingerprint(script: HTMLScriptElement): string {
  const src = script.getAttribute("src");
  if (!src) return "text:" + (script.textContent ?? "");
  const url = new URL(src, location.href);
  // Edited as a string: URLSearchParams would rewrite Vite's valueless
  // `?astro&type=script` params as `astro=&type=script`.
  const query = url.search
    .replace(/([?&])t=[^&]*&?/, "$1")
    .replace(/[?&]$/, "");
  return "src:" + url.pathname + query;
}

// Decides what to do with every script of the fetched page. `readExternal`
// returns the source of an external script (to look for the marker).
export async function planScripts(
  nextDoc: Document,
  seen: ReadonlySet<string>,
  readExternal: (src: string) => Promise<string>,
): Promise<ScriptPlan> {
  const runs: ScriptRun[] = [];
  for (const script of nextDoc.querySelectorAll("script")) {
    const type = script.getAttribute("type");
    if (type && type !== "module") continue;
    const src = script.getAttribute("src");
    const text = script.textContent ?? "";
    if (!src && text.includes("note_view")) continue;
    let marked: boolean;
    if (src) {
      const abs = new URL(src, location.href);
      if (abs.origin !== location.origin) {
        // Third-party scripts (analytics) are page-level.
        if (seen.has(fingerprint(script))) continue;
        return { supported: false, runs };
      }
      marked = (await readExternal(abs.href)).includes(SCRIPT_MARKER);
    } else {
      marked = text.includes(SCRIPT_MARKER);
    }
    if (marked) {
      runs.push(
        src
          ? { kind: "external", src: new URL(src, location.href).href }
          : { kind: "inline", text },
      );
      continue;
    }
    if (!seen.has(fingerprint(script))) return { supported: false, runs };
  }
  return { supported: true, runs };
}

export function sidebarShape(doc: ParentNode): string {
  return [...doc.querySelectorAll(".sidebar a")]
    .map((a) => a.getAttribute("href"))
    .join("|");
}

async function runScripts(runs: ScriptRun[]): Promise<void> {
  for (const run of runs) {
    try {
      if (run.kind === "external") {
        // A fresh query makes the browser run the module again. Appended as
        // a string for the same reason as in fingerprint().
        const bust = (run.src.includes("?") ? "&" : "?") + "t=" + Date.now();
        await import(/* @vite-ignore */ run.src + bust);
      } else {
        const el = document.createElement("script");
        el.type = "module";
        el.textContent = run.text;
        document.body.append(el);
        el.remove();
      }
    } catch (err) {
      console.error("[note-swap] failed to run script", err);
    }
  }
}

function syncHead(nextDoc: Document): void {
  document.title = nextDoc.title;
  document.head.querySelectorAll(HEAD_SELECTOR).forEach((el) => el.remove());
  nextDoc.head.querySelectorAll(HEAD_SELECTOR).forEach((el) => {
    document.head.append(document.importNode(el, true));
  });
}

function swapChildren(target: Element, source: Element): void {
  document.adoptNode(source);
  target.replaceChildren(...Array.from(source.childNodes));
}

function applyDocument(nextDoc: Document, url: URL): void {
  const main = document.querySelector("main")!;
  const nextMain = nextDoc.querySelector("main")!;
  for (const attr of ["style", "data-note-file-path"]) {
    const value = nextMain.getAttribute(attr);
    if (value === null) main.removeAttribute(attr);
    else main.setAttribute(attr, value);
  }

  const section = document.querySelector("main > section")!;
  swapChildren(section, nextDoc.querySelector("main > section")!);

  const rightSidebar = document.querySelector(".right-sidebar");
  const nextRight = nextDoc.querySelector(".right-sidebar");
  if (rightSidebar && nextRight) swapChildren(rightSidebar, nextRight);

  // Same links in the same order (checked up front), so only the active
  // markers differ. Syncing classes keeps the sidebar's scroll position.
  const links = document.querySelectorAll(".sidebar a");
  const nextLinks = nextDoc.querySelectorAll(".sidebar a");
  links.forEach((a, i) => {
    const cls = nextLinks[i].getAttribute("class");
    if (cls === null) a.removeAttribute("class");
    else a.setAttribute("class", cls);
  });
  document
    .querySelector(".sidebar .sb-item-sub.active")
    ?.scrollIntoView({ block: "nearest" });

  syncHead(nextDoc);

  section.scrollTo({ top: 0, behavior: "instant" });
  rightSidebar?.scrollTo({ top: 0, behavior: "instant" });
  if (url.hash)
    document
      .getElementById(decodeURIComponent(url.hash.slice(1)))
      ?.scrollIntoView();

  initCopyButtons(section);
  bindImages(section);
  initNoteFeedback();
  initRelativeTime();
  initTocScrollSpy();

  const slug = url.pathname.replace(/^\/|\/$/g, "");
  const parts = slug.split("/");
  window.stonks?.event("note_view", "/" + slug, {
    semester: parts[0] ?? "",
    module: parts[1] ?? "",
  });
}

// Returns false when the page can't be swapped and the caller should do a
// normal navigation instead.
function checkSwappable(nextDoc: Document): boolean {
  if (!nextDoc.querySelector("main[data-note-file-path] > section")) {
    return false;
  }
  if (!document.querySelector("main > section")) return false;
  if (sidebarShape(document) !== sidebarShape(nextDoc)) return false;
  // The mobile TOC button only exists for notes that have headings.
  if (
    !!document.getElementById("open-toc") !==
    !!nextDoc.getElementById("open-toc")
  ) {
    return false;
  }
  return true;
}

const seen = new Set<string>();
let currentPath = "";
let navId = 0;

async function readExternal(src: string): Promise<string> {
  const res = await fetch(src, { cache: "force-cache" });
  if (!res.ok) throw new Error(`fetch ${src} failed: ${res.status}`);
  return res.text();
}

export async function softNavigate(url: URL, push: boolean): Promise<boolean> {
  const id = ++navId;
  try {
    const res = await fetch(url.pathname + url.search);
    if (!res.ok) return false;
    const html = await res.text();
    const nextDoc = new DOMParser().parseFromString(html, "text/html");
    if (!checkSwappable(nextDoc)) return false;
    const plan = await planScripts(nextDoc, seen, readExternal);
    if (!plan.supported) return false;
    // A newer navigation started while this one was loading.
    if (id !== navId) return true;

    const update = async () => {
      if (push) history.pushState({}, "", url);
      currentPath = url.pathname;
      applyDocument(nextDoc, url);
      await runScripts(plan.runs);
    };
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (document.startViewTransition && !reduce) {
      await document.startViewTransition(update).updateCallbackDone;
    } else {
      await update();
    }
    return true;
  } catch (err) {
    console.error("[note-swap] falling back to a full navigation:", err);
    return false;
  }
}

function go(url: URL, push: boolean): void {
  softNavigate(url, push).then((ok) => {
    if (ok) return;
    if (push) location.href = url.href;
    else location.reload();
  });
}

function init(): void {
  if (!document.querySelector("main[data-note-file-path]")) return;
  currentPath = location.pathname;
  document.querySelectorAll("script").forEach((s) => {
    const type = s.getAttribute("type");
    if (!type || type === "module") seen.add(fingerprint(s));
  });

  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = (e.target as Element | null)?.closest?.<HTMLAnchorElement>(
      NOTE_LINK,
    );
    if (!link || (link.target && link.target !== "_self")) return;
    if (link.hasAttribute("download")) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.pathname === currentPath) return;
    e.preventDefault();
    go(url, true);
  });

  window.addEventListener("popstate", () => {
    if (location.pathname === currentPath) return;
    go(new URL(location.href), false);
  });
}

init();
