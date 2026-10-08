// Wires up the helpful/not-helpful buttons of the .note-feedback block in
// the current document. Exported so a soft navigation (note-swap.ts) can
// re-run it against the freshly swapped-in block.
export function initNoteFeedback(): void {
  const container = document.querySelector<HTMLElement>(".note-feedback");
  if (!container) return;

  const slug = container.dataset.slug ?? "";
  const storageKey = `sn-vote-${slug}`;
  const btns =
    container.querySelectorAll<HTMLButtonElement>(".note-feedback-btn");
  const upCountEl = container.querySelector<HTMLElement>('[data-count="up"]')!;
  const downCountEl = container.querySelector<HTMLElement>(
    '[data-count="down"]',
  )!;

  let inflight = false;
  let voted = false;

  function markActive(vote: number | null) {
    btns.forEach((btn) => {
      const v = Number(btn.dataset.vote);
      const active = vote !== null && v === vote;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
  }

  function setCounts(up: number, down: number) {
    upCountEl.textContent = String(up);
    downCountEl.textContent = String(down);
  }

  // Restore prior vote highlight from localStorage
  const stored = localStorage.getItem(storageKey);
  if (stored === "1" || stored === "-1") {
    markActive(Number(stored));
  }

  // Fetch live counts on load (static build bakes in stale zeros)
  fetch(`/api/votes?slug=${encodeURIComponent(slug)}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      // A click may have already landed (and its own POST response
      // applied) while this was in flight; don't clobber it.
      if (!voted && data && typeof data.up === "number") {
        setCounts(data.up, data.down);
      }
    })
    .catch(() => {});

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (inflight) return;
      voted = true;
      const vote = Number(btn.dataset.vote) as 1 | -1;
      const prevVote = localStorage.getItem(storageKey);
      const isUndo = prevVote === String(vote);
      const sentVote: 0 | 1 | -1 = isUndo ? 0 : vote;

      // Optimistic UI
      let up = Number(upCountEl.textContent) || 0;
      let down = Number(downCountEl.textContent) || 0;
      // Remove effect of previous vote
      if (prevVote === "1") up = Math.max(0, up - 1);
      if (prevVote === "-1") down = Math.max(0, down - 1);
      // Apply new vote
      if (sentVote === 1) up++;
      if (sentVote === -1) down++;
      setCounts(up, down);

      if (isUndo) {
        localStorage.removeItem(storageKey);
        markActive(null);
      } else {
        localStorage.setItem(storageKey, String(vote));
        markActive(vote);
      }

      inflight = true;
      fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, vote: sentVote }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data && typeof data.up === "number") {
            setCounts(data.up, data.down);
            window.stonks?.event("vote", "/" + slug, { vote: sentVote });
          }
        })
        .catch(() => {})
        .finally(() => {
          inflight = false;
        });
    });
  });
}
