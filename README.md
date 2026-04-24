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

## Adding Notes

Notes are Markdown files in `docs/`. After adding or renaming any `.md` file, run the slug script:

```sh
bun scripts/auto-slug.ts <path/to/file.md>
```

Files must be named with a numeric prefix (e.g. `01-introduction.md`). The prefix is stripped from the URL slug and becomes the sidebar order.
