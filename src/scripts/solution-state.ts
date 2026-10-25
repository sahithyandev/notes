// Remembers which <Solution> blocks of a note are revealed, keyed on the
// current path, so a reload or a soft navigation back to the note reopens
// them. Blocks are matched by their order within the note.
const STORAGE_PREFIX = "sn-solutions:";

// Blocks opened by restoreSolutions(), so the toggle handler can tell them
// apart from a reveal by the reader.
const restoring = new WeakSet<HTMLDetailsElement>();

function solutions(): HTMLDetailsElement[] {
  return [
    ...document.querySelectorAll<HTMLDetailsElement>("main details.solution"),
  ];
}

export function saveSolutions(): void {
  const open = solutions().flatMap((el, i) => (el.open ? [i] : []));
  const key = STORAGE_PREFIX + location.pathname;
  try {
    if (open.length) sessionStorage.setItem(key, JSON.stringify(open));
    else sessionStorage.removeItem(key);
  } catch {
    // ignore (private mode, quota, etc.)
  }
}

export function restoreSolutions(): void {
  let open: number[];
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + location.pathname);
    open = raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return;
  }
  solutions().forEach((el, i) => {
    if (!open.includes(i) || el.open) return;
    restoring.add(el);
    el.open = true;
  });
}

// Setting `open` fires a toggle event later, so this is checked there.
export function isRestoredToggle(el: HTMLDetailsElement): boolean {
  return restoring.delete(el);
}
