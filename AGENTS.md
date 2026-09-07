# AGENTS.md

Guidance for AI coding agents (Claude Code, OpenCode, and others) working in this repo.

Astro 6 static site. Notes are Markdown files in `docs/`, loaded via content collections and rendered by the page files in `src/pages/`.

## Commands

**bun** is the package manager (Node >= 22.12.0).

```bash
bun dev        # dev server at localhost:4321
bun build      # static build to ./dist/
bun preview    # preview production build
```

No test or lint commands are configured.

Run the slug script whenever `.md` files are added or renamed:

```bash
bun scripts/auto-slug.ts <path/to/file.md> [...]   # add --dry-run to preview
```

## Writing notes

Use the `write-notes` skill whenever writing a new note or editing an existing one, so the content matches Sahithyan's style. For math-heavy or interactive learning content, use `math-teacher`.

Do not hand-edit these automatic fields:

- `lastUpdatedOn` frontmatter is set on commit.
- Numeric file prefixes and `sidebar.order` are managed by `scripts/auto-slug.ts`.

## Slugs & file naming

URLs come from the `slug` frontmatter field, not the file path. `auto-slug.ts` derives everything from a numeric filename prefix:

- `docs/s2/theory-of-electricity/01-introduction.md` becomes slug `s2/theory-of-electricity/introduction`.
- The prefix becomes `sidebar.order`.
- `prev` and `next` are set from position within the directory.

`images/` and `summary/` subdirectories are skipped.

Frontmatter: `title` and `slug` are required; `sidebar.label`, `sidebar.order`, `prev`, `next`, `dateCreated`, `lastUpdatedOn`, `keywords` are optional.

Do not put notes from the same module in `prereqs`. The `prev` / sidebar-order link already conveys ordering within a module, and sibling notes are assumed read. `prereqs` is only for dependencies on notes in _other_ modules.

## Routing

- `src/pages/index.astro` — homepage, notes grouped by semester.
- `src/pages/[sem].astro` — semester overview (modules and notes).
- `src/pages/[...slug].astro` — individual note pages; three-column layout, hand-written prose CSS, `getStaticPaths()` over all notes.
- `src/pages/og/[...slug].ts` — per-note Open Graph images.
- `src/pages/sitemap-index.xml.ts`, `src/pages/sitemaps/[sem].xml.ts` — sitemaps split by semester.

Content collection (`src/content.config.ts`) globs `./docs/**/*.{md,mdx}`. Components live in `src/components/`, shared helpers in `src/utils/` (`index.ts` for helpers like `titleize`, `values.ts` for site constants).

## Styling

- Light/dark mode via `data-theme` on `<html>`, persisted to `localStorage` key `sn-theme`.
- Per-semester accent colors are CSS custom properties `--s1`..`--s8` in `src/styles/global.css`.
- No Tailwind Typography; prose styles are hand-written in `src/pages/[...slug].astro`. `global.css` holds only CSS variables and the box-sizing reset. Other component styles are scoped `<style>` blocks.
- Math: `remark-math` + `rehype-katex`; KaTeX CSS from CDN in `Layout.astro`.
- Custom Markdown classes: `.callout`, `.term`.

## Computer Security notes scope

`docs/s5/computer-security/` module layout:

- `cipher-algorithms/` — one note per specific cipher, classical (shift, substitution, playfair, vigenere, permutation, lorenz) and modern (DES, RSA). `cipher-algorithms/01-introduction.mdx` is a pure index grouping links by category, no theory of its own.
- Top level — everything else: security models and threats, CIA triad, and cipher-family theory not tied to one algorithm (general cipher theory, stream ciphers, block ciphers, block cipher modes, public key cryptography, Diffie-Hellman). Shared theory such as `ciphers.mdx` and `kerckhoffs-principle.mdx` each gets its own note; split further if a note would cover more than one concept.
