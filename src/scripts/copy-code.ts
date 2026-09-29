// Exported (not just run on DOMContentLoaded) so a dev-only content swap
// (src/scripts/live-update.ts) can re-run it against freshly-inserted <pre>
// blocks without a full page reload - safe to call repeatedly since it only
// ever touches whatever <pre> elements exist under `scope` right now, and
// any it already handled from a previous scope are long gone from the DOM.
export function initCopyButtons(scope: ParentNode = document): void {
  scope.querySelectorAll("pre").forEach((pre) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-btn";
    btn.setAttribute("aria-label", "Copy code");
    btn.textContent = "Copy";

    btn.addEventListener("click", () => {
      const code = pre.querySelector("code");
      const text = (code as HTMLElement)?.innerText ?? "";
      navigator.clipboard.writeText(text).then(
        () => {
          btn.textContent = "Copied";
          setTimeout(() => (btn.textContent = "Copy"), 1500);
        },
        () => {
          btn.textContent = "Failed";
          setTimeout(() => (btn.textContent = "Copy"), 1500);
        },
      );
    });

    pre.appendChild(btn);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initCopyButtons(document.querySelector("article") ?? document);
});
