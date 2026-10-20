// Keeps the filled part of a `.sn-range` track in step with its value. The
// fill is drawn from the `--p` custom property, which the browser never
// updates itself.
export function syncRange(el: HTMLInputElement) {
  const min = Number(el.min || 0);
  const max = Number(el.max || 100);
  const span = max - min;
  const p = span > 0 ? (Number(el.value) - min) / span : 0;
  el.style.setProperty("--p", String(Math.min(1, Math.max(0, p))));
}

let listening = false;

export function initRanges(root: ParentNode = document) {
  root.querySelectorAll<HTMLInputElement>("input.sn-range").forEach(syncRange);
  if (listening) return;
  listening = true;
  document.addEventListener("input", (e) => {
    const el = e.target;
    if (el instanceof HTMLInputElement && el.classList.contains("sn-range"))
      syncRange(el);
  });
}
