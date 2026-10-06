// Wikipedia-style hover preview for internal links inside a note's article.
// Fetches the target note's prerendered HTML, pulls out the title and the
// opening blocks (or the linked section's opening for a `#anchor` link) and
// shows them in the single card rendered by components/note/link-preview.astro.
import { titleize } from "../utils/index";

export interface NoteHref {
  path: string;
  hash: string;
}

export interface Preview {
  title: string;
  sectionTitle?: string;
  bodyNodes: Element[];
}

const NOTE_PATH = /^\/s\d+\/[^/]+\/[^/]+/;
const MAX_BLOCKS = 2;
const BLOCK_TAGS = new Set(["P", "UL", "OL"]);
const HEADING_TAGS = new Set(["H2", "H3", "H4", "H5", "H6"]);
const SHOW_DELAY = 350;
const HIDE_DELAY = 250;
const CACHE_LIMIT = 30;
const GUTTER = 16;
const GAP = 8;

// Resolves a raw href against the current page. Only same-origin note pages
// qualify; a bare `#anchor` resolves to the current page.
export function parseNoteHref(
  href: string,
  currentPath: string,
  origin: string,
): NoteHref | null {
  let url: URL;
  try {
    url = new URL(href, origin + currentPath);
  } catch {
    return null;
  }
  if (url.origin !== origin) return null;
  const path = url.pathname.replace(/\/$/, "");
  if (!NOTE_PATH.test(path)) return null;
  if (/\.[a-z0-9]+$/i.test(path)) return null;
  let hash = url.hash.slice(1);
  try {
    hash = decodeURIComponent(hash);
  } catch {
    // keep the raw hash
  }
  return { path, hash };
}

function sanitize(node: Element): Element {
  const clone = node.cloneNode(true) as Element;
  clone
    .querySelectorAll("script, figure, [data-stage], .copy-btn, img")
    .forEach((el) => el.remove());
  clone.querySelectorAll("a").forEach((a) => {
    const span = clone.ownerDocument.createElement("span");
    span.append(...a.childNodes);
    a.replaceWith(span);
  });
  clone.removeAttribute("id");
  clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
  return clone;
}

function collectBlocks(start: Element | null): Element[] {
  const blocks: Element[] = [];
  for (let el = start; el && blocks.length < MAX_BLOCKS;) {
    if (HEADING_TAGS.has(el.tagName)) break;
    if (BLOCK_TAGS.has(el.tagName)) blocks.push(sanitize(el));
    el = el.nextElementSibling;
  }
  return blocks;
}

export function extractPreview(doc: Document, hash: string): Preview | null {
  const article = doc.querySelector("article");
  const title = doc.querySelector(".note-title")?.textContent?.trim();
  if (!article || !title) return null;

  if (hash) {
    const target = doc.getElementById(hash);
    if (
      target &&
      HEADING_TAGS.has(target.tagName) &&
      article.contains(target)
    ) {
      const bodyNodes = collectBlocks(target.nextElementSibling);
      if (bodyNodes.length > 0) {
        const sectionTitle = target.textContent?.trim() || undefined;
        return { title, sectionTitle, bodyNodes };
      }
    }
  }

  return { title, bodyNodes: collectBlocks(article.firstElementChild) };
}

function init(): void {
  if (typeof document === "undefined" || typeof matchMedia !== "function") {
    return;
  }
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const card = document.getElementById("link-preview");
  if (!card) return;
  const cardLink = card.querySelector<HTMLAnchorElement>(".lp-link")!;
  const moduleEl = card.querySelector<HTMLElement>(".lp-module")!;
  const titleEl = card.querySelector<HTMLElement>(".lp-title")!;
  const sectionEl = card.querySelector<HTMLElement>(".lp-section")!;
  const bodyEl = card.querySelector<HTMLElement>(".lp-body")!;

  const cache = new Map<string, Promise<Document | null>>();
  let showTimer: ReturnType<typeof setTimeout> | undefined;
  let hideTimer: ReturnType<typeof setTimeout> | undefined;
  let token = 0;
  let activeLink: HTMLAnchorElement | null = null;

  function load(path: string): Promise<Document | null> {
    const cached = cache.get(path);
    if (cached) return cached;
    const promise = fetch(path)
      .then((res) => (res.ok ? res.text() : null))
      .then((html) =>
        html ? new DOMParser().parseFromString(html, "text/html") : null,
      )
      .catch(() => null);
    if (!import.meta.env?.DEV) {
      cache.set(path, promise);
      if (cache.size > CACHE_LIMIT) {
        cache.delete(cache.keys().next().value!);
      }
    }
    return promise;
  }

  function hide(): void {
    token++;
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    card!.hidden = true;
    card!.classList.remove("open");
    activeLink?.removeAttribute("aria-describedby");
    activeLink = null;
  }

  function position(link: HTMLAnchorElement): void {
    const rect = link.getClientRects()[0] ?? link.getBoundingClientRect();
    const w = card!.offsetWidth;
    const h = card!.offsetHeight;
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const left = Math.max(GUTTER, Math.min(rect.left, vw - w - GUTTER));
    let top = rect.bottom + GAP;
    if (top + h > vh - GUTTER && rect.top - GAP - h >= GUTTER) {
      top = rect.top - GAP - h;
    }
    card!.style.left = `${left}px`;
    card!.style.top = `${top}px`;
  }

  async function show(link: HTMLAnchorElement): Promise<void> {
    const raw = link.getAttribute("href");
    if (!raw) return;
    const parsed = parseNoteHref(raw, location.pathname, location.origin);
    if (!parsed) return;
    const current = location.pathname.replace(/\/$/, "");
    if (parsed.path === current && !parsed.hash) return;

    const myToken = ++token;
    const doc = parsed.path === current ? document : await load(parsed.path);
    if (myToken !== token || !doc) return;
    const preview = extractPreview(doc, parsed.hash);
    if (!preview) return;

    const parts = parsed.path.split("/").filter(Boolean);
    const sem = parts[0].match(/^s(\d)$/)?.[1] ?? "1";
    card!.style.setProperty("--lp-accent", `var(--s${sem})`);
    moduleEl.textContent = titleize(parts[1]);
    titleEl.textContent = preview.title;
    sectionEl.textContent = preview.sectionTitle ?? "";
    sectionEl.hidden = !preview.sectionTitle;
    bodyEl.replaceChildren(...preview.bodyNodes);
    cardLink.href = raw;

    card!.hidden = false;
    card!.classList.remove("open");
    bodyEl.toggleAttribute(
      "data-clipped",
      bodyEl.scrollHeight > bodyEl.clientHeight + 1,
    );
    position(link);
    activeLink?.removeAttribute("aria-describedby");
    activeLink = link;
    link.setAttribute("aria-describedby", card!.id);
    requestAnimationFrame(() => card!.classList.add("open"));
  }

  function scheduleShow(link: HTMLAnchorElement, delay: number): void {
    clearTimeout(hideTimer);
    if (link === activeLink && !card!.hidden) return;
    clearTimeout(showTimer);
    showTimer = setTimeout(() => void show(link), delay);
  }

  function scheduleHide(): void {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, HIDE_DELAY);
  }

  const linkOf = (t: EventTarget | null) =>
    t instanceof Element
      ? t.closest<HTMLAnchorElement>("article a[href]")
      : null;
  const inCard = (t: EventTarget | null) =>
    t instanceof Node && card!.contains(t);

  document.addEventListener("pointerover", (e) => {
    if (inCard(e.target)) return clearTimeout(hideTimer);
    const link = linkOf(e.target);
    if (link) scheduleShow(link, SHOW_DELAY);
  });
  document.addEventListener("pointerout", (e) => {
    const leaving = inCard(e.target) || linkOf(e.target);
    if (!leaving) return;
    const to = e.relatedTarget;
    if (inCard(to)) return;
    const next = linkOf(to);
    if (next && next === linkOf(e.target)) return;
    scheduleHide();
  });
  document.addEventListener("focusin", (e) => {
    const link = linkOf(e.target);
    if (link?.matches(":focus-visible")) scheduleShow(link, 0);
  });
  document.addEventListener("focusout", (e) => {
    if (linkOf(e.target)) scheduleHide();
  });
  document.addEventListener(
    "scroll",
    (e) => {
      if (!card!.hidden && !inCard(e.target)) hide();
    },
    { capture: true, passive: true },
  );
  window.addEventListener("resize", hide);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hide();
  });
}

init();
