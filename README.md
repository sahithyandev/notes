# Notes

A static site built with Astro 6 that renders Markdown notes organized by semester.

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
