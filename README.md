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

Files must be named with a numeric prefix (e.g. `01-introduction.md`). The prefix isn't written into frontmatter: a note's URL slug and sidebar order are derived straight from its file path at build/dev time (`src/utils/note-path.ts`, wired into `src/content.config.ts`), so renaming or renumbering a file is all it takes to change either. The sync script still handles the numeric renumbering itself, the `.md` → `.mdx` rename, and stamping `dateCreated`/`lastUpdatedOn`.

To check note content for style/link issues without a full build:

```sh
bun run check-notes-style
```

Add `-- --filter <name>` to scope it to a semester, module, submodule, or note (e.g. `--filter s1/mathematics`).

The same checks (title case, label/description formatting, dashes, math delimiters, broken links, and more) also run as part of `bun dev` and `bun build`, and the build fails on any violation.

## Note Metadata

Every note is validated against the `notes` schema in `src/content.config.ts`. Frontmatter fields:

| Field           | Required? | Notes                                                                                           |
| :-------------- | :-------- | :---------------------------------------------------------------------------------------------- |
| `title`         | Yes       | Also used as the page's `<h1>`; must be title-cased and ≤40 characters.                         |
| `dateCreated`   | No        | Set once by the sync script from the file's creation time; kept as-is after that.               |
| `lastUpdatedOn` | No        | Stamped fresh by the sync script only when a commit actually changes the note's content.        |
| `sidebar.label` | No        | Overrides the sidebar's display text; falls back to `title` when absent.                        |
| `keywords`      | No        | Array of strings; not currently rendered, reserved for future SEO/search use.                   |
| `prereqs`       | No        | Array of slugs for notes in _other_ modules this one assumes; same-module entries are rejected. |
| `authors`       | No        | Array of author slugs from `src/data/authors.json`; defaults to `sahithyan` when omitted.       |

**`slug` and `sidebar.order` are not frontmatter fields.** Both are derived at build/dev time straight from the file path by `slugFromDocsPath`/`orderFromFilePath` (`src/utils/note-path.ts`), which is wired into the `notes` collection's `generateId` in `content.config.ts`. Renaming or renumbering a file (`01-`, `02-`, ...) is all it takes to change either; nothing needs to be written by hand. A note may still carry a leftover `slug` or `sidebar.order` key from before this changed, the schema ignores it, and `scripts/sync-note-metadata.ts` deletes it (along with the older, likewise-dead `prev`/`next` fields) the next time it happens to rewrite that file, rather than proactively across the whole corpus.

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
