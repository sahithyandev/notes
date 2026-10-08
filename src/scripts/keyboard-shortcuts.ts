// Global single-key shortcuts. Each action reuses existing UI (clicks the
// search/theme buttons, follows the prev/next links) instead of duplicating
// its logic. Ctrl/Cmd+K is bound separately in search-modal.astro.
export type Action = "search" | "theme" | "prev" | "next" | "help";

const TYPING = "input, textarea, select, [contenteditable]";
const ARROW_SENSITIVE = "[tabindex], pre, [role='slider'], button";

export function resolveShortcut(e: KeyboardEvent): Action | null {
  if (e.defaultPrevented || e.isComposing) return null;
  if (e.ctrlKey || e.metaKey || e.altKey) return null;

  const target = e.target instanceof Element ? e.target : null;
  if (target?.closest(TYPING)) return null;
  if (document.querySelector("dialog[open]")) return null;

  switch (e.key) {
    case "/":
      return "search";
    case "t":
      return "theme";
    case "?":
      return "help";
    case "ArrowLeft":
    case "ArrowRight": {
      if (e.shiftKey) return null;
      if (target?.closest(ARROW_SENSITIVE)) return null;
      const action = e.key === "ArrowLeft" ? "prev" : "next";
      return document.querySelector(
        `.note-nav-btn.${e.key === "ArrowLeft" ? "left" : "right"}`,
      )
        ? action
        : null;
    }
    default:
      return null;
  }
}

export function run(action: Action): void {
  switch (action) {
    case "search":
      document.getElementById("search-trigger")?.click();
      break;
    case "theme":
      document.getElementById("themeToggle")?.click();
      break;
    case "help":
      document
        .querySelector<HTMLDialogElement>("#shortcuts-dialog")
        ?.showModal();
      break;
    case "prev":
    case "next": {
      const side = action === "prev" ? "left" : "right";
      const link = document.querySelector<HTMLAnchorElement>(
        `.note-nav-btn.${side}`,
      );
      if (link) window.location.href = link.href;
      break;
    }
  }
}

document.addEventListener("keydown", (e) => {
  const action = resolveShortcut(e);
  if (!action) return;
  e.preventDefault();
  run(action);
});

document.querySelectorAll("[data-open-shortcuts]").forEach((el) => {
  el.addEventListener("click", () => run("help"));
});
