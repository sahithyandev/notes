const STORAGE_KEY = "sn-study-zoom";
const DEFAULT = 1.2;
const MIN = 1;
const MAX = 1.6;
const STEP = 0.1;

const root = document.documentElement;
const outBtn = document.getElementById(
  "study-zoom-out",
) as HTMLButtonElement | null;
const inBtn = document.getElementById(
  "study-zoom-in",
) as HTMLButtonElement | null;
const levelEl = document.getElementById("study-zoom-level");

const clamp = (v: number) =>
  Math.min(MAX, Math.max(MIN, Math.round(v * 10) / 10));

const readStored = () => {
  try {
    const v = parseFloat(localStorage.getItem(STORAGE_KEY) ?? "");
    return Number.isFinite(v) ? clamp(v) : DEFAULT;
  } catch {
    return DEFAULT;
  }
};

let zoom = readStored();

const render = () => {
  root.style.setProperty("--study-scale", String(zoom));
  if (levelEl) levelEl.textContent = `${Math.round(zoom * 100)}%`;
  if (outBtn) outBtn.disabled = zoom <= MIN;
  if (inBtn) inBtn.disabled = zoom >= MAX;
};

const setZoom = (v: number) => {
  zoom = clamp(v);
  render();
  try {
    localStorage.setItem(STORAGE_KEY, String(zoom));
  } catch {}
};

outBtn?.addEventListener("click", () => setZoom(zoom - STEP));
inBtn?.addEventListener("click", () => setZoom(zoom + STEP));

render();
