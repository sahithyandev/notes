// Shared driver for every walkthrough carousel (simplex, transportation,
// assignment, and later the generic <Walkthrough>). One persistent "live"
// table is cloned from the first step's [data-stage] element; stepping
// forward copies only the cells that actually changed, so the eye tracks
// what moved instead of the whole table repainting.
//
// The three per-family drivers this replaces differed only in how much of
// a cell's class list they copied (simplex toggled `enter`/`pivot`
// individually; transportation/assignment copied the whole className).
// Both are equivalent here: every class besides the runtime `changed` flag
// is a pure function of (row kind, column index) that each step renders
// itself, so copying the full className reproduces the per-flag toggling
// exactly while also picking up simplex's row-level `leave` class for free.

import { createDot } from "./dots";

function tableOf(stage: HTMLElement): HTMLTableElement {
  return stage.tagName === "TABLE"
    ? (stage as HTMLTableElement)
    : stage.querySelector<HTMLTableElement>("table")!;
}

export function initWalkthrough(root: HTMLElement): void {
  const steps = Array.from(root.querySelectorAll<HTMLElement>(".step"));
  if (!steps.length) return;

  const holder = root.querySelector<HTMLElement>("[data-live]")!;
  const prev = root.querySelector<HTMLButtonElement>("[data-prev]")!;
  const next = root.querySelector<HTMLButtonElement>("[data-next]")!;
  const label = root.querySelector<HTMLElement>("[data-label]")!;
  const current = root.querySelector<HTMLElement>("[data-current]")!;
  const total = root.querySelector<HTMLElement>("[data-total]")!;
  const dotWrap = root.querySelector<HTMLElement>(".dots")!;
  const dotTemplate = root.querySelector<HTMLTemplateElement>(
    "[data-dot-template]",
  );
  const live = root.querySelector<HTMLElement>(".live")!;

  // The persistent stage: a clone of the first step's data source.
  const firstStage = steps[0].querySelector<HTMLElement>("[data-stage]")!;
  const liveStage = firstStage.cloneNode(true) as HTMLElement;
  tableOf(liveStage).removeAttribute("aria-hidden");
  holder.appendChild(liveStage);

  total.textContent = String(steps.length);

  const dots = steps.map((s, idx) =>
    createDot(dotWrap, dotTemplate, s.dataset.label ?? `Step ${idx + 1}`, () =>
      show(idx),
    ),
  );

  let i = 0;

  function show(n: number) {
    i = Math.max(0, Math.min(steps.length - 1, n));
    const srcStage = steps[i].querySelector<HTMLElement>("[data-stage]")!;
    const srcTable = tableOf(srcStage);
    const dstTable = tableOf(liveStage);

    const srcRows = srcTable.querySelectorAll("tr");
    const dstRows = dstTable.querySelectorAll("tr");
    srcRows.forEach((sr, ri) => {
      const dr = dstRows[ri];
      if (!dr) return;
      dr.className = sr.className;
      const sCells = sr.querySelectorAll<HTMLElement>("th,td");
      const dCells = dr.querySelectorAll<HTMLElement>("th,td");
      sCells.forEach((sc, ci) => {
        const dc = dCells[ci];
        if (!dc) return;
        const changed = dc.innerHTML !== sc.innerHTML;
        if (changed) dc.innerHTML = sc.innerHTML;
        dc.className = sc.className;
        dc.classList.toggle("changed", changed);
      });
    });

    // Figcaption sync: self-guarding, a no-op when the stage has none (the
    // bare <table> stages, e.g. simplex).
    const srcCaption = srcStage.querySelector("figcaption");
    let dstCaption = liveStage.querySelector("figcaption");
    if (srcCaption) {
      if (!dstCaption) {
        dstCaption = document.createElement("figcaption");
        liveStage.appendChild(dstCaption);
      }
      dstCaption.innerHTML = srcCaption.innerHTML;
      dstCaption.hidden = false;
    } else if (dstCaption) {
      dstCaption.hidden = true;
    }

    steps.forEach((s, idx) => s.classList.toggle("active", idx === i));
    dots.forEach((d, idx) =>
      d.setAttribute("aria-selected", idx === i ? "true" : "false"),
    );
    prev.disabled = i === 0;
    next.disabled = i === steps.length - 1;
    label.textContent = steps[i].dataset.label ?? "";
    current.textContent = String(i + 1);
    const noteText =
      steps[i].querySelector(".step-note")?.textContent?.trim() ?? "";
    live.textContent = `${label.textContent}. ${noteText}`;
  }

  prev.addEventListener("click", () => show(i - 1));
  next.addEventListener("click", () => show(i + 1));
  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      show(i - 1);
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      show(i + 1);
      e.preventDefault();
    }
  });

  root.classList.add("ready");
  show(0);
}
