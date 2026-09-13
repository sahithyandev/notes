import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";

const OPEN_RE = /<Note\b([^>]*)>/;
const CLOSE_RE = /<\/Note>/;
const ATTR_RE = /(\w+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

function resolveType(attrs: string): string {
  ATTR_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ATTR_RE.exec(attrs))) {
    if (m[1] === "type") return m[2] ?? m[3] ?? "note";
  }
  return "note";
}

// Two `<Note>` blocks separated by only blank lines, sharing the same
// resolved `type` (a missing `type` prop resolves to "note"). Differing
// `title` props still count as adjacent.
export function checkAdjacentNote(f: ScannedFile): Violation[] {
  const violations: Violation[] = [];

  let openType: string | null = null;
  let pendingClose: { type: string; line: number } | null = null;

  for (let i = 0; i < f.lines.length; i++) {
    if (f.lineIsCode[i]) continue;
    const line = f.lines[i];

    if (openType !== null) {
      if (CLOSE_RE.test(line)) {
        pendingClose = { type: openType, line: i };
        openType = null;
      }
      continue;
    }

    if (line.trim() === "") continue; // blank lines don't break adjacency

    const openMatch = OPEN_RE.exec(line);
    if (openMatch) {
      const type = resolveType(openMatch[1]);
      if (pendingClose && pendingClose.type === type) {
        violations.push({
          rule: "adjacent-note",
          line: i + 1,
          text: `<Note type="${type}"> opens right after a same-type <Note> closed at L${pendingClose.line + 1}`,
          snippet: `adjacent:${type}`,
        });
      }
      pendingClose = null;
      openType = type;
      if (CLOSE_RE.test(line)) {
        // Same-line open + close.
        pendingClose = { type, line: i };
        openType = null;
      }
      continue;
    }

    // Any other non-blank content breaks adjacency.
    pendingClose = null;
  }

  return violations;
}
