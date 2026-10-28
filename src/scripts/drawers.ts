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
  syncStudySidebarPeek();
});

const studyBtn = document.getElementById("study-toggle");

const STUDY_LEFT_EDGE_PX = 48;
const STUDY_RIGHT_EDGE_PX = 24;
const studySidebarWidth = () =>
  Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue("--sidebar-w"),
  ) || 280;

const syncStudySidebarPeek = (event?: PointerEvent) => {
  if (!root.classList.contains("study-mode") || !mqDesktop.matches) {
    root.classList.remove("study-sidebar-left", "study-sidebar-right");
    return;
  }

  if (!event || event.pointerType === "touch") return;

  const belowNav = event.clientY >= 54;
  const sidebarWidth = studySidebarWidth();
  const leftWasOpen = root.classList.contains("study-sidebar-left");
  const rightWasOpen = root.classList.contains("study-sidebar-right");
  const revealLeft =
    belowNav &&
    (event.clientX <= STUDY_LEFT_EDGE_PX ||
      (leftWasOpen && event.clientX <= sidebarWidth));
  const revealRight =
    belowNav &&
    (event.clientX >= window.innerWidth - STUDY_RIGHT_EDGE_PX ||
      (rightWasOpen && event.clientX >= window.innerWidth - sidebarWidth));

  root.classList.toggle("study-sidebar-left", revealLeft);
  root.classList.toggle("study-sidebar-right", revealRight);
};

document.addEventListener("pointermove", syncStudySidebarPeek, {
  passive: true,
});

studyBtn?.setAttribute(
  "aria-pressed",
  String(root.classList.contains("study-mode")),
);
studyBtn?.addEventListener("click", () => {
  const on = root.classList.toggle("study-mode");
  studyBtn.setAttribute("aria-pressed", String(on));
  if (!on) syncStudySidebarPeek();
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
