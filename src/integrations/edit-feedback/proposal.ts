import { readFile, writeFile } from "node:fs/promises";
import { resolve, sep } from "node:path";

export interface ProposedEdit {
  old: string;
  new: string;
}

export interface Proposal {
  file: string;
  summary: string;
  edits: ProposedEdit[];
}

export class ProposalParseError extends Error {}

// Finds the last ```json fenced block in the agent's reply and validates its
// shape. The agent is instructed (see prompt.ts) to end every reply with
// exactly one such block; "last" guards against an example block earlier in
// a longer explanation being picked up by mistake.
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

  if (typeof obj.file !== "string" || obj.file.length === 0) {
    throw new ProposalParseError("Proposal.file must be a non-empty string");
  }
  if (typeof obj.summary !== "string" || obj.summary.length === 0) {
    throw new ProposalParseError("Proposal.summary must be a non-empty string");
  }
  if (!Array.isArray(obj.edits) || obj.edits.length === 0) {
    throw new ProposalParseError("Proposal.edits must be a non-empty array");
  }

  const edits: ProposedEdit[] = obj.edits.map((e, i) => {
    if (typeof e !== "object" || e === null) {
      throw new ProposalParseError(`Proposal.edits[${i}] must be an object`);
    }
    const edit = e as Record<string, unknown>;
    if (typeof edit.old !== "string" || edit.old.length === 0) {
      throw new ProposalParseError(
        `Proposal.edits[${i}].old must be a non-empty string`,
      );
    }
    if (typeof edit.new !== "string") {
      throw new ProposalParseError(`Proposal.edits[${i}].new must be a string`);
    }
    return { old: edit.old, new: edit.new };
  });

  return { file: obj.file, summary: obj.summary, edits };
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

export interface ApplyResult {
  ok: boolean;
  mismatches: EditMismatch[];
}

// Applies all edits in one pass only if every one of them is unambiguous;
// otherwise nothing is written and the mismatches are returned so the caller
// can report them back to the agent for a corrected proposal.
export async function applyEdits(
  absPath: string,
  edits: ProposedEdit[],
): Promise<ApplyResult> {
  const content = await readFile(absPath, "utf-8");
  const mismatches = checkEdits(content, edits);
  if (mismatches.length > 0) {
    return { ok: false, mismatches };
  }

  let next = content;
  for (const edit of edits) {
    next = next.replace(edit.old, edit.new);
  }
  await writeFile(absPath, next, "utf-8");
  return { ok: true, mismatches: [] };
}
