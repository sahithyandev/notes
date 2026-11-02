# Agent Guide

Astro 7 static site. Notes are Markdown files in `docs/`, loaded through content collections and rendered by `src/pages/`.

## Commands

**bun** is the package manager (Node >= 22.12.0).

```bash
bun dev        # dev server at localhost:4321
bun build      # static build to ./dist/
bun preview    # preview production build
bun test       # runs *.test.ts files with bun:test
bun run lint   # bun fmt --check
```

Run the metadata sync script whenever `.md` files are added or renamed:

```bash
bun scripts/sync-note-metadata.ts <path/to/file.md> [...]   # add --dry-run to preview
```

## Task Guides

- Read [`.agents/note-writing.md`](.agents/note-writing.md) before creating or editing a note under `docs/`.
- Read [`.agents/site-architecture.md`](.agents/site-architecture.md) before changing Astro pages, application scripts, routing, styling, or offline behavior.
- Also read [`.agents/illustrations.md`](.agents/illustrations.md) when changing an interactive component under `src/components/illustrations/`.

## Commit Conventions

Never add `Co-Authored-By` lines or any attribution to commit messages, PR descriptions, or git metadata. You are just a tool, that I am paying for. You are helping me do stuff. You cannot be held accountable. Hence you are not given attribution.
