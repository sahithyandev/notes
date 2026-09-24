import { readFile, writeFile } from "node:fs/promises";
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
}

export class ProposalParseError extends Error {}

// Finds the last ```json fenced block in the agent's reply and validates its
// shape. The agent is instructed (see prompt.ts) to end every reply with
// exactly one such block; "last" guards against an example block earlier in
// a longer explanation being picked up by mistake. A proposal can touch
// several files at once (e.g. merging content between two notes), so it's a
// list of per-file changes rather than a single file + edits pair.
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
  if (!Array.isArray(obj.changes) || obj.changes.length === 0) {
    throw new ProposalParseError("Proposal.changes must be a non-empty array");
  }

  const changes: FileChange[] = obj.changes.map((c, i) => {
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

  return { summary: obj.summary, changes };
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

export interface ApplyResult {
  ok: boolean;
  fileMismatches: FileMismatch[];
}

// Applies every file's edits in one pass, only if every edit in every file
// is unambiguous - across the whole proposal, not just one file at a time,
// so a cross-note merge either lands completely or not at all. Nothing is
// written if any file has a mismatch; the mismatches are returned so the
// caller can report them back to the agent for a corrected proposal.
export async function applyProposal(
  docsRoot: string,
  changes: FileChange[],
): Promise<ApplyResult> {
  const resolved = changes.map((c) => ({
    change: c,
    absPath: resolveDocPath(docsRoot, c.file),
  }));

  const contents = await Promise.all(
    resolved.map(({ absPath }) => readFile(absPath, "utf-8")),
  );

  const fileMismatches: FileMismatch[] = [];
  for (let i = 0; i < resolved.length; i++) {
    const mismatches = checkEdits(contents[i], resolved[i].change.edits);
    if (mismatches.length > 0) {
      fileMismatches.push({ file: resolved[i].change.file, mismatches });
    }
  }
  if (fileMismatches.length > 0) {
    return { ok: false, fileMismatches };
  }

  await Promise.all(
    resolved.map(({ change, absPath }, i) => {
      let next = contents[i];
      for (const edit of change.edits) {
        next = next.replace(edit.old, edit.new);
      }
      return writeFile(absPath, next, "utf-8");
    }),
  );
  return { ok: true, fileMismatches: [] };
}
