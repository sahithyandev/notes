import { test, expect } from "bun:test";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  parseProposal,
  ProposalParseError,
  checkEdits,
  resolveDocPath,
  PathOutsideDocsError,
  applyProposal,
} from "./proposal.ts";

test("parses a well-formed single-file proposal", () => {
  const reply = `Here's my suggestion.

\`\`\`json
{
  "summary": "Shorten the sentence",
  "changes": [
    {
      "file": "docs/s1/foo.md",
      "edits": [{ "old": "the quick brown fox", "new": "the fox" }]
    }
  ]
}
\`\`\`
`;
  const proposal = parseProposal(reply);
  expect(proposal.summary).toBe("Shorten the sentence");
  expect(proposal.changes).toEqual([
    {
      file: "docs/s1/foo.md",
      edits: [{ old: "the quick brown fox", new: "the fox" }],
    },
  ]);
});

test("parses a proposal that touches several files", () => {
  const reply = `\`\`\`json
{
  "summary": "Merge the intro into the overview note",
  "changes": [
    { "file": "docs/a.md", "edits": [{ "old": "x", "new": "" }] },
    { "file": "docs/b.md", "edits": [{ "old": "y", "new": "x plus y" }] }
  ]
}
\`\`\`
`;
  const proposal = parseProposal(reply);
  expect(proposal.changes).toHaveLength(2);
  expect(proposal.changes[0].file).toBe("docs/a.md");
  expect(proposal.changes[1].file).toBe("docs/b.md");
});

test("uses the last json block when several are present", () => {
  const reply = `An example:
\`\`\`json
{"summary": "example", "changes": [{"file": "example.md", "edits": [{"old": "x", "new": "y"}]}]}
\`\`\`

My actual proposal:
\`\`\`json
{"summary": "real", "changes": [{"file": "docs/real.md", "edits": [{"old": "a", "new": "b"}]}]}
\`\`\`
`;
  const proposal = parseProposal(reply);
  expect(proposal.changes[0].file).toBe("docs/real.md");
});

test("throws when no json block is present", () => {
  expect(() => parseProposal("just some prose")).toThrow(ProposalParseError);
});

test("throws on invalid json", () => {
  const reply = "```json\n{not valid\n```";
  expect(() => parseProposal(reply)).toThrow(ProposalParseError);
});

test("throws when summary is missing", () => {
  const reply =
    '```json\n{"changes": [{"file": "a.md", "edits": [{"old": "x", "new": "y"}]}]}\n```';
  expect(() => parseProposal(reply)).toThrow(ProposalParseError);
});

test("throws when changes is empty", () => {
  const reply = '```json\n{"summary": "s", "changes": []}\n```';
  expect(() => parseProposal(reply)).toThrow(ProposalParseError);
});

test("throws when a change has no edits", () => {
  const reply =
    '```json\n{"summary": "s", "changes": [{"file": "a.md", "edits": []}]}\n```';
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

test("applyProposal writes every file when all edits are unambiguous", async () => {
  const dir = await mkdtemp(join(tmpdir(), "edit-feedback-"));
  const docsRoot = join(dir, "docs");
  await mkdir(docsRoot, { recursive: true });
  await writeFile(join(docsRoot, "a.md"), "hello world", "utf-8");
  await writeFile(join(docsRoot, "b.md"), "goodbye world", "utf-8");

  const result = await applyProposal(docsRoot, [
    { file: "docs/a.md", edits: [{ old: "hello", new: "hi" }] },
    { file: "docs/b.md", edits: [{ old: "goodbye", new: "bye" }] },
  ]);
  expect(result.ok).toBe(true);
  expect(await readFile(join(docsRoot, "a.md"), "utf-8")).toBe("hi world");
  expect(await readFile(join(docsRoot, "b.md"), "utf-8")).toBe("bye world");

  await rm(dir, { recursive: true, force: true });
});

test("applyProposal writes nothing when any file has a mismatch", async () => {
  const dir = await mkdtemp(join(tmpdir(), "edit-feedback-"));
  const docsRoot = join(dir, "docs");
  await mkdir(docsRoot, { recursive: true });
  await writeFile(join(docsRoot, "a.md"), "hello world", "utf-8");
  await writeFile(join(docsRoot, "b.md"), "goodbye world", "utf-8");

  const result = await applyProposal(docsRoot, [
    { file: "docs/a.md", edits: [{ old: "hello", new: "hi" }] },
    { file: "docs/b.md", edits: [{ old: "nonexistent", new: "bye" }] },
  ]);
  expect(result.ok).toBe(false);
  expect(result.fileMismatches).toEqual([
    {
      file: "docs/b.md",
      mismatches: [{ index: 0, old: "nonexistent", occurrences: 0 }],
    },
  ]);
  // Neither file was written, even though a.md's edit was unambiguous.
  expect(await readFile(join(docsRoot, "a.md"), "utf-8")).toBe("hello world");
  expect(await readFile(join(docsRoot, "b.md"), "utf-8")).toBe("goodbye world");

  await rm(dir, { recursive: true, force: true });
});
