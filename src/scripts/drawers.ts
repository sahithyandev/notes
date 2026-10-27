import { track } from "./analytics.ts";

const openSidebarBtn = document.getElementById("open-sidebar");
const openTocBtn = document.getElementById("open-toc");
const backdrop = document.getElementById("drawer-backdrop");
const sidebarEl = document.querySelector<HTMLElement>(".sidebar");
const tocEl = document.querySelector<HTMLElement>(".right-sidebar");
const root = document.documentElement;

let lastTrigger: HTMLElement | null = null;

const syncTriggerState = () => {
  openSidebarBtn?.setAttribute(
    "aria-expanded",
    String(root.classList.contains("sidebar-open")),
  );
  openTocBtn?.setAttribute(
    "aria-expanded",
    String(root.classList.contains("toc-open")),
  );
};

const closeDrawers = () => {
  const trigger = lastTrigger;
  root.classList.remove("sidebar-open", "toc-open");
  document.body.style.overflow = "";
  syncTriggerState();
  lastTrigger = null;
  trigger?.focus();
};
const openSidebar = () => {
  lastTrigger = openSidebarBtn;
  root.classList.add("sidebar-open");
  root.classList.remove("toc-open");
  document.body.style.overflow = "hidden";
  syncTriggerState();
  sidebarEl?.focus();
};
const openToc = () => {
  lastTrigger = openTocBtn;
  root.classList.add("toc-open");
  root.classList.remove("sidebar-open");
  document.body.style.overflow = "hidden";
  syncTriggerState();
  tocEl?.focus();
};

openSidebarBtn?.addEventListener("click", openSidebar);
openTocBtn?.addEventListener("click", openToc);
backdrop?.addEventListener("click", closeDrawers);

document.addEventListener("keydown", (e) => {
  if (
    e.key === "Escape" &&
    (root.classList.contains("sidebar-open") ||
      root.classList.contains("toc-open"))
  ) {
    closeDrawers();
  }
});

sidebarEl?.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  if (target.closest("a")) closeDrawers();
});
tocEl?.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  if (target.closest("a")) closeDrawers();
});

const mqDesktop = window.matchMedia("(min-width: 48rem)");
mqDesktop.addEventListener("change", (e) => {
  if (e.matches) closeDrawers();
});

const studyBtn = document.getElementById("study-toggle");
studyBtn?.setAttribute(
  "aria-pressed",
  String(root.classList.contains("study-mode")),
);
studyBtn?.addEventListener("click", () => {
  const on = root.classList.toggle("study-mode");
  studyBtn.setAttribute("aria-pressed", String(on));
  track("study_mode", { on });
  try {
    if (on) localStorage.setItem("sn-study-mode", "1");
    else localStorage.removeItem("sn-study-mode");
  } catch {}
});

requestAnimationFrame(() => {
  requestAnimationFrame(() => root.classList.add("drawers-ready"));
});

syncTriggerState();
