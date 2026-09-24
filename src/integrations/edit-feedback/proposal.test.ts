import { test, expect } from "bun:test";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  parseProposal,
  ProposalParseError,
  checkEdits,
  resolveDocPath,
  PathOutsideDocsError,
  applyEdits,
} from "./proposal.ts";

test("parses a well-formed proposal block", () => {
  const reply = `Here's my suggestion.

\`\`\`json
{
  "file": "docs/s1/foo.md",
  "summary": "Shorten the sentence",
  "edits": [{ "old": "the quick brown fox", "new": "the fox" }]
}
\`\`\`
`;
  const proposal = parseProposal(reply);
  expect(proposal.file).toBe("docs/s1/foo.md");
  expect(proposal.summary).toBe("Shorten the sentence");
  expect(proposal.edits).toEqual([
    { old: "the quick brown fox", new: "the fox" },
  ]);
});

test("uses the last json block when several are present", () => {
  const reply = `An example:
\`\`\`json
{"file": "example.md", "summary": "example", "edits": [{"old": "x", "new": "y"}]}
\`\`\`

My actual proposal:
\`\`\`json
{"file": "docs/real.md", "summary": "real", "edits": [{"old": "a", "new": "b"}]}
\`\`\`
`;
  const proposal = parseProposal(reply);
  expect(proposal.file).toBe("docs/real.md");
});

test("throws when no json block is present", () => {
  expect(() => parseProposal("just some prose")).toThrow(ProposalParseError);
});

test("throws on invalid json", () => {
  const reply = "```json\n{not valid\n```";
  expect(() => parseProposal(reply)).toThrow(ProposalParseError);
});

test("throws when required fields are missing", () => {
  const reply = '```json\n{"file": "a.md"}\n```';
  expect(() => parseProposal(reply)).toThrow(ProposalParseError);
});

test("throws when edits is empty", () => {
  const reply = '```json\n{"file": "a.md", "summary": "s", "edits": []}\n```';
  expect(() => parseProposal(reply)).toThrow(ProposalParseError);
});

test("checkEdits finds a unique match", () => {
  const content = "the quick brown fox jumps";
  const mismatches = checkEdits(content, [
    { old: "quick brown fox", new: "fox" },
  ]);
  expect(mismatches).toEqual([]);
});

test("checkEdits flags a missing match", () => {
  const content = "the quick brown fox jumps";
  const mismatches = checkEdits(content, [{ old: "slow turtle", new: "x" }]);
  expect(mismatches).toEqual([
    { index: 0, old: "slow turtle", occurrences: 0 },
  ]);
});

test("checkEdits flags a duplicated match", () => {
  const content = "fox fox";
  const mismatches = checkEdits(content, [{ old: "fox", new: "wolf" }]);
  expect(mismatches).toEqual([{ index: 0, old: "fox", occurrences: 2 }]);
});

test("resolveDocPath accepts a path inside docs/", () => {
  const docsRoot = "/repo/docs";
  const resolved = resolveDocPath(docsRoot, "docs/s1/foo.md");
  expect(resolved).toBe("/repo/docs/s1/foo.md");
});

test("resolveDocPath rejects a path outside docs/", () => {
  const docsRoot = "/repo/docs";
  expect(() => resolveDocPath(docsRoot, "../.env")).toThrow(
    PathOutsideDocsError,
  );
  expect(() => resolveDocPath(docsRoot, "package.json")).toThrow(
    PathOutsideDocsError,
  );
});

test("applyEdits writes the file when all edits are unambiguous", async () => {
  const dir = await mkdtemp(join(tmpdir(), "edit-feedback-"));
  const file = join(dir, "note.md");
  await writeFile(file, "the quick brown fox jumps", "utf-8");

  const result = await applyEdits(file, [
    { old: "quick brown fox", new: "fox" },
  ]);
  expect(result.ok).toBe(true);
  expect(await readFile(file, "utf-8")).toBe("the fox jumps");

  await rm(dir, { recursive: true, force: true });
});

test("applyEdits writes nothing when a mismatch exists", async () => {
  const dir = await mkdtemp(join(tmpdir(), "edit-feedback-"));
  const file = join(dir, "note.md");
  await writeFile(file, "the quick brown fox jumps", "utf-8");

  const result = await applyEdits(file, [{ old: "slow turtle", new: "fox" }]);
  expect(result.ok).toBe(false);
  expect(result.mismatches).toEqual([
    { index: 0, old: "slow turtle", occurrences: 0 },
  ]);
  expect(await readFile(file, "utf-8")).toBe("the quick brown fox jumps");

  await rm(dir, { recursive: true, force: true });
});
