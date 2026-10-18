import { track } from "./analytics.ts";

const openSidebarBtn = document.getElementById("open-sidebar");
const openTocBtn = document.getElementById("open-toc");
const backdrop = document.getElementById("drawer-backdrop");
const sidebarEl = document.querySelector(".sidebar");
const tocEl = document.querySelector(".right-sidebar");
const root = document.documentElement;

const closeDrawers = () => {
  root.classList.remove("sidebar-open", "toc-open");
  document.body.style.overflow = "";
};
const openSidebar = () => {
  root.classList.add("sidebar-open");
  root.classList.remove("toc-open");
  document.body.style.overflow = "hidden";
};
const openToc = () => {
  root.classList.add("toc-open");
  root.classList.remove("sidebar-open");
  document.body.style.overflow = "hidden";
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
