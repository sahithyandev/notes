// Astro dev toolbar app for whole-note / cross-note ("merge") feedback:
// pick one or more notes, write a comment, review the agent's proposal, and
// Apply/Discard/Refine - all inside the toolbar's own toggled window rather
// than a custom floating bar. Registered via addDevToolbarApp() in
// index.ts's astro:config:setup hook, entrypoint resolved relative to this
// file, so it only ever loads in dev.
//
// A selection-based item (from src/components/dev/live-edit.astro, which
// captures a specific span of an article and needs the live DOM Range to
// anchor its own inline marker) doesn't belong here - this window only
// lists/handles "whole-note" items, which have no single place in a note's
// body to render inline. Every item this app receives over SSE is still
// re-dispatched as a "le-item" DOM event, which is how that other widget
// learns about items it submitted without both needing their own
// EventSource.
import type { DevToolbarApp } from "astro";

interface FileChange {
  file: string;
  edits: { old: string; new: string }[];
}

interface FeedbackItem {
  id: string;
  kind: "selection" | "whole-note";
  files: string[];
  selection?: string;
  heading?: string;
  comment: string;
  status: "queued" | "running" | "proposed" | "error" | "applied" | "discarded";
  progress: string[];
  agentReply?: string;
  summary?: string;
  changes?: FileChange[];
  deletions?: string[];
  error?: string;
  createdAt: number;
  updatedAt: number;
}

interface NoteInfo {
  file: string;
  slug: string;
  title: string;
}

const WINDOW_STYLE = `
  :host astro-dev-toolbar-window {
    width: min(420px, 100%);
    max-height: 640px;
    overflow-y: auto;
  }
  h1 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: #fff;
    margin: 0 0 12px;
    font-size: 18px;
  }
  .le-files {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    position: relative;
  }
  .le-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: #24262d;
    border: 1px solid #343841;
    border-radius: 999px;
    padding: 2px 4px 2px 10px;
    font-size: 12px;
  }
  .le-chip button {
    border: none;
    background: transparent;
    color: #bfc1c9;
    cursor: pointer;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    line-height: 1;
  }
  .le-add-file {
    border: 1px dashed #4d5058;
    background: transparent;
    color: #bfc1c9;
    border-radius: 999px;
    padding: 3px 10px;
    font-size: 12px;
    cursor: pointer;
  }
  .le-picker {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    width: min(320px, 90vw);
    max-height: 260px;
    overflow-y: auto;
    border: 1px solid #343841;
    background: #16171c;
    border-radius: 8px;
    padding: 8px;
    z-index: 1;
  }
  .le-picker-input {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #343841;
    background: #24262d;
    color: #fff;
    border-radius: 6px;
    padding: 6px 8px;
    font-size: 13px;
    margin-bottom: 6px;
  }
  .le-picker-result {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1px;
    width: 100%;
    border: none;
    background: transparent;
    text-align: left;
    padding: 6px 8px;
    border-radius: 6px;
    cursor: pointer;
    color: #fff;
  }
  .le-picker-result:hover {
    background: #24262d;
  }
  .le-picker-result-slug {
    font-size: 11px;
    color: #bfc1c9;
  }
  .le-input-row {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    margin-top: 8px;
  }
  .le-comment {
    flex: 1;
    resize: vertical;
    border: 1px solid #343841;
    background: #24262d;
    color: #fff;
    border-radius: 8px;
    padding: 6px 10px;
    font-size: 13px;
    min-height: 30px;
  }
  .le-btn {
    border-radius: 6px;
    padding: 5px 12px;
    font-size: 12px;
    cursor: pointer;
    border: 1px solid transparent;
  }
  .le-btn-primary {
    background: #a879e8;
    color: #13151a;
    font-weight: 600;
  }
  .le-btn-ghost {
    background: transparent;
    border-color: #343841;
    color: #bfc1c9;
  }
  .le-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 14px;
  }
  .le-item {
    border: 1px solid #343841;
    border-radius: 8px;
    padding: 8px;
    background: #16171c;
  }
  .le-item[data-status="error"] {
    border-color: #dc2626;
  }
  .le-item[data-status="applied"] {
    border-color: #16a34a;
  }
  .le-item-header {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    align-items: baseline;
  }
  .le-item-status {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: #bfc1c9;
    flex: none;
  }
  .le-item-files {
    font-size: 11px;
    color: #bfc1c9;
    text-align: right;
    overflow-wrap: anywhere;
  }
  .le-item-comment {
    margin-top: 4px;
    font-style: italic;
  }
  .le-item-progress {
    margin-top: 4px;
    color: #bfc1c9;
    font-size: 12px;
  }
  .le-item-summary {
    margin-top: 6px;
    font-weight: 600;
  }
  .le-item-diff {
    margin-top: 6px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 12px;
  }
  .le-edit-file {
    font-weight: 600;
    font-size: 11px;
    color: #bfc1c9;
    margin-top: 4px;
  }
  .le-edit {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .le-item-diff del {
    background: #7f1d1d;
    color: #fecaca;
    text-decoration: line-through;
    padding: 2px 4px;
    border-radius: 4px;
  }
  .le-item-diff ins {
    background: #14532d;
    color: #bbf7d0;
    text-decoration: none;
    padding: 2px 4px;
    border-radius: 4px;
  }
  .le-item-deletions {
    margin-top: 6px;
    border: 1px solid #dc2626;
    border-radius: 6px;
    padding: 6px 8px;
    font-size: 12px;
  }
  .le-deletions-label {
    font-weight: 700;
    color: #fca5a5;
    margin-bottom: 2px;
  }
  .le-deletions-file {
    color: #bfc1c9;
    font-family: ui-monospace, monospace;
    font-size: 11px;
  }
  .le-item-error {
    margin-top: 6px;
    color: #fca5a5;
    font-size: 12px;
    white-space: pre-wrap;
  }
  .le-item-actions,
  .le-item-refine {
    margin-top: 8px;
    display: flex;
    gap: 6px;
  }
  .le-item-refine {
    flex-direction: column;
  }
`;

const WINDOW_MARKUP = `
  <style>${WINDOW_STYLE}</style>
  <h1>Whole-note / merge feedback</h1>
  <div class="le-files" data-le-files>
    <button type="button" class="le-add-file" data-le-add-file>+ note</button>
    <div class="le-picker" data-le-picker hidden>
      <input type="text" class="le-picker-input" data-le-picker-input placeholder="Search notes by title or slug…" />
      <div data-le-picker-results></div>
    </div>
  </div>
  <div class="le-input-row">
    <textarea class="le-comment" data-le-comment placeholder="Feedback on the note(s) above… (⌘/Ctrl+Enter to send)" rows="2"></textarea>
    <button type="button" class="le-btn le-btn-primary" data-le-send>Send</button>
  </div>
  <div class="le-list" data-le-list></div>
`;

const ITEM_MARKUP = `
  <div class="le-item-header">
    <span class="le-item-status" data-le-status></span>
    <span class="le-item-files" data-le-files-label></span>
  </div>
  <div class="le-item-comment" data-le-comment-text></div>
  <div class="le-item-progress" data-le-progress hidden></div>
  <div class="le-item-summary" data-le-summary hidden></div>
  <div class="le-item-diff" data-le-diff hidden></div>
  <div class="le-item-deletions" data-le-deletions hidden></div>
  <div class="le-item-error" data-le-error hidden></div>
  <div class="le-item-actions" data-le-actions hidden>
    <button type="button" class="le-btn le-btn-primary" data-le-apply>Apply</button>
    <button type="button" class="le-btn le-btn-ghost" data-le-discard>Discard</button>
  </div>
  <div class="le-item-refine" data-le-refine hidden>
    <textarea class="le-comment" data-le-refine-input placeholder="Refine…" rows="2"></textarea>
    <button type="button" class="le-btn le-btn-ghost" data-le-refine-btn>Send</button>
  </div>
`;

export default {
  init(canvas, app) {
    const win = document.createElement("astro-dev-toolbar-window");
    win.innerHTML = WINDOW_MARKUP;
    canvas.append(win);

    const filesEl = win.querySelector<HTMLElement>("[data-le-files]")!;
    const addFileBtn =
      win.querySelector<HTMLButtonElement>("[data-le-add-file]")!;
    const picker = win.querySelector<HTMLElement>("[data-le-picker]")!;
    const pickerInput = win.querySelector<HTMLInputElement>(
      "[data-le-picker-input]",
    )!;
    const pickerResults = win.querySelector<HTMLElement>(
      "[data-le-picker-results]",
    )!;
    const commentInput =
      win.querySelector<HTMLTextAreaElement>("[data-le-comment]")!;
    const sendBtn = win.querySelector<HTMLButtonElement>("[data-le-send]")!;
    const list = win.querySelector<HTMLElement>("[data-le-list]")!;

    // --- file chips -------------------------------------------------

    const selectedFiles: string[] = [];
    const chipEls = new Map<string, HTMLElement>();

    // Default to the note currently being viewed, if any: the per-note
    // widget's root carries the file path as a data attribute.
    const currentNoteFile = document.getElementById("live-edit-selection")
      ?.dataset.filePath;
    if (currentNoteFile) addFile(currentNoteFile);

    function addFile(file: string): void {
      if (selectedFiles.includes(file)) return;
      selectedFiles.push(file);
      const chip = document.createElement("span");
      chip.className = "le-chip";
      const label = document.createElement("span");
      label.textContent = file.replace(/^docs\//, "").replace(/\.mdx?$/, "");
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.textContent = "×";
      removeBtn.setAttribute("aria-label", "Remove note");
      removeBtn.onclick = () => removeFile(file);
      chip.append(label, removeBtn);
      chipEls.set(file, chip);
      filesEl.insertBefore(chip, addFileBtn);
    }

    function removeFile(file: string): void {
      const idx = selectedFiles.indexOf(file);
      if (idx === -1) return;
      selectedFiles.splice(idx, 1);
      chipEls.get(file)?.remove();
      chipEls.delete(file);
    }

    // --- note picker (searches /__live-edit/notes) -------------------

    let notesCache: NoteInfo[] | null = null;

    async function loadNotes(): Promise<NoteInfo[]> {
      if (notesCache) return notesCache;
      const res = await fetch("/__live-edit/notes");
      const body = (await res.json()) as { notes: NoteInfo[] };
      notesCache = body.notes;
      return notesCache;
    }

    function renderResults(notes: NoteInfo[], query: string): void {
      pickerResults.innerHTML = "";
      const q = query.trim().toLowerCase();
      const matches = notes
        .filter((n) => !selectedFiles.includes(n.file))
        .filter(
          (n) =>
            q.length === 0 ||
            n.title.toLowerCase().includes(q) ||
            n.slug.toLowerCase().includes(q),
        )
        .slice(0, 20);
      for (const note of matches) {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "le-picker-result";
        const title = document.createElement("span");
        title.textContent = note.title || note.slug;
        const slug = document.createElement("span");
        slug.className = "le-picker-result-slug";
        slug.textContent = note.slug;
        el.append(title, slug);
        el.addEventListener("click", () => {
          addFile(note.file);
          picker.hidden = true;
          pickerInput.value = "";
        });
        pickerResults.append(el);
      }
    }

    addFileBtn.addEventListener("click", async () => {
      picker.hidden = !picker.hidden;
      if (picker.hidden) return;
      pickerInput.value = "";
      pickerInput.focus();
      renderResults(await loadNotes(), "");
    });

    pickerInput.addEventListener("input", async () => {
      renderResults(await loadNotes(), pickerInput.value);
    });

    win.addEventListener("click", (e) => {
      if (
        !picker.hidden &&
        !picker.contains(e.target as Node) &&
        e.target !== addFileBtn
      ) {
        picker.hidden = true;
      }
    });

    // --- submit --------------------------------------------------------

    async function submit(): Promise<void> {
      const comment = commentInput.value.trim();
      if (!comment || selectedFiles.length === 0) return;

      commentInput.value = "";

      await fetch("/__live-edit/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "whole-note",
          files: [...selectedFiles],
          comment,
        }),
      });
    }

    sendBtn.addEventListener("click", submit);
    commentInput.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void submit();
      }
    });

    // --- item rendering --------------------------------------------------

    // Deleting files is the one destructive action a proposal can carry, so
    // it gets a distinct confirmation - naming the exact files - on top of
    // (not instead of) the click on Apply itself. The relay also refuses to
    // delete without a matching confirmDelete flag in the request body, so
    // this isn't just a client-side nicety.
    async function applyItem(item: FeedbackItem): Promise<void> {
      const deletions = item.deletions ?? [];
      if (deletions.length > 0) {
        const ok = window.confirm(
          `Delete ${deletions.length} file(s)?\n\n${deletions.join("\n")}\n\nThis removes them from disk (recoverable via git, but not from this widget).`,
        );
        if (!ok) return;
        await fetch(`/__live-edit/apply/${item.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirmDelete: true }),
        });
        return;
      }
      await fetch(`/__live-edit/apply/${item.id}`, { method: "POST" });
    }

    const itemEls = new Map<string, HTMLElement>();
    let hasProposedItem = false;

    function renderItem(item: FeedbackItem): void {
      let el = itemEls.get(item.id);
      if (!el) {
        el = document.createElement("div");
        el.className = "le-item";
        el.innerHTML = ITEM_MARKUP;
        itemEls.set(item.id, el);
        list.prepend(el);
      }

      el.dataset.status = item.status;
      el.querySelector("[data-le-files-label]")!.textContent = item.files
        .map((f) => f.replace(/^docs\//, "").replace(/\.mdx?$/, ""))
        .join(", ");
      el.querySelector("[data-le-comment-text]")!.textContent = item.comment;
      el.querySelector("[data-le-status]")!.textContent = statusLabel(item);

      const progressEl = el.querySelector<HTMLElement>("[data-le-progress]")!;
      progressEl.textContent = item.progress.at(-1) ?? "";
      progressEl.hidden =
        item.status !== "running" || item.progress.length === 0;

      const summaryEl = el.querySelector<HTMLElement>("[data-le-summary]")!;
      summaryEl.textContent = item.summary ?? "";
      summaryEl.hidden = !item.summary;

      const diffEl = el.querySelector<HTMLElement>("[data-le-diff]")!;
      diffEl.innerHTML = "";
      diffEl.hidden = !item.changes || item.changes.length === 0;
      for (const change of item.changes ?? []) {
        if ((item.changes?.length ?? 0) > 1) {
          const label = document.createElement("div");
          label.className = "le-edit-file";
          label.textContent = change.file;
          diffEl.append(label);
        }
        for (const edit of change.edits) {
          const oldEl = document.createElement("del");
          oldEl.textContent = edit.old;
          const newEl = document.createElement("ins");
          newEl.textContent = edit.new;
          const wrap = document.createElement("div");
          wrap.className = "le-edit";
          wrap.append(oldEl, newEl);
          diffEl.append(wrap);
        }
      }

      const deletionsEl = el.querySelector<HTMLElement>("[data-le-deletions]")!;
      deletionsEl.innerHTML = "";
      const deletions = item.deletions ?? [];
      deletionsEl.hidden = deletions.length === 0;
      if (deletions.length > 0) {
        const label = document.createElement("div");
        label.className = "le-deletions-label";
        label.textContent = `Delete ${deletions.length} file(s):`;
        deletionsEl.append(label);
        for (const file of deletions) {
          const row = document.createElement("div");
          row.className = "le-deletions-file";
          row.textContent = file;
          deletionsEl.append(row);
        }
      }

      const errorEl = el.querySelector<HTMLElement>("[data-le-error]")!;
      errorEl.textContent = item.error ?? "";
      errorEl.hidden = !item.error;

      const actions = el.querySelector<HTMLElement>("[data-le-actions]")!;
      actions.hidden = item.status !== "proposed";

      const refineForm = el.querySelector<HTMLElement>("[data-le-refine]")!;
      refineForm.hidden = !(
        item.status === "proposed" || item.status === "error"
      );

      const applyBtn = el.querySelector<HTMLButtonElement>("[data-le-apply]")!;
      applyBtn.onclick = () => void applyItem(item);

      const discardBtn =
        el.querySelector<HTMLButtonElement>("[data-le-discard]")!;
      discardBtn.onclick = () =>
        fetch(`/__live-edit/discard/${item.id}`, { method: "POST" });

      const refineInput = el.querySelector<HTMLTextAreaElement>(
        "[data-le-refine-input]",
      )!;
      const refineBtn = el.querySelector<HTMLButtonElement>(
        "[data-le-refine-btn]",
      )!;
      refineBtn.onclick = () => {
        const comment = refineInput.value.trim();
        if (!comment) return;
        refineInput.value = "";
        void fetch(`/__live-edit/refine/${item.id}`, {
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

    // This window only covers "whole-note" items - a "selection" item
    // renders inline in the article by the per-note widget
    // (live-edit.astro), which only has the live DOM Range needed to anchor
    // it. Every item still gets dispatched as a "le-item" DOM event, which
    // is how that widget learns about updates to items it submitted.
    function handleItem(item: FeedbackItem): void {
      document.dispatchEvent(new CustomEvent("le-item", { detail: item }));
      if (item.kind === "whole-note") {
        renderItem(item);
        recomputeNotification();
      }
    }

    function recomputeNotification(): void {
      const anyProposed = [...itemEls.keys()].some((id) => {
        const el = itemEls.get(id)!;
        return el.dataset.status === "proposed";
      });
      if (anyProposed !== hasProposedItem) {
        hasProposedItem = anyProposed;
        app.toggleNotification({ state: anyProposed, level: "info" });
      }
    }

    app.onToggled(({ state }) => {
      if (state) app.toggleNotification({ state: false });
    });

    const es = new EventSource("/__live-edit/events");
    es.onmessage = (ev) => {
      const msg = JSON.parse(ev.data) as
        | { type: "snapshot"; items: FeedbackItem[] }
        | { type: "item"; item: FeedbackItem };
      if (msg.type === "snapshot") {
        for (const item of msg.items) handleItem(item);
      } else {
        handleItem(msg.item);
      }
    };
  },
} satisfies DevToolbarApp;
