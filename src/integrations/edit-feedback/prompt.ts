// A request tied to a text selection on one note's rendered page.
export interface SelectionFeedbackRequest {
  kind: "selection";
  filePath: string;
  selection: string;
  heading?: string;
  context?: string;
  comment: string;
}

// A request from the site-wide floating bar: no selection, targets one or
// more explicitly-picked notes (a single note for whole-note feedback, or
// several for a cross-note merge/restructure).
export interface WholeNoteFeedbackRequest {
  kind: "whole-note";
  files: string[];
  comment: string;
}

export type FeedbackRequest =
  SelectionFeedbackRequest | WholeNoteFeedbackRequest;

// Appended once, via --append-system-prompt, to the long-lived agent
// session. It fixes the reply contract (a single trailing ```json block)
// so proposal.ts can parse every reply the same way, regardless of what the
// agent explains in prose above it.
export const SYSTEM_PROMPT = `You are handling inline editing feedback for a note in this Astro notes site,
submitted from the rendered page. Use the write-notes skill for style. You
cannot edit or write files yourself - propose the change instead, and the
relay applies it after the user approves it.

For every request, end your reply with exactly one fenced JSON block, after
any explanation, in this exact shape:

\`\`\`json
{
  "summary": "One sentence describing the change",
  "changes": [
    {
      "file": "docs/<path-to-note>.md",
      "edits": [
        { "old": "<exact text to find, copied verbatim from the file>", "new": "<replacement text>" }
      ]
    }
  ]
}
\`\`\`

"changes" can list more than one file - use this when the feedback asks you
to merge, move, or coordinate content across notes (each file gets its own
entry with its own edits, all applied together).

Rules for each entry's edits:
- Each "old" string must appear in that file's current content, copied
  character-for-character from what you read (including surrounding
  whitespace/newlines) so it matches exactly once.
- Prefer the smallest "old" span that still uniquely identifies the location
  and captures the full change.
- If the requested change cannot be made, or needs clarification, explain why
  in prose and omit the JSON block entirely rather than proposing something
  wrong.
- If you are told a previous proposal did not match the file(s) (a
  "mismatch" follow-up), re-read the affected file(s) and send a corrected
  JSON block.`;

// Builds the one user-turn message sent to the agent for a fresh feedback
// item. Refinement follow-ups (a comment on an existing item) and mismatch
// follow-ups are built separately in index.ts, since they're short and
// specific to the running turn rather than a new request.
export function buildRequestMessage(req: FeedbackRequest): string {
  if (req.kind === "selection") return buildSelectionMessage(req);
  return buildWholeNoteMessage(req);
}

function buildSelectionMessage(req: SelectionFeedbackRequest): string {
  const lines = [`File: ${req.filePath}`];
  if (req.heading) {
    lines.push(`Nearest heading: ${req.heading}`);
  }
  lines.push("", "Selected text:", "---", req.selection, "---");
  if (req.context) {
    lines.push(
      "",
      "Surrounding context (for locating the selection only):",
      "---",
      req.context,
      "---",
    );
  }
  lines.push("", "Feedback:", req.comment);
  return lines.join("\n");
}

function buildWholeNoteMessage(req: WholeNoteFeedbackRequest): string {
  const lines = [
    req.files.length > 1
      ? `Files (this may involve merging or coordinating changes across them):`
      : `File:`,
    ...req.files.map((f) => `- ${f}`),
    "",
    "Feedback:",
    req.comment,
  ];
  return lines.join("\n");
}

export function buildRefineMessage(comment: string): string {
  return `Follow-up on the same item:\n${comment}`;
}

export function buildMismatchMessage(
  fileMismatches: {
    file: string;
    mismatches: { old: string; occurrences: number }[];
  }[],
): string {
  const details = fileMismatches
    .map((fm) => {
      const lines = fm.mismatches
        .map(
          (m) =>
            `- "${m.old}" was found ${m.occurrences} time(s) (expected exactly 1)`,
        )
        .join("\n");
      return `In ${fm.file}:\n${lines}`;
    })
    .join("\n\n");
  return `Your last proposal didn't apply. Re-read the affected file(s) - they may have changed - and send a corrected proposal:\n\n${details}`;
}
