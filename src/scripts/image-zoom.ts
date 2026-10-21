import { track } from "./analytics.ts";

type VTDocument = Document & {
  startViewTransition?: (cb: () => void) => { finished: Promise<void> };
};

const dialog = document.getElementById(
  "image-zoom",
) as HTMLDialogElement | null;
const zoomImg = document.getElementById(
  "image-zoom-img",
) as HTMLImageElement | null;
const zoomBox = document.getElementById("image-zoom-svg") as HTMLElement | null;
const caption = document.getElementById(
  "image-zoom-caption",
) as HTMLElement | null;
const closeBtn = document.getElementById("image-zoom-close");
const root = document.documentElement;
const doc = document as VTDocument;

type Zoomable = HTMLImageElement | SVGSVGElement;

let activeImg: Zoomable | null = null;

const figcaptionFor = (img: Zoomable) =>
  img.closest("figure")?.querySelector<HTMLElement>("figcaption") ?? null;

// An SVG is dimmed rather than hidden: its markers and gradients stay
// referenced by the clone in the dialog, and `visibility` would inherit into
// them and blank the arrowheads.
const hideEl = (el: Zoomable) => {
  if (el instanceof SVGElement) el.style.opacity = "0";
  else el.style.visibility = "hidden";
};

const showEl = (el: Zoomable) => {
  if (el instanceof SVGElement) el.style.opacity = "";
  else el.style.visibility = "";
};

// The thing in the dialog that morphs with the original.
const targetFor = (el: Zoomable): HTMLElement =>
  el instanceof SVGElement ? zoomBox! : zoomImg!;

// Clones the whole figure so the diagram's scoped, ancestor-based styles still
// apply, minus the caption, which the dialog shows on its own.
const fillBox = (svg: SVGSVGElement) => {
  const copy = svg.closest("figure")!.cloneNode(true) as HTMLElement;
  copy.querySelectorAll("figcaption").forEach((c) => c.remove());
  zoomBox!.replaceChildren(copy);
};

// Tone colours are scoped to `.axes-figure`, which the dialog caption is not
// inside, so the resolved colour is copied across from the in-page caption.
const copyToneColors = (fig: HTMLElement, dest: HTMLElement) => {
  const src = fig.querySelectorAll<HTMLElement>('[class*="tone-"]');
  const copy = dest.querySelectorAll<HTMLElement>('[class*="tone-"]');
  src.forEach((el, i) => {
    copy[i].style.color = getComputedStyle(el).color;
  });
};

const showDialog = () => {
  dialog!.showModal();
  dialog!.classList.add("is-open");
  root.classList.add("zoom-open");
};

const hideDialog = () => {
  dialog!.classList.remove("is-open");
  if (dialog!.open) dialog!.close();
  root.classList.remove("zoom-open");
};

// A drag that selects text still ends in a click, which must not zoom or close.
const hasSelection = () => !!window.getSelection()?.toString();

const open = (img: Zoomable) => {
  if (dialog!.open) return;
  track("image_zoom");
  activeImg = img;

  const target = targetFor(img);
  zoomImg!.hidden = img instanceof SVGElement;
  zoomBox!.hidden = !(img instanceof SVGElement);
  if (img instanceof SVGElement) {
    fillBox(img);
  } else {
    zoomImg!.src = img.currentSrc || img.src;
    zoomImg!.alt = img.alt;
  }

  const fig = figcaptionFor(img);
  if (fig) {
    caption!.innerHTML = fig.innerHTML;
    copyToneColors(fig, caption!);
    caption!.hidden = false;
  } else {
    caption!.innerHTML = "";
    caption!.hidden = true;
  }

  if (!doc.startViewTransition) {
    hideEl(img);
    if (fig) fig.style.visibility = "hidden";
    showDialog();
    return;
  }

  img.style.viewTransitionName = "zoom-image";
  if (fig) fig.style.viewTransitionName = "zoom-caption";

  const vt = doc.startViewTransition(() => {
    hideEl(img);
    img.style.viewTransitionName = "";
    if (fig) {
      fig.style.visibility = "hidden";
      fig.style.viewTransitionName = "";
    }
    target.style.viewTransitionName = "zoom-image";
    if (fig) caption!.style.viewTransitionName = "zoom-caption";
    showDialog();
  });

  vt.finished.finally(() => {
    target.style.viewTransitionName = "";
    caption!.style.viewTransitionName = "";
  });
};

const cleanup = (img: Zoomable, fig: HTMLElement | null) => {
  showEl(img);
  img.style.viewTransitionName = "";
  if (fig) {
    fig.style.visibility = "";
    fig.style.viewTransitionName = "";
  }
  zoomImg!.style.viewTransitionName = "";
  zoomBox!.style.viewTransitionName = "";
  caption!.style.viewTransitionName = "";
  zoomImg!.removeAttribute("src");
  zoomBox!.replaceChildren();
  activeImg = null;
};

const close = () => {
  if (!dialog!.open || !activeImg) return;
  const img = activeImg;
  const fig = figcaptionFor(img);
  const hasCaption = !!fig && !caption!.hidden;

  if (!doc.startViewTransition) {
    hideDialog();
    cleanup(img, fig);
    return;
  }

  const target = targetFor(img);
  target.style.viewTransitionName = "zoom-image";
  if (hasCaption) caption!.style.viewTransitionName = "zoom-caption";

  const vt = doc.startViewTransition(() => {
    target.style.viewTransitionName = "";
    caption!.style.viewTransitionName = "";
    showEl(img);
    img.style.viewTransitionName = "zoom-image";
    if (hasCaption && fig) {
      fig.style.visibility = "";
      fig.style.viewTransitionName = "zoom-caption";
    }
    hideDialog();
  });

  vt.finished.finally(() => cleanup(img, fig));
};

let globalBound = false;

// The dialog, close button and window resize handler are page-level
// singletons - bound once, ever. Only bindImages() (below) needs to run
// again after a dev-only content swap (src/scripts/live-update.ts): it only
// ever touches whatever <img> elements exist under `scope` right now, and
// any it already bound from a previous scope are long gone from the DOM
// along with their listeners.
function bindGlobalOnce(): void {
  if (globalBound || !dialog || !zoomImg || !zoomBox || !caption) return;
  globalBound = true;

  closeBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    close();
  });

  dialog.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest("#image-zoom-close")) return;
    if (hasSelection()) return;
    close();
  });

  // Esc dispatches the dialog's `cancel` event; morph out instead of an
  // instant native close.
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    close();
  });

  window.addEventListener("resize", () => {
    if (!dialog.open || !activeImg) return;
    const img = activeImg;
    hideDialog();
    cleanup(img, figcaptionFor(img));
  });
}

export function bindImages(scope: ParentNode = document): void {
  if (!dialog || !zoomImg || !zoomBox || !caption) return;
  bindDiagrams(scope);
  const images = Array.from(
    scope.querySelectorAll<HTMLImageElement>("img"),
  ).filter((img) => !img.hasAttribute("data-no-zoom"));

  for (const img of images) {
    img.setAttribute("role", "button");
    img.setAttribute("tabindex", "0");
    img.addEventListener("click", () => open(img));
    img.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open(img);
      }
    });
  }
}

// Static diagrams only: a figure with controls or a stage the page script
// redraws would clone into a dead copy.
const INTERACTIVE = "button, input, select, textarea, [data-stage]";

function bindDiagrams(scope: ParentNode): void {
  for (const fig of scope.querySelectorAll<HTMLElement>("figure")) {
    if (fig.matches("[data-no-zoom]") || fig.querySelector(INTERACTIVE)) {
      continue;
    }
    const svg = fig.querySelector<SVGSVGElement>("svg:not(.katex svg)");
    if (!svg || svg.hasAttribute("data-no-zoom")) continue;
    svg.setAttribute("role", svg.getAttribute("role") ?? "img");
    svg.setAttribute("tabindex", "0");
    svg.style.cursor = "zoom-in";
    svg.addEventListener("click", () => {
      if (!hasSelection()) open(svg);
    });
    svg.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open(svg);
      }
    });
  }
}

export function initImageZoom(scope: ParentNode = document): void {
  bindGlobalOnce();
  bindImages(scope);
}

function init() {
  initImageZoom(document.querySelector("article") ?? document);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
