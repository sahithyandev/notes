import { access, readFile, unlink, writeFile } from "node:fs/promises";
import { resolve, sep } from "node:path";

export interface ProposedEdit {
  old: string;
  new: string;
}

export interface FileChange {
  file: string;
  edits: ProposedEdit[];
}

export interface Proposal {
  summary: string;
  changes: FileChange[];
  // Files to delete outright, e.g. removing a note (and its siblings) from
  // the corpus - not expressible as an edit, since there's no "old" text to
  // match against a file that shouldn't exist afterward.
  deletions: string[];
}

export class ProposalParseError extends Error {}

// Finds the last ```json fenced block in the agent's reply and validates its
// shape. The agent is instructed (see prompt.ts) to end every reply with
// exactly one such block; "last" guards against an example block earlier in
// a longer explanation being picked up by mistake. A proposal can touch
// several files at once (e.g. merging content between two notes), so it's a
// list of per-file changes rather than a single file + edits pair, plus an
// optional list of whole files to delete.
export function parseProposal(text: string): Proposal {
  const matches = [...text.matchAll(/```json\s*\n([\s\S]*?)```/g)];
  if (matches.length === 0) {
    throw new ProposalParseError("No ```json proposal block found in reply");
  }
  const raw = matches[matches.length - 1][1];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new ProposalParseError(
      `Proposal block is not valid JSON: ${err instanceof Error ? err.message : err}`,
    );
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new ProposalParseError("Proposal must be a JSON object");
  }
  const obj = parsed as Record<string, unknown>;

  if (typeof obj.summary !== "string" || obj.summary.length === 0) {
    throw new ProposalParseError("Proposal.summary must be a non-empty string");
  }

  const rawChanges = obj.changes ?? [];
  if (!Array.isArray(rawChanges)) {
    throw new ProposalParseError("Proposal.changes must be an array");
  }
  const changes: FileChange[] = rawChanges.map((c, i) => {
    if (typeof c !== "object" || c === null) {
      throw new ProposalParseError(`Proposal.changes[${i}] must be an object`);
    }
    const change = c as Record<string, unknown>;
    if (typeof change.file !== "string" || change.file.length === 0) {
      throw new ProposalParseError(
        `Proposal.changes[${i}].file must be a non-empty string`,
      );
    }
    if (!Array.isArray(change.edits) || change.edits.length === 0) {
      throw new ProposalParseError(
        `Proposal.changes[${i}].edits must be a non-empty array`,
      );
    }
    const edits: ProposedEdit[] = change.edits.map((e, j) => {
      if (typeof e !== "object" || e === null) {
        throw new ProposalParseError(
          `Proposal.changes[${i}].edits[${j}] must be an object`,
        );
      }
      const edit = e as Record<string, unknown>;
      if (typeof edit.old !== "string" || edit.old.length === 0) {
        throw new ProposalParseError(
          `Proposal.changes[${i}].edits[${j}].old must be a non-empty string`,
        );
      }
      if (typeof edit.new !== "string") {
        throw new ProposalParseError(
          `Proposal.changes[${i}].edits[${j}].new must be a string`,
        );
      }
      return { old: edit.old, new: edit.new };
    });
    return { file: change.file, edits };
  });

  const rawDeletions = obj.deletions ?? [];
  if (!Array.isArray(rawDeletions)) {
    throw new ProposalParseError("Proposal.deletions must be an array");
  }
  const deletions: string[] = rawDeletions.map((d, i) => {
    if (typeof d !== "string" || d.length === 0) {
      throw new ProposalParseError(
        `Proposal.deletions[${i}] must be a non-empty string`,
      );
    }
    return d;
  });

  if (changes.length === 0 && deletions.length === 0) {
    throw new ProposalParseError(
      "Proposal must have at least one entry in changes or deletions",
    );
  }

  return { summary: obj.summary, changes, deletions };
}

export interface EditMismatch {
  index: number;
  old: string;
  occurrences: number;
}

// Each `old` string must appear exactly once in `content`, both so the
// replacement is unambiguous and so a stale proposal (the file changed since
// the agent read it) is caught instead of silently corrupting the file.
export function checkEdits(
  content: string,
  edits: ProposedEdit[],
): EditMismatch[] {
  const mismatches: EditMismatch[] = [];
  for (let i = 0; i < edits.length; i++) {
    const occurrences = countOccurrences(content, edits[i].old);
    if (occurrences !== 1) {
      mismatches.push({ index: i, old: edits[i].old, occurrences });
    }
  }
  return mismatches;
}

function countOccurrences(haystack: string, needle: string): number {
  if (needle.length === 0) return 0;
  let count = 0;
  let idx = 0;
  while (true) {
    const found = haystack.indexOf(needle, idx);
    if (found === -1) break;
    count++;
    idx = found + needle.length;
  }
  return count;
}

export class PathOutsideDocsError extends Error {}

// Resolves a proposal's `file` field (as given by the agent, relative to the
// repo root) against docsRoot, and rejects anything that would land outside
// docs/ - defense against a path like "../../.env" ever reaching a write.
export function resolveDocPath(docsRoot: string, file: string): string {
  const resolved = resolve(docsRoot, "..", file);
  const normalizedRoot = resolve(docsRoot) + sep;
  if (!resolved.startsWith(normalizedRoot)) {
    throw new PathOutsideDocsError(
      `Proposal file "${file}" resolves outside docs/`,
    );
  }
  return resolved;
}

export interface FileMismatch {
  file: string;
  mismatches: EditMismatch[];
}

export interface DeletionMismatch {
  file: string;
  reason: string;
}

export interface ApplyResult {
  ok: boolean;
  fileMismatches: FileMismatch[];
  deletionMismatches: DeletionMismatch[];
}

// Applies every file's edits and every requested deletion in one pass, only
// if every edit is unambiguous and every file to delete still exists -
// across the whole proposal, not just one entry at a time, so a multi-file
// change (a cross-note merge, or removing a run of notes) either lands
// completely or not at all. Nothing is written or deleted if anything
// mismatches; the mismatches are returned so the caller can report them
// back to the agent for a corrected proposal.
export async function applyProposal(
  docsRoot: string,
  changes: FileChange[],
  deletions: string[] = [],
): Promise<ApplyResult> {
  const resolvedChanges = changes.map((c) => ({
    change: c,
    absPath: resolveDocPath(docsRoot, c.file),
  }));
  const resolvedDeletions = deletions.map((file) => ({
    file,
    absPath: resolveDocPath(docsRoot, file),
  }));

  const contents = await Promise.all(
    resolvedChanges.map(({ absPath }) => readFile(absPath, "utf-8")),
  );

  const fileMismatches: FileMismatch[] = [];
  for (let i = 0; i < resolvedChanges.length; i++) {
    const mismatches = checkEdits(contents[i], resolvedChanges[i].change.edits);
    if (mismatches.length > 0) {
      fileMismatches.push({ file: resolvedChanges[i].change.file, mismatches });
    }
  }

  const deletionMismatches: DeletionMismatch[] = [];
  for (const { file, absPath } of resolvedDeletions) {
    const exists = await access(absPath).then(
      () => true,
      () => false,
    );
    if (!exists) {
      deletionMismatches.push({ file, reason: "file no longer exists" });
    }
  }

  if (fileMismatches.length > 0 || deletionMismatches.length > 0) {
    return { ok: false, fileMismatches, deletionMismatches };
  }

  await Promise.all([
    ...resolvedChanges.map(({ change, absPath }, i) => {
      let next = contents[i];
      for (const edit of change.edits) {
        // A function replacer, not the string itself: String.replace()
        // treats a string replacement specially ($$ collapses to a literal
        // $, $&/$n substitute the match/a capture group), which silently
        // corrupts any proposed edit whose `new` text contains "$$" - block
        // math delimiters, all over this site's notes. A function's return
        // value is inserted verbatim, with none of that.
        next = next.replace(edit.old, () => edit.new);
      }
      return writeFile(absPath, next, "utf-8");
    }),
    ...resolvedDeletions.map(({ absPath }) => unlink(absPath)),
  ]);
  return { ok: true, fileMismatches: [], deletionMismatches: [] };
}
