// Native scroll restoration only restores the document's own scroll
// position. On note pages the document never scrolls: `main > section` is
// the actual scroller for the article, and the left sidebar / mobile TOC
// drawer each scroll independently. This module restores all three by
// hand, keyed on the current path, and keeps them updated as the user
// scrolls.

type Scroller = {
  key: "main" | "sidebar" | "toc";
  el: Element | null;
};

const STORAGE_PREFIX = "sn-scroll:";
const SIDEBAR_SHARED_KEY = "sn-scroll:sidebar";
const SETTLE_MS = 1500;

function readJson<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore (private mode, quota, etc.)
  }
}

function writeRaw(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function readRaw(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function initScrollRestoration() {
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  const scrollers: Scroller[] = [
    { key: "main", el: document.querySelector("main > section") },
    { key: "sidebar", el: document.querySelector(".sidebar") },
    { key: "toc", el: document.querySelector(".right-sidebar") },
  ];

  const pathKey = STORAGE_PREFIX + location.pathname;

  const navEntry = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  const navType = navEntry?.type ?? "navigate";

  // ── Save positions as the user scrolls ──────────────────────────
  let saveScheduled = false;
  function savePositions() {
    const positions: Record<string, number> = {};
    for (const s of scrollers) {
      if (s.el) positions[s.key] = s.el.scrollTop;
    }
    writeJson(pathKey, positions);
    if (typeof positions.sidebar === "number") {
      writeRaw(SIDEBAR_SHARED_KEY, String(positions.sidebar));
    }
  }
  function scheduleSave() {
    if (saveScheduled) return;
    saveScheduled = true;
    requestAnimationFrame(() => {
      saveScheduled = false;
      savePositions();
    });
  }

  for (const s of scrollers) {
    s.el?.addEventListener("scroll", scheduleSave, { passive: true });
  }
  window.addEventListener("pagehide", savePositions);

  // ── Restore positions ────────────────────────────────────────────
  function applyInstant(el: Element, top: number) {
    el.scrollTo({ top, behavior: "instant" });
  }

  function restoreExact() {
    const saved = readJson<Record<string, number>>(pathKey);
    if (!saved) return false;
    let applied = false;
    for (const s of scrollers) {
      const top = saved[s.key];
      if (s.el && typeof top === "number") {
        applyInstant(s.el, top);
        applied = true;
      }
    }
    return applied;
  }

  function restoreSidebarFallback() {
    const sidebar = scrollers.find((s) => s.key === "sidebar")?.el;
    if (!sidebar) return;

    const sharedTop = readRaw(SIDEBAR_SHARED_KEY);
    if (sharedTop !== null) {
      applyInstant(sidebar, Number(sharedTop));
    }

    const activeItem = sidebar.querySelector(".sb-item-sub.active");
    if (!activeItem) return;

    const sidebarRect = sidebar.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();
    const isVisible =
      itemRect.top >= sidebarRect.top && itemRect.bottom <= sidebarRect.bottom;
    if (!isVisible) {
      activeItem.scrollIntoView({ block: "center" });
    }
  }

  if (navType === "reload" || navType === "back_forward") {
    const restored = restoreExact();
    if (!restored) restoreSidebarFallback();
  } else {
    // Fresh navigation: keep main content at the top (or wherever a
    // #hash lands it), but carry the sidebar scroll position over so the
    // module tree doesn't jump around between sibling notes.
    restoreSidebarFallback();
  }

  // ── Re-apply once late layout (images, KaTeX, illustrations) settles ──
  const mainScroller = scrollers.find((s) => s.key === "main")?.el;
  const article = document.querySelector("article");
  if (
    mainScroller &&
    article &&
    (navType === "reload" || navType === "back_forward")
  ) {
    let userScrolled = false;
    const stopSettling = () => {
      userScrolled = true;
    };
    const settleEvents: (keyof WindowEventMap)[] = [
      "wheel",
      "touchstart",
      "keydown",
      "pointerdown",
    ];
    settleEvents.forEach((evt) =>
      mainScroller.addEventListener(evt, stopSettling, {
        passive: true,
        once: true,
      }),
    );

    const reapply = () => {
      if (userScrolled) return;
      const saved = readJson<Record<string, number>>(pathKey);
      const top = saved?.main;
      if (typeof top === "number") applyInstant(mainScroller, top);
    };

    window.addEventListener("load", reapply, { once: true });

    const ro = new ResizeObserver(() => {
      if (!userScrolled) reapply();
    });
    ro.observe(article);
    setTimeout(() => {
      ro.disconnect();
      settleEvents.forEach((evt) =>
        mainScroller.removeEventListener(evt, stopSettling),
      );
    }, SETTLE_MS);
  }
}

initScrollRestoration();
