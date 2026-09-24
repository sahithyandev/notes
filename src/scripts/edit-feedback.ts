// Dev-only: lets you select text on a rendered note, attach a comment, and
// get a proposed edit back from a long-lived headless `claude` session (see
// src/integrations/edit-feedback/). Only imported by [...slug].astro under
// import.meta.env.DEV, so none of this ships in a production build.

interface FeedbackItem {
  id: string;
  slug: string;
  filePath: string;
  selection: string;
  heading?: string;
  comment: string;
  status: "queued" | "running" | "proposed" | "error" | "applied" | "discarded";
  progress: string[];
  agentReply?: string;
  summary?: string;
  proposedFile?: string;
  edits?: { old: string; new: string }[];
  error?: string;
  createdAt: number;
  updatedAt: number;
}

function initEditFeedback() {
  const root = document.getElementById("edit-feedback");
  if (!root) return;

  const slug = root.dataset.slug ?? "";
  const filePath = root.dataset.filePath ?? "";
  const article = document.querySelector("article");
  if (!article) return;

  const selectBtn = root.querySelector<HTMLButtonElement>(
    "[data-ef-select-btn]",
  )!;
  const popover = root.querySelector<HTMLElement>("[data-ef-popover]")!;
  const commentInput =
    root.querySelector<HTMLTextAreaElement>("[data-ef-comment]")!;
  const submitBtn = root.querySelector<HTMLButtonElement>("[data-ef-submit]")!;
  const cancelBtn = root.querySelector<HTMLButtonElement>("[data-ef-cancel]")!;
  const panel = root.querySelector<HTMLElement>("[data-ef-panel]")!;
  const panelToggle = root.querySelector<HTMLButtonElement>(
    "[data-ef-panel-toggle]",
  )!;
  const list = root.querySelector<HTMLElement>("[data-ef-list]")!;
  const itemTemplate = root.querySelector<HTMLTemplateElement>(
    "[data-ef-item-template]",
  )!;

  let pendingSelection: {
    text: string;
    heading?: string;
    context?: string;
  } | null = null;

  // --- selection capture -----------------------------------------------

  function nearestHeading(node: Node | null): string | undefined {
    let el: Element | null =
      node instanceof Element ? node : (node?.parentElement ?? null);
    while (el && el !== article) {
      let sib: Element | null = el;
      while (sib) {
        if (/^H[2-4]$/.test(sib.tagName)) return sib.textContent?.trim();
        sib = sib.previousElementSibling;
      }
      el = el.parentElement;
    }
    return undefined;
  }

  // Katex renders each formula as MathML + a raw-TeX <annotation>; swap the
  // rendered glyphs for "$tex$" so the captured selection reads as Markdown
  // source, not KaTeX's visual output.
  function serializeRange(range: Range): string {
    const clone = range.cloneContents();
    const wrapper = document.createElement("div");
    wrapper.appendChild(clone);
    wrapper.querySelectorAll(".katex").forEach((katex) => {
      const tex = katex.querySelector(
        'annotation[encoding="application/x-tex"]',
      )?.textContent;
      const displayMode = katex.closest(".katex-display") !== null;
      const delim = displayMode ? "$$" : "$";
      katex.replaceWith(
        document.createTextNode(`${delim}${tex ?? ""}${delim}`),
      );
    });
    return wrapper.textContent?.trim() ?? "";
  }

  function surroundingContext(range: Range): string {
    const full = article!.textContent ?? "";
    const before =
      range.startContainer.textContent?.slice(0, range.startOffset) ?? "";
    const idx = full.indexOf(before.slice(-40));
    if (idx === -1) return "";
    const start = Math.max(0, idx - 100);
    return full.slice(start, idx + 140);
  }

  document.addEventListener("selectionchange", () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      selectBtn.hidden = true;
      return;
    }
    const range = sel.getRangeAt(0);
    if (!article!.contains(range.commonAncestorContainer)) {
      selectBtn.hidden = true;
      return;
    }
    const text = serializeRange(range);
    if (!text) {
      selectBtn.hidden = true;
      return;
    }
    pendingSelection = {
      text,
      heading: nearestHeading(range.startContainer),
      context: surroundingContext(range),
    };
    const rect = range.getBoundingClientRect();
    selectBtn.style.top = `${rect.top + window.scrollY - 36}px`;
    selectBtn.style.left = `${rect.left + window.scrollX}px`;
    selectBtn.hidden = false;
  });

  selectBtn.addEventListener("click", () => {
    if (!pendingSelection) return;
    const rect = selectBtn.getBoundingClientRect();
    popover.style.top = `${rect.bottom + window.scrollY + 6}px`;
    popover.style.left = `${rect.left + window.scrollX}px`;
    popover.hidden = false;
    selectBtn.hidden = true;
    commentInput.value = "";
    commentInput.focus();
  });

  cancelBtn.addEventListener("click", () => {
    popover.hidden = true;
  });

  async function submitFeedback() {
    if (!pendingSelection) return;
    const comment = commentInput.value.trim();
    if (!comment) return;

    popover.hidden = true;
    panel.hidden = false;
    panelToggle.setAttribute("aria-expanded", "true");

    await fetch("/__edit-feedback/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filePath,
        slug,
        selection: pendingSelection.text,
        heading: pendingSelection.heading,
        context: pendingSelection.context,
        comment,
      }),
    });
    pendingSelection = null;
    window.getSelection()?.removeAllRanges();
  }

  submitBtn.addEventListener("click", submitFeedback);
  commentInput.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void submitFeedback();
    }
  });

  panelToggle.addEventListener("click", () => {
    const collapsed = panel.hidden;
    panel.hidden = !collapsed;
    panelToggle.setAttribute("aria-expanded", String(!panel.hidden));
    try {
      sessionStorage.setItem("ef-panel-open", panel.hidden ? "0" : "1");
    } catch {
      // ignore
    }
  });
  try {
    if (sessionStorage.getItem("ef-panel-open") === "1") {
      panel.hidden = false;
      panelToggle.setAttribute("aria-expanded", "true");
    }
  } catch {
    // ignore
  }

  // --- item rendering -----------------------------------------------

  const itemEls = new Map<string, HTMLElement>();

  function renderItem(item: FeedbackItem) {
    if (item.slug !== slug) return;

    let el = itemEls.get(item.id);
    if (!el) {
      el = (itemTemplate.content.firstElementChild as HTMLElement).cloneNode(
        true,
      ) as HTMLElement;
      itemEls.set(item.id, el);
      list.prepend(el);
    }

    el.dataset.status = item.status;
    el.querySelector("[data-ef-comment-text]")!.textContent = item.comment;
    el.querySelector("[data-ef-status]")!.textContent = statusLabel(item);

    const progressEl = el.querySelector<HTMLElement>("[data-ef-progress]")!;
    progressEl.textContent = item.progress.at(-1) ?? "";
    progressEl.hidden = item.status !== "running" || item.progress.length === 0;

    const summaryEl = el.querySelector<HTMLElement>("[data-ef-summary]")!;
    summaryEl.textContent = item.summary ?? "";
    summaryEl.hidden = !item.summary;

    const diffEl = el.querySelector<HTMLElement>("[data-ef-diff]")!;
    diffEl.innerHTML = "";
    diffEl.hidden = !item.edits || item.edits.length === 0;
    for (const edit of item.edits ?? []) {
      const old = document.createElement("del");
      old.textContent = edit.old;
      const next = document.createElement("ins");
      next.textContent = edit.new;
      const wrap = document.createElement("div");
      wrap.className = "ef-edit";
      wrap.append(old, next);
      diffEl.append(wrap);
    }

    const errorEl = el.querySelector<HTMLElement>("[data-ef-error]")!;
    errorEl.textContent = item.error ?? "";
    errorEl.hidden = !item.error;

    const actions = el.querySelector<HTMLElement>("[data-ef-actions]")!;
    actions.hidden = item.status !== "proposed";

    const refineForm = el.querySelector<HTMLElement>("[data-ef-refine]")!;
    refineForm.hidden = !(
      item.status === "proposed" || item.status === "error"
    );

    const applyBtn = el.querySelector<HTMLButtonElement>("[data-ef-apply]")!;
    applyBtn.onclick = () =>
      fetch(`/__edit-feedback/apply/${item.id}`, { method: "POST" });

    const discardBtn =
      el.querySelector<HTMLButtonElement>("[data-ef-discard]")!;
    discardBtn.onclick = () =>
      fetch(`/__edit-feedback/discard/${item.id}`, { method: "POST" });

    const refineInput = el.querySelector<HTMLTextAreaElement>(
      "[data-ef-refine-input]",
    )!;
    const refineBtn = el.querySelector<HTMLButtonElement>(
      "[data-ef-refine-btn]",
    )!;
    refineBtn.onclick = () => {
      const comment = refineInput.value.trim();
      if (!comment) return;
      refineInput.value = "";
      void fetch(`/__edit-feedback/refine/${item.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment }),
      });
    };
  }

  function statusLabel(item: FeedbackItem): string {
    switch (item.status) {
      case "queued":
        return "Queued";
      case "running":
        return "Working…";
      case "proposed":
        return "Proposed";
      case "error":
        return "Error";
      case "applied":
        return "Applied";
      case "discarded":
        return "Discarded";
    }
  }

  const es = new EventSource("/__edit-feedback/events");
  es.onmessage = (ev) => {
    const msg = JSON.parse(ev.data) as
      | { type: "snapshot"; items: FeedbackItem[] }
      | { type: "item"; item: FeedbackItem };
    if (msg.type === "snapshot") {
      for (const item of msg.items) renderItem(item);
    } else {
      renderItem(msg.item);
    }
  };
}

document.addEventListener("DOMContentLoaded", initEditFeedback);
