Guidance for AI coding agents (Claude Code, OpenCode, and others) working in this repo.

Astro 7 static site. Notes are Markdown files in `docs/`, loaded via content collections and rendered by the page files in `src/pages/`.

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

Run the metadata sync script whenever `.md` files are added or renamed:

```bash
bun scripts/sync-note-metadata.ts <path/to/file.md> [...]   # add --dry-run to preview
```

### Editing notes while `bun dev` is running

Reloads during an edit burst are throttled by `src/integrations/dev-reload-lock/index.ts`, a Vite plugin registered in `astro.config.mjs`. It's agent-agnostic by default: every `full-reload`/HMR websocket message is held for a 500ms quiet period (`DEBOUNCE_MS`), and each new message during that window resets the timer, so a burst of edits from any tool, Claude Code, OpenCode, a different agent, or a human running a script across multiple notes, collapses into a single reload fired shortly after the burst ends. Nothing needs to call anything for this to work.

On top of that, the plugin exposes `POST /__reload-lock/pause` and `POST /__reload-lock/resume` on the dev server (`localhost:4321`) as a latency optimization: pausing holds reloads indefinitely instead of on a timer, and resuming flushes immediately. `.claude/settings.json` wires these into Claude Code specifically (a `PreToolUse` hook on `Edit|Write|MultiEdit` pauses, a `Stop` hook resumes), so Claude Code's edit turns get an instant reload right after the turn ends rather than waiting out the debounce. Any other agent that doesn't call these endpoints still gets the debounced behavior for free.

Regardless of the above, still make all edits to a given note in one pass (draft the full content, then a single `Write`/`Edit`) rather than several incremental `Edit` calls, since that's fewer filesystem writes and keeps intermediate diffs cleaner.

### Edit feedback (dev only)

`src/integrations/edit-feedback/` is a dev-only Vite plugin that lets you select text on a rendered note in the browser, attach a comment, and get a proposed edit back without leaving the browser. It's rendered by `src/components/dev/edit-feedback.astro` under `import.meta.env.DEV` (nothing ships in a production build) and wired into `astro.config.mjs`'s `vite.plugins` next to `devReloadLock()`.

It runs one long-lived `claude -p --input-format stream-json --output-format stream-json` process (`agent.ts`), fed one user message per feedback request over its stdin, so the conversation and prompt cache carry across requests instead of being rebuilt each time. The agent can only `Read`/`Glob`/`Grep`/`Skill` plus run `bun run check-notes-style`; it never gets `Edit`/`Write`. Every reply ends with a fenced ` ```json ` proposal block (`{ file, summary, edits: [{ old, new }] }`), which `proposal.ts` parses and validates (each `old` must match the file's current content exactly once) before the relay applies it, only once you click Apply in the browser panel.

Routes on the dev server (`localhost:4321`):

- `POST /__edit-feedback/request` - submit a new feedback item.
- `POST /__edit-feedback/apply/:id`, `POST /__edit-feedback/discard/:id`, `POST /__edit-feedback/refine/:id` - act on an item.
- `POST /__edit-feedback/reset` - drop the current agent session and start a new one.
- `GET /__edit-feedback/events` - SSE stream of item state.

The session id is persisted to `.tmp/edit-feedback-session` (gitignored) so a dev-server restart resumes the same conversation instead of starting cold. `EDIT_FEEDBACK_MODEL` overrides the model; `EDIT_FEEDBACK=0` disables the plugin entirely.

## Writing notes

Use the `write-notes` skill whenever writing a new note or editing an existing one, so the content matches Sahithyan's style. For math-heavy or interactive learning content, use `math-teacher`.

Do not hand-edit these automatic fields:

- `lastUpdatedOn` frontmatter is set on commit.
- Numeric file prefixes and `sidebar.order` are managed by `scripts/sync-note-metadata.ts`.

### Label and description formatting

`label: description` pairs are banned everywhere in note content: list items, prose sentences, and table cells.

When a list item has a label and a description, use the 2-line format. Label on the first line ending with 2 trailing spaces, description indented on the second line:

```
- Continuous intensity
  No fixed set of allowed values.
```

The 2 trailing spaces are required. Without them Markdown collapses the line break.

If a label does not fit the 2-line form, rewrite it as a plain sentence. Never use `- Continuous intensity: no fixed set of allowed values`.

When fixing a violation inside a list where the other bullets already use the 2-line form, convert it to 2-line format too rather than defaulting to a plain sentence, even for a short label. Only fall back to a plain sentence when the label genuinely has no natural split point, or the surrounding bullets are prose sentences themselves.

Exception: `$symbol$: meaning` glossary bullets after a block equation or a `Here:` lead-in, such as `- $A$: cross-sectional area`.

Enforced by the `notes-style-validator` Astro integration's `label-description` rule (`src/integrations/notes-style-validator/rules/label-description.ts`). A sibling `collapsed-label` rule catches the same 2-line format written _without_ the required 2 trailing spaces (or a trailing `\`): that's a rendering bug, not just a style nit, since the label and description silently run together on the published page.

### Dashes

Never use an em dash (—), or an en dash (–) with a space on either side, in note content as a substitute for a comma, period, colon, or parentheses. Restructure the sentence instead.

An en dash packed tight against non-whitespace on both sides is still allowed: a numeric range (`1978–2020`, `0.1–100`) or a two-part proper noun / compound (`Beattie–Bridgeman Equation`, `T–S Diagram`).

Enforced by the `dash` rule (`src/integrations/notes-style-validator/rules/dash.ts`). Exempt: fenced code, inline code, math (`$...$`/`$$...$$`), and a dash used alone as an empty table cell.

### Math delimiters

Write math with `$...$` (inline) and `$$...$$` (block) only. Never use the LaTeX-native `\(...\)` / `\[...\]` delimiters: `remark-math` doesn't recognize them, so the equation renders as literal backslash text instead of math on the published page.

Enforced by the `math-delimiters` rule (`src/integrations/notes-style-validator/rules/math-delimiters.ts`). Exempt: fenced code and inline code.

### Word choice

Avoid using "meaning" or "that is" as a conjunction to introduce a restatement or clarification (e.g. "How it should be produced, meaning which production procedure to use" or "..., that is, which procedure to use"). Prefer a plain sentence, comma, or colon-free restructuring instead.

Avoid casual filler or emphasis remarks, such as "nothing more" tacked onto a definition, shorthand fragment comparisons like "Same sliding mask, but ...", or unnecessary contrast clauses like "instead of a correlation or convolution sum". State the fact directly as a complete, self-contained sentence instead.

### Title casing

Headings (`##` to `####`) and the `title` frontmatter field must be in title case, as enforced by the `title-case` rule of the `notes-style-validator` Astro integration (`src/integrations/notes-style-validator/rules/title-case.ts`, logic in `core/titlecase.ts`). The build and dev server fail on violations.

Rules implemented in `core/titlecase.ts`:

- Capitalize the first word, the last word, and any word after a colon.
- Keep minor words lowercase otherwise (articles, coordinating conjunctions, short prepositions). See `MINOR_WORDS` for the full list.
- Hyphenated compounds are cased segment by segment with the same rules.
- Domain terms in `ALLOWED_LOWERCASE` (such as `rms`, `setuid`, `sin`) stay lowercase everywhere.
- Math (`$...$`), code (`` `...` ``), links, paths, and mixed-case acronyms are left untouched.

Add a new domain term to `ALLOWED_LOWERCASE` rather than working around a false positive.

### Title length

The `title` frontmatter field must be 40 characters or fewer, enforced by the `title-length` rule (`src/integrations/notes-style-validator/rules/title-length.ts`). Titles render standalone (sidebar, page header, browser tab, OG image), so a long one wraps or gets truncated instead of just reading as a dense sentence the way it would in prose. Prefer a shorter, more specific title or a well-known abbreviation over a literal restatement of the note's full scope.

Exempt: a title starting with `Introduction to `, since that's a fixed opener pattern used across the corpus for module/topic-level notes and reads fine at any length.

### Note components

Use `<Note>` sparingly, only for a genuine exception, clarification, or cross-note reminder. Ordinary content stays in the main prose.

Never place 2 `<Note>` components next to each other with the same `type` (default `"note"`). Merge them into 1, or move one back into the main text. Enforced by the `adjacent-note` rule (`src/integrations/notes-style-validator/rules/adjacent-note.ts`).

### Heading titles

Don't repeat the `title` frontmatter field as a heading (`##`-`####`) inside the note, that's what the page's own `<h1>` already shows. A note that opens with a section restating the title should either drop that heading and fold its content into the intro, or rename the heading to something more specific. Enforced by the `title-heading-duplicate` rule (`src/integrations/notes-style-validator/rules/title-heading-duplicate.ts`), matched case-insensitively and ignoring markdown formatting.

## Astro integrations

`src/integrations/` has 2 custom Astro integrations, wired up in `astro.config.mjs`. They run on `bun dev` and `bun build`:

- `notes-style-validator`: a single shared file scan enforcing 10 rules over `docs/`: `title-case`, `dash`, `math-delimiters`, `adjacent-note`, `label-description`, `collapsed-label`, `prereq-scope`, `broken-link`, `filename`, `title-heading-duplicate`. See the sections above and below. **The build fails on any violation.**
- `module-redirects`: generates redirects from `docs/` structure; not a content validator, warns only about stale redirects during dev.

`prereq-scope` and `broken-link` were originally separate integrations (`prereq-scope`, `link-validator`) and were folded into `notes-style-validator` since they're validation rules over the same corpus, just like the other 5. `broken-link` is the one rule that can't run per-file: it needs every file's slug and headings collected up front to know what a valid link target even is, so it runs as a corpus-wide pass (`rules/broken-link.ts`'s `checkBrokenLinks`) rather than through the per-file rule registry (`rules/index.ts`'s `runPerFileRules`). It's also redirect-aware — links to a slug that now 301-redirects (via `module-redirects`) aren't flagged, which is why `notes-style-validator`'s `index.ts` captures `astro:routes:resolved` before running the checks.

`prereq-scope` bans `prereqs` entries that point at a note in the same module — see "Slugs & file naming" below. `broken-link` validates internal doc links, in-page anchors, and relative image paths actually resolve, with fuzzy-match suggestions (`core/similarity.ts`) for near-miss slugs. `filename` (`rules/filename.ts`) bans uppercase letters anywhere in a note's filename, since slugs and sidebar order are derived from it by `sync-note-metadata.ts` and an uppercase letter there leaks into the URL, and separately bans the `.md` extension in favor of `.mdx` (a file can trip both checks at once, each reported as its own violation).

After running `bun build`, always check the terminal output for `[notes-style-validator]` lines reporting violations (the build already fails on them, but read what broke).

Don't run a full `bun build` just to check note style — it's slow (Vite, image processing, pagefind). `scan.ts`/`validate.ts` have no Astro dependency at all (plain Node fs + gray-matter), so run the checks directly instead:

```bash
bun run check-notes-style
```

Same 10 rules, same redirect-awareness, same pass/fail semantics as the build (exits 1 on any violation), but scans `docs/` in isolation in well under a second. Use this after editing notes, and save `bun build` for when you actually need to verify the site renders.

Scope the report with `--filter` when you're only working in one area — a semester (`s1`), a module (`s1/mathematics`), a submodule (`s1/mathematics/matrices`), or a single note by name (`diagonalization`). Numeric prefixes are optional either way; matching is case-insensitive and looks for the filter's segments anywhere in the path, not just as a root prefix:

```bash
bun run check-notes-style -- --filter s1/mathematics
```

`--filter` only narrows what gets _printed and decided on_ — every file is still scanned underneath, since `broken-link` needs the whole corpus to know which slugs are valid; a link into an out-of-scope file is still resolved correctly, just not reported unless it's itself in scope. The same `filter` option (or a `NOTES_STYLE_FILTER` env var, e.g. `NOTES_STYLE_FILTER=s1/mathematics bun dev`) works on the Astro integration too, but only for `bun dev` — `bun build` always ignores it, so a filter left set in your shell can never silently weaken the real build check.

## Slugs & file naming

URLs come from the `slug` frontmatter field, not the file path. `sync-note-metadata.ts` derives everything from a numeric filename prefix:

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

Content collection (`src/content.config.ts`) globs `./docs/**/*.{md,mdx}`. Components live in `src/components/`, grouped by role: `icons/` (SVG icon components), `illustrations/` (see below), `layout/` (site chrome: nav, footer, search, breadcrumb), `home/` (homepage/listing pieces: hero, stats, semester and note cards), `note/` (note-page chrome: article shell, sidebars, toc, author/feedback blocks), and `mdx/` (components a note's Markdown body renders through, like `Note` and the table wrapper). Shared helpers live in `src/utils/` (`index.ts` for helpers like `titleize`, `values.ts` for site constants).

## Illustration components

`src/components/illustrations/` holds the interactive diagrams (walkthroughs, tables, sensitivity sliders, SVG diagrams) used across notes. It's layered:

- **Leaf illustrations** — the domain-specific components (`simplex-step.astro`, `transportation-table.astro`, `sensitivity-rhs-slider.astro`, `flow-diagram.astro`, ...). These carry the actual math/data and are what notes reference in MDX.
- **Composites** — components that assemble primitives into a reusable shape. `walkthrough.astro` is the one generic step carousel (`<Walkthrough variant="simplex" | "transportation" | "assignment">`); step components (`simplex-step.astro`, etc.) render into it via a hidden `[data-stage]` element that the shared controller clones and updates.
- **`primitives/`** — chrome with no domain knowledge: `panel.astro` (bordered surface box), `step-bar.astro` (label + counter), `legend.astro` (a closed vocabulary of chip kinds: `swatch` / `outline` / `line` / `glyph` / `text`), `step-nav.astro` (dots + prev/next + aria-live), `step-note.astro`, `slider-control.astro`, `status-note.astro`.
- **`lib/`** — pure TS, no markup: `walkthrough.ts` (the shared carousel driver), `dots.ts` (clones a dot button from `step-nav.astro`'s `<template>` so it carries that component's scoped-CSS id), `format.ts` (slider number formatting), `legend-presets.ts` (per-`variant` legend chips), plus `src/utils/tex.ts` for the shared KaTeX render helper used across the directory.

**When adding a new interactive illustration, compose the existing primitives instead of copying chrome from another component.** If a primitive doesn't fit (e.g. it needs a different accent colour or box padding), extend the primitive with a CSS custom property or a scoped `:global()` override in the consuming component's own `<style>` block, rather than duplicating its markup and CSS — see `flow-diagram.astro`'s `--nav-accent` override for the pattern.

`src/components/illustrations/index.ts` re-exports every illustration component; `[...slug].astro` imports it once (`import * as Illustrations from "../components/illustrations"`) and spreads it into the MDX `components` map, rather than hand-listing each one.

## Styling

- Light/dark mode via `data-theme` on `<html>`, persisted to `localStorage` key `sn-theme`.
- Per-semester accent colors are CSS custom properties `--s1`..`--s8` in `src/styles/global.css`.
- No Tailwind Typography; prose styles are hand-written in `src/pages/[...slug].astro`. `global.css` holds only CSS variables and the box-sizing reset. Other component styles are scoped `<style>` blocks.
- Math: `remark-math` + `rehype-katex`; KaTeX CSS from CDN in `Layout.astro`.
- Custom Markdown classes: `.callout`, `.term`.

## Commit conventions

Never add "Co-Authored-By" lines to commits. Do not include Claude attribution
in commit messages, PR descriptions, or any git metadata.
