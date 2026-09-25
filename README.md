# Notes

A static site built with Astro 7 that renders Markdown notes organized by semester.

## Requirements

- Node >= 22.12.0
- Bun

## Setup

```sh
bun install
```

## Commands

| Command       | Action                                     |
| :------------ | :----------------------------------------- |
| `bun dev`     | Start local dev server at `localhost:4321` |
| `bun build`   | Build production site to `./dist/`         |
| `bun preview` | Preview production build locally           |

## Development

`bun dev` runs a `notes-style-validator` pass on `docs/` as you edit (see below), and the dev server coalesces rapid successive file changes into a single browser reload instead of one per file, so editing several notes in quick succession (by hand, a script, or an AI coding agent) doesn't cause a reload storm.

## Testing

Unit tests use `bun:test` and live next to the code they cover as `*.test.ts`.

```sh
bun test            # run once
bun run test:watch  # re-run on file change
```

`bun test` runs with coverage by default; see `package.json`'s `test` script.

## Adding Notes

Notes are Markdown files in `docs/`. After adding or renaming any `.md` file, run the metadata sync script:

```sh
bun scripts/sync-note-metadata.ts <path/to/file.md>
```

Files must be named with a numeric prefix (e.g. `01-introduction.md`). The prefix is stripped from the URL slug and becomes the sidebar order.

To check note content for style/link issues without a full build:

```sh
bun run check-notes-style
```

Add `-- --filter <name>` to scope it to a semester, module, submodule, or note (e.g. `--filter s1/mathematics`).

The same checks (title case, label/description formatting, dashes, math delimiters, broken links, and more) also run as part of `bun dev` and `bun build`, and the build fails on any violation.

## Onboarding a New Author

This site supports multiple authors. To add someone new:

1. Add an entry to `src/data/authors.json`:
   ```json
   {
     "slug": "your-slug",
     "name": "Your Name",
     "url": "https://your-site.example",
     "github_id": "your-github-username",
     "color": "#hexcode"
   }
   ```
   `slug` is the id other notes reference; `github_id` is optional and, when set, is used to pull a GitHub avatar; `color` is a 6-digit hex code used as that author's accent color on note pages.
2. In any note's frontmatter, list them under `authors` by slug:
   ```
   authors:
     - your-slug
   ```
   A note with no `authors` field defaults to `sahithyan`. A note can list more than one author.

No code changes are needed beyond the `authors.json` entry.

## Contributing

- Commits must not include AI-assistant attribution (`Co-Authored-By`, `Generated with`, etc.) — a commit-msg hook (`.husky/commit-msg`) rejects those.
- See `CLAUDE.md` for the full content style guide (title casing, dash usage, label/description formatting, prereqs scoping, and more) enforced by `notes-style-validator`.
