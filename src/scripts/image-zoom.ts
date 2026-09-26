type VTDocument = Document & {
  startViewTransition?: (cb: () => void) => { finished: Promise<void> };
};

const dialog = document.getElementById(
  "image-zoom",
) as HTMLDialogElement | null;
const zoomImg = document.getElementById(
  "image-zoom-img",
) as HTMLImageElement | null;
const caption = document.getElementById(
  "image-zoom-caption",
) as HTMLElement | null;
const closeBtn = document.getElementById("image-zoom-close");
const root = document.documentElement;
const doc = document as VTDocument;

let activeImg: HTMLImageElement | null = null;

const figcaptionFor = (img: HTMLImageElement) =>
  img.closest("figure")?.querySelector<HTMLElement>("figcaption") ?? null;

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

const open = (img: HTMLImageElement) => {
  if (dialog!.open) return;
  activeImg = img;

  zoomImg!.src = img.currentSrc || img.src;
  zoomImg!.alt = img.alt;

  const fig = figcaptionFor(img);
  if (fig) {
    caption!.innerHTML = fig.innerHTML;
    caption!.hidden = false;
  } else {
    caption!.innerHTML = "";
    caption!.hidden = true;
  }

  if (!doc.startViewTransition) {
    img.style.visibility = "hidden";
    if (fig) fig.style.visibility = "hidden";
    showDialog();
    return;
  }

  img.style.viewTransitionName = "zoom-image";
  if (fig) fig.style.viewTransitionName = "zoom-caption";

  const vt = doc.startViewTransition(() => {
    img.style.visibility = "hidden";
    img.style.viewTransitionName = "";
    if (fig) {
      fig.style.visibility = "hidden";
      fig.style.viewTransitionName = "";
    }
    zoomImg!.style.viewTransitionName = "zoom-image";
    if (fig) caption!.style.viewTransitionName = "zoom-caption";
    showDialog();
  });

  vt.finished.finally(() => {
    zoomImg!.style.viewTransitionName = "";
    caption!.style.viewTransitionName = "";
  });
};

const cleanup = (img: HTMLImageElement, fig: HTMLElement | null) => {
  img.style.visibility = "";
  img.style.viewTransitionName = "";
  if (fig) {
    fig.style.visibility = "";
    fig.style.viewTransitionName = "";
  }
  zoomImg!.style.viewTransitionName = "";
  caption!.style.viewTransitionName = "";
  zoomImg!.removeAttribute("src");
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

  zoomImg!.style.viewTransitionName = "zoom-image";
  if (hasCaption) caption!.style.viewTransitionName = "zoom-caption";

  const vt = doc.startViewTransition(() => {
    zoomImg!.style.viewTransitionName = "";
    caption!.style.viewTransitionName = "";
    img.style.visibility = "";
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
  if (globalBound || !dialog || !zoomImg || !caption) return;
  globalBound = true;

  closeBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    close();
  });

  dialog.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest("#image-zoom-close")) return;
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
  if (!dialog || !zoomImg || !caption) return;
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
