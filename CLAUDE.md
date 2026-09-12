Guidance for AI coding agents (Claude Code, OpenCode, and others) working in this repo.

Astro 6 static site. Notes are Markdown files in `docs/`, loaded via content collections and rendered by the page files in `src/pages/`.

## Commands

**bun** is the package manager (Node >= 22.12.0).

```bash
bun dev        # dev server at localhost:4321
bun build      # static build to ./dist/
bun preview    # preview production build
```

```bash
bun test       # runs *.test.ts files with bun:test
bun run lint   # prettier --check .
```

Run the slug script whenever `.md` files are added or renamed:

```bash
bun scripts/auto-slug.ts <path/to/file.md> [...]   # add --dry-run to preview
```

## Writing notes

Use the `write-notes` skill whenever writing a new note or editing an existing one, so the content matches Sahithyan's style. For math-heavy or interactive learning content, use `math-teacher`.

Do not hand-edit these automatic fields:

- `lastUpdatedOn` frontmatter is set on commit.
- Numeric file prefixes and `sidebar.order` are managed by `scripts/auto-slug.ts`.

### Label and description formatting

`label: description` pairs are banned everywhere in note content: list items, prose sentences, and table cells.

When a list item has a label and a description, use the 2-line format. Label on the first line ending with 2 trailing spaces, description indented on the second line:

```
- Continuous intensity
  No fixed set of allowed values.
```

The 2 trailing spaces are required. Without them Markdown collapses the line break.

If a label does not fit the 2-line form, rewrite it as a plain sentence. Never use `- Continuous intensity: no fixed set of allowed values`.

Exception: `$symbol$: meaning` glossary bullets after a block equation or a `Here:` lead-in, such as `- $A$: cross-sectional area`.

Enforced by the `notes-style-validator` Astro integration's `label-description` rule (`src/integrations/notes-style-validator/rules/label-description.ts`). A sibling `collapsed-label` rule catches the same 2-line format written _without_ the required 2 trailing spaces (or a trailing `\`): that's a rendering bug, not just a style nit, since the label and description silently run together on the published page.

### Em dashes

Never use em dashes (—) in note content. Restructure with a comma, period, colon, or parentheses instead.

Enforced by the `em-dash` rule (`src/integrations/notes-style-validator/rules/em-dash.ts`). Exempt: fenced code, inline code, math (`$...$`/`$$...$$`), and a dash used alone as an empty table cell.

### Title casing

Headings (`##` to `####`) and the `title` frontmatter field must be in title case, as enforced by the `title-case` rule of the `notes-style-validator` Astro integration (`src/integrations/notes-style-validator/rules/title-case.ts`, logic in `core/titlecase.ts`). The build and dev server fail on violations.

Rules implemented in `core/titlecase.ts`:

- Capitalize the first word, the last word, and any word after a colon.
- Keep minor words lowercase otherwise (articles, coordinating conjunctions, short prepositions). See `MINOR_WORDS` for the full list.
- Hyphenated compounds are cased segment by segment with the same rules.
- Domain terms in `ALLOWED_LOWERCASE` (such as `rms`, `setuid`, `sin`) stay lowercase everywhere.
- Math (`$...$`), code (`` `...` ``), links, paths, and mixed-case acronyms are left untouched.

Add a new domain term to `ALLOWED_LOWERCASE` rather than working around a false positive.

### Note components

Use `<Note>` sparingly, only for a genuine exception, clarification, or cross-note reminder. Ordinary content stays in the main prose.

Never place 2 `<Note>` components next to each other with the same `type` (default `"note"`). Merge them into 1, or move one back into the main text. Enforced by the `adjacent-note` rule (`src/integrations/notes-style-validator/rules/adjacent-note.ts`).

## Astro integrations

`src/integrations/` has 2 custom Astro integrations, wired up in `astro.config.mjs`. They run on `bun dev` and `bun build`:

- `notes-style-validator`: a single shared file scan enforcing 7 rules over `docs/`: `title-case`, `em-dash`, `adjacent-note`, `label-description`, `collapsed-label`, `prereq-scope`, `broken-link`. See the sections above and below. **The build fails on any new violation.**
- `module-redirects`: generates redirects from `docs/` structure; not a content validator, warns only about stale redirects during dev.

`prereq-scope` and `broken-link` were originally separate integrations (`prereq-scope`, `link-validator`) and were folded into `notes-style-validator` since they're validation rules over the same corpus, just like the other 5. `broken-link` is the one rule that can't run per-file: it needs every file's slug and headings collected up front to know what a valid link target even is, so it runs as a corpus-wide pass (`rules/broken-link.ts`'s `checkBrokenLinks`) rather than through the per-file rule registry (`rules/index.ts`'s `runPerFileRules`). It's also redirect-aware — links to a slug that now 301-redirects (via `module-redirects`) aren't flagged, which is why `notes-style-validator`'s `index.ts` captures `astro:routes:resolved` before running the checks.

`prereq-scope` bans `prereqs` entries that point at a note in the same module — see "Slugs & file naming" below. `broken-link` validates internal doc links, in-page anchors, and relative image paths actually resolve, with fuzzy-match suggestions (`core/similarity.ts`) for near-miss slugs.

After running `bun build`, always check the terminal output for `[notes-style-validator]` lines reporting new violations (the build already fails on them, but read what broke). Existing/grandfathered violations print too; those don't fail the build but are still worth fixing when you're already in the file.

Don't run a full `bun build` just to check note style — it's slow (Vite, image processing, pagefind). `scan.ts`/`validate.ts` have no Astro dependency at all (plain Node fs + gray-matter), so run the checks directly instead:

```bash
bun run script:check-notes-style
```

Same 7 rules, same redirect-awareness, same pass/fail semantics as the build (exits 1 on any new violation), but scans `docs/` in isolation in well under a second. Use this after editing notes, and save `bun build` for when you actually need to verify the site renders.

### notes-style-validator baseline

`~1000` pre-existing style violations were grandfathered into a committed baseline (`src/integrations/notes-style-validator/style-baseline.json`) when the validator was introduced, so the build only fails on _new_ violations, not the existing backlog. When you fix one of the backlog violations, regenerate the baseline so it doesn't rot:

```bash
bun run script:update-style-baseline
```

Never hand-edit `style-baseline.json`. Always regenerate it. If a build fails on a violation you believe is a false positive rather than fixing the note, say so rather than silently baselining it away.

## Slugs & file naming

URLs come from the `slug` frontmatter field, not the file path. `auto-slug.ts` derives everything from a numeric filename prefix:

- `docs/s2/theory-of-electricity/01-introduction.md` becomes slug `s2/theory-of-electricity/introduction`.
- The prefix becomes `sidebar.order`.
- `prev` and `next` are set from position within the directory.

`images/` and `summary/` subdirectories are skipped.

Frontmatter: `title` and `slug` are required; `sidebar.label`, `sidebar.order`, `prev`, `next`, `dateCreated`, `lastUpdatedOn`, `keywords` are optional.

Do not put notes from the same module in `prereqs`. The `prev` / sidebar-order link already conveys ordering within a module, and sibling notes are assumed read. `prereqs` is only for dependencies on notes in _other_ modules. Enforced by the `prereq-scope` rule (`src/integrations/notes-style-validator/rules/prereq-scope.ts`).

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
