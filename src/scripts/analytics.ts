// Thin wrapper over onedollarstats (`window.stonks`, loaded in Layout.astro).
// Analytics must never break the page, so every call is guarded.
type Props = Record<string, unknown>;

export function track(name: string, props?: Props): void;
export function track(name: string, path: string, props?: Props): void;
export function track(
  name: string,
  pathOrProps?: string | Props,
  props?: Props,
): void {
  try {
    if (typeof pathOrProps === "string") {
      window.stonks?.event(name, pathOrProps, props ?? {});
    } else if (pathOrProps) {
      window.stonks?.event(name, pathOrProps);
    } else {
      window.stonks?.event(name);
    }
  } catch {}
}

let seen = new Set<string>();

// Fires at most once per note view; the set resets in initAnalytics().
export function trackOnce(key: string, name: string, props?: Props): void {
  if (seen.has(key)) return;
  seen.add(key);
  track(name, props);
}

export function durationBucket(ms: number): string {
  const s = ms / 1000;
  if (s < 30) return "<30s";
  if (s < 120) return "30s-2m";
  if (s < 300) return "2-5m";
  if (s < 900) return "5-15m";
  return "15m+";
}

// Where a click on a note link came from, or null when it is not one.
export function navSource(el: Element): string | null {
  if (el.closest(".note-nav-btn.left")) return "prev";
  if (el.closest(".note-nav-btn.right")) return "next";
  if (el.closest(".sb-item-sub")) return "sidebar";
  if (el.closest(".prereqs a")) return "prereq";
  if (el.closest("#link-preview a")) return "link_preview";
  const link = el.closest<HTMLAnchorElement>("article a[href]");
  if (link && link.getAttribute("href")?.startsWith("/")) return "inline_link";
  return null;
}

let viewStart = 0;
let readObserver: IntersectionObserver | undefined;

function armReadObserver(): void {
  readObserver?.disconnect();
  readObserver = undefined;
  const end = document.querySelector(".note-feedback");
  if (!end || typeof IntersectionObserver === "undefined") return;
  const start = viewStart;
  readObserver = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    readObserver?.disconnect();
    track("note_read_complete", {
      seconds_bucket: durationBucket(Date.now() - start),
    });
  });
  readObserver.observe(end);
}

function onClick(e: MouseEvent): void {
  const target = e.target instanceof Element ? e.target : null;
  if (!target) return;

  const toc = target.closest<HTMLAnchorElement>(".toc-list a");
  if (toc) return track("toc_click");

  const ai = target.closest<HTMLElement>(".note-action-btn[data-provider]");
  if (ai) return track("ai_open", { provider: ai.dataset.provider });

  const source = navSource(target);
  if (!source) return;
  const link = target.closest<HTMLAnchorElement>("a[href]");
  const path = link ? new URL(link.href, location.href).pathname : undefined;
  if (path) track("note_nav", path, { source });
  else track("note_nav", { source });
}

let bound = false;

// Runs on load and after every soft navigation.
export function initAnalytics(): void {
  seen = new Set();
  viewStart = Date.now();
  armReadObserver();
  if (bound || typeof document === "undefined") return;
  bound = true;
  // Capture phase so note-swap's preventDefault cannot hide the click.
  document.addEventListener("click", onClick, true);
}
