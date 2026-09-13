# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, OpenCode, and others) when working with code in this repository.

## Commands

Uses **bun** as the package manager (Node >= 22.12.0 required).

```bash
bun dev        # dev server at localhost:4321
bun build      # static build to ./dist/
bun preview    # preview production build
```

No test or lint commands are configured.

**Slug maintenance script** — must be run manually whenever `.md` files are added or renamed:

```bash
bun scripts/auto-slug.ts <path/to/file.md> [...]
bun scripts/auto-slug.ts --dry-run <path/to/file.md>
```

## Architecture

Astro 6 static site. All notes are Markdown files in `docs/`, loaded via Astro's content collections and rendered by page files.

**Routing:**

- `src/pages/index.astro` — Homepage; groups all notes by semester and renders `SemesterCard` components.
- `src/pages/[sem].astro` — Semester overview page; lists modules and notes for a given semester.
- `src/pages/[...slug].astro` — Individual note pages; three-column layout (left sidebar / article / TOC rail). Uses `getStaticPaths()` over all notes.
- `src/pages/og/[...slug].ts` — Generates Open Graph images per note.
- `src/pages/sitemap-index.xml.ts` and `src/pages/sitemaps/[sem].xml.ts` — Sitemap generation split by semester.
- `src/pages/license.astro` — License page.

**Content collection** (`src/content.config.ts`): globs `./docs/**/*.{md,mdx}`.

Required frontmatter: `title`, `slug`. Optional: `sidebar.label`, `sidebar.order`, `prev`, `next`, `dateCreated`, `lastUpdatedOn`, `keywords`.

**Components** (`src/components/`):

- `nav.astro` — Top navigation bar.
- `hero.astro` — Homepage hero section.
- `semester-card.astro` — Card shown per semester on the homepage.
- `semester-hero.astro` — Hero section on semester overview pages.
- `note.astro` — Note layout used inside `[...slug].astro`.
- `note-preview.astro` — Note preview card.
- `breadcrumb.astro` — Breadcrumb navigation.
- `search-modal.astro` — Search modal.
- `stats-band.astro` / `stat-card.astro` — Stats display.
- `walks-venn-diagram.astro` — One-off diagram component.

**Utilities** (`src/utils/`):

- `index.ts` — Shared helper functions (e.g. `titleize`).
- `values.ts` — Site-wide constants (`SITE_NAME`, `SITE_DOMAIN`, `SITE_DESCRIPTION`).

## Slug & File Naming Convention

URLs come from the `slug` frontmatter field, **not** from the file path. The `auto-slug.ts` script derives slugs automatically:

- Files must be named with a numeric prefix: `01-introduction.md`
- The prefix is stripped from the slug: `docs/s2/theory-of-electricity/01-introduction.md` → slug `s2/theory-of-electricity/introduction`
- The numeric prefix becomes `sidebar.order` in frontmatter
- `prev: true/false` and `next: true/false` are set based on position within the directory

Always run the slug script after adding or renaming note files. `images/` and `summary/` subdirectories are excluded from slug processing.

## Computer Security Notes Scope

`docs/s5/computer-security/cipher-algorithms/` holds one note per specific cipher algorithm. Both classical (shift, substitution, playfair, vigenere, permutation, lorenz) and modern (DES, RSA) ciphers are covered. `cipher-algorithms/01-introduction.mdx` is a pure index page for the directory, grouping links to every cipher note by category. It holds no theory content of its own.

Common cipher theory that isn't specific to one algorithm belongs in dedicated top-level notes, not `cipher-algorithms/01-introduction.mdx`: `ciphers.mdx` (encryption/decryption, secret-key definitions, and categorization) and `kerckhoffs-principle.mdx`.

`docs/s5/computer-security/` (top level) holds every other note in the module: security models and threats, CIA triad, and cipher-family concepts not tied to one algorithm (general cipher theory, stream ciphers, block ciphers, block cipher modes, public key cryptography, Diffie-Hellman key exchange).

New note on one specific cipher algorithm → `cipher-algorithms/`. New shared cipher theory → its own top-level note (split further if it covers more than one concept). Anything else in the module → top level.

## Styling

- Light/dark mode toggled via `data-theme` on `<html>`, persisted to `localStorage` key `sn-theme`.
- Per-semester accent colors are CSS custom properties `--s1` through `--s8`, defined in `src/styles/global.css`.
- No Tailwind Typography plugin — prose styles are hand-written CSS in `src/pages/[...slug].astro`.
- Most component styles are scoped `<style>` blocks inside `.astro` files; `global.css` only defines CSS variables and box-sizing reset.
- Math rendering: `remark-math` + `rehype-katex`; KaTeX CSS loaded from CDN in `Layout.astro`.
- Custom Markdown HTML classes: `.callout`, `.term`.

## Writing notes

When writing or editing notes, use the `/write-notes` skill to match Sahithyan's style. For math-heavy explanations or interactive learning content, use `/math-teacher`.

Do not manually edit the `lastUpdatedOn` frontmatter field; it is set automatically on commit. Do not manually renumber note file prefixes or set `sidebar.order`; `scripts/auto-slug.ts` handles numbering.
