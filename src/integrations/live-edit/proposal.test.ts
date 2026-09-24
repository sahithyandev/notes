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

test("parses a deletion-only proposal (no changes)", () => {
  const reply = `\`\`\`json
{
  "summary": "Remove three notes",
  "deletions": ["docs/a.mdx", "docs/b.mdx", "docs/c.mdx"]
}
\`\`\`
`;
  const proposal = parseProposal(reply);
  expect(proposal.changes).toEqual([]);
  expect(proposal.deletions).toEqual([
    "docs/a.mdx",
    "docs/b.mdx",
    "docs/c.mdx",
  ]);
});

test("parses a proposal with both changes and deletions", () => {
  const reply = `\`\`\`json
{
  "summary": "Fold a into b, then remove a",
  "changes": [{ "file": "docs/b.md", "edits": [{ "old": "x", "new": "x plus a" }] }],
  "deletions": ["docs/a.md"]
}
\`\`\`
`;
  const proposal = parseProposal(reply);
  expect(proposal.changes).toHaveLength(1);
  expect(proposal.deletions).toEqual(["docs/a.md"]);
});

test("throws when deletions is not an array", () => {
  const reply = '```json\n{"summary": "s", "deletions": "docs/a.md"}\n```';
  expect(() => parseProposal(reply)).toThrow(ProposalParseError);
});

test("throws when a deletions entry is not a string", () => {
  const reply = '```json\n{"summary": "s", "deletions": [42]}\n```';
  expect(() => parseProposal(reply)).toThrow(ProposalParseError);
});

test("throws when changes and deletions are both empty", () => {
  const reply =
    '```json\n{"summary": "s", "changes": [], "deletions": []}\n```';
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
  const dir = await mkdtemp(join(tmpdir(), "live-edit-"));
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
  const dir = await mkdtemp(join(tmpdir(), "live-edit-"));
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

test("applyProposal deletes files and can combine deletions with edits", async () => {
  const dir = await mkdtemp(join(tmpdir(), "live-edit-"));
  const docsRoot = join(dir, "docs");
  await mkdir(docsRoot, { recursive: true });
  await writeFile(join(docsRoot, "a.md"), "hello world", "utf-8");
  await writeFile(join(docsRoot, "b.md"), "goodbye world", "utf-8");
  await writeFile(join(docsRoot, "c.md"), "keep me", "utf-8");

  const result = await applyProposal(
    docsRoot,
    [{ file: "docs/c.md", edits: [{ old: "keep", new: "kept" }] }],
    ["docs/a.md", "docs/b.md"],
  );
  expect(result.ok).toBe(true);
  await expect(readFile(join(docsRoot, "a.md"), "utf-8")).rejects.toThrow();
  await expect(readFile(join(docsRoot, "b.md"), "utf-8")).rejects.toThrow();
  expect(await readFile(join(docsRoot, "c.md"), "utf-8")).toBe("kept me");

  await rm(dir, { recursive: true, force: true });
});

test("applyProposal deletes nothing and edits nothing when a deletion target no longer exists", async () => {
  const dir = await mkdtemp(join(tmpdir(), "live-edit-"));
  const docsRoot = join(dir, "docs");
  await mkdir(docsRoot, { recursive: true });
  await writeFile(join(docsRoot, "a.md"), "hello world", "utf-8");
  await writeFile(join(docsRoot, "c.md"), "keep me", "utf-8");
  // "b.md" was already removed by something else before Apply ran.

  const result = await applyProposal(
    docsRoot,
    [{ file: "docs/c.md", edits: [{ old: "keep", new: "kept" }] }],
    ["docs/a.md", "docs/b.md"],
  );
  expect(result.ok).toBe(false);
  expect(result.deletionMismatches).toEqual([
    { file: "docs/b.md", reason: "file no longer exists" },
  ]);
  // Nothing touched, even though a.md exists and c.md's edit was fine.
  expect(await readFile(join(docsRoot, "a.md"), "utf-8")).toBe("hello world");
  expect(await readFile(join(docsRoot, "c.md"), "utf-8")).toBe("keep me");

  await rm(dir, { recursive: true, force: true });
});
