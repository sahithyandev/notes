export interface FeedbackRequest {
  filePath: string;
  slug: string;
  selection: string;
  heading?: string;
  context?: string;
  comment: string;
}

// Appended once, via --append-system-prompt, to the long-lived agent
// session. It fixes the reply contract (a single trailing ```json block)
// so proposal.ts can parse every reply the same way, regardless of what the
// agent explains in prose above it.
export const SYSTEM_PROMPT = `You are handling inline editing feedback for a note in this Astro notes site,
submitted by selecting text on the rendered page. Use the write-notes skill
for style. You cannot edit or write files yourself - propose the change
instead, and the relay applies it after the user approves it.

For every request, end your reply with exactly one fenced JSON block, after
any explanation, in this exact shape:

\`\`\`json
{
  "file": "docs/<path-to-note>.md",
  "summary": "One sentence describing the change",
  "edits": [
    { "old": "<exact text to find, copied verbatim from the file>", "new": "<replacement text>" }
  ]
}
\`\`\`

Rules for the edits array:
- Each "old" string must appear in the file's current content, copied
  character-for-character from what you read (including surrounding
  whitespace/newlines) so it matches exactly once.
- Prefer the smallest "old" span that still uniquely identifies the location
  and captures the full change.
- If the requested change cannot be made, or needs clarification, explain why
  in prose and omit the JSON block entirely rather than proposing something
  wrong.
- If you are told a previous proposal did not match the file (a "mismatch"
  follow-up), re-read the file and send a corrected JSON block.`;

// Builds the one user-turn message sent to the agent for a fresh feedback
// item. Refinement follow-ups (a comment on an existing item) and mismatch
// follow-ups are built separately in index.ts, since they're short and
// specific to the running turn rather than a new request.
export function buildRequestMessage(req: FeedbackRequest): string {
  const lines = [`File: ${req.filePath}`, `Note slug: ${req.slug}`];
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

export function buildRefineMessage(comment: string): string {
  return `Follow-up on the same item:\n${comment}`;
}

export function buildMismatchMessage(
  mismatches: { old: string; occurrences: number }[],
): string {
  const details = mismatches
    .map(
      (m) =>
        `- "${m.old}" was found ${m.occurrences} time(s) in the current file (expected exactly 1)`,
    )
    .join("\n");
  return `Your last proposal didn't apply. Re-read the file - it may have changed - and send a corrected proposal:\n${details}`;
}
