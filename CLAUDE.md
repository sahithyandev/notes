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

Reloads during an edit burst are throttled by `src/integrations/dev-reload-lock/index.ts`, a Vite plugin registered in `astro.config.mjs`. It's agent-agnostic by default: every `full-reload`/HMR websocket message is held for a quiet period, and each new message during that window resets the timer, so a burst of edits from any tool, Claude Code, OpenCode, a different agent, or a human running a script across multiple notes, collapses into a single reload fired shortly after the burst ends. Nothing needs to call anything for this to work.

A `docs/**/*.{md,mdx}` edit doesn't even wait for a real reload, as long as it only touches the note's body: the plugin classifies it as content-only, holds it for a short 120ms quiet period, then sends a `sn:content-changed` event instead of `full-reload`. `src/scripts/live-update.ts` (dev-only, wired into `src/pages/[...slug].astro`) listens for that event and, if the changed file is the note currently open, fetches the fresh page and swaps the article/TOC/title/breadcrumb/sidebar-label in place, no full page reload at all. An edit that changes the note's frontmatter is never treated as content-only, even alongside a body edit in the same save: the plugin keeps a cache of each tracked file's raw frontmatter block and diffs it on every change, because plenty of the page is driven by frontmatter fields live-update.ts never touches (the `Prereqs` list, the WIP banner, the author list, ...), and patching only the swap list above would silently leave those stale. A frontmatter change, a component/script/config change, or a new/removed note all get a real `full-reload`, held for a longer 1.3s quiet period since Astro's content layer can echo the same change as two separate reload signals a moment apart.

On top of that, the plugin exposes `POST /__reload-lock/pause` and `POST /__reload-lock/resume` on the dev server (`localhost:4321`) as a latency optimization for a real `full-reload`: pausing holds it indefinitely instead of on a timer, and resuming flushes immediately. `.claude/settings.json` wires these into Claude Code specifically, via `.claude/hooks/reload-lock.ts` (a `PreToolUse` hook on `Edit|Write|MultiEdit` pauses, a `Stop` hook resumes), so a Claude Code edit turn gets an instant reload right after the turn ends rather than waiting out whichever debounce applies, content-only or full. The hook pauses unconditionally rather than trying to guess from the file path whether an edit is content-only, since only dev-reload-lock's own frontmatter diff actually knows that. Any other agent that doesn't call these endpoints still gets the debounced behavior for free.

Regardless of the above, still make all edits to a given note in one pass (draft the full content, then a single `Write`/`Edit`) rather than several incremental `Edit` calls, since that's fewer filesystem writes and keeps intermediate diffs cleaner.

## Soft navigation (production)

`src/scripts/note-swap.ts` (production and dev) turns prev/next buttons, sidebar note links and the left/right arrow shortcut into in-place content swaps inside a view transition. It falls back to a normal page load, decided before the DOM is touched, whenever the target isn't a note, has a different sidebar, or needs a script this page doesn't already run.

Illustration component scripts are what make a swap non-trivial: they sweep the document once when they load. The `illustration-script-marker` Vite plugin in `astro.config.mjs` appends a global assignment to every script under `src/components/illustrations/`, and `note-swap.ts` re-runs the marked scripts after a swap (it builds the marker text from parts so its own bundle isn't tagged). A new page-level script that must keep working after a swap should export an `init...()` function and be called from `applyDocument` in `note-swap.ts`, like `initNoteFeedback`. In dev, `live-update.ts` still handles edits to the open note and reads the note's file path per event, since a swap changes it.

## Writing notes

Use the `write-notes` skill whenever writing a new note or editing an existing one, so the content matches Sahithyan's style. For math-heavy or interactive learning content, use `math-teacher`.

Do not hand-edit these automatic fields:

- `lastUpdatedOn` frontmatter is set on commit.
- Numeric file prefixes are managed by `scripts/sync-note-metadata.ts`.
- `slug` and `sidebar.order` are not frontmatter fields at all: both are derived from the file path at build/dev time (see "Slugs & file naming" below). A note may still carry a leftover `slug` or `sidebar.order` from before this changed; `sync-note-metadata.ts` deletes them the next time it touches that file, but nothing proactively rewrites the corpus, so don't be surprised to see them linger.

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

### Singular vs plural in titles and headings

This is a guideline, not a validated rule. Use judgment, and keep the existing wording when unsure.

- A title or heading that names 1 concept, method, law, or thing is singular: `Newton's Method`, `Number System`, `Entropy`.
- A note or section that surveys a class of several things is plural: `Circuit Elements`, `Design Patterns`, `Resistors`.
- A heading that lists several items under one parent is plural: `Properties`, `Types`, `Steps`, `Examples`, `Applications`.
- The noun after `of` follows the word before it: `System of Linear Equations`, `Types of Graphs`. A mass noun stays singular: `Sources of Energy`, `Types of Power`.
- A defined name keeps its published form, such as the NIST SSDF practice names (`Respond to Vulnerabilities`) and `Software Bill of Materials`.

Don't retitle or rename a note only to change its number. The filename sets the URL, so a number-only rename breaks existing links for no gain.

### Note components

Use `<Note>` sparingly, only for a genuine exception, clarification, or cross-note reminder. Ordinary content stays in the main prose.

Never place 2 `<Note>` components next to each other with the same `type` (default `"note"`). Merge them into 1, or move one back into the main text. Enforced by the `adjacent-note` rule (`src/integrations/notes-style-validator/rules/adjacent-note.ts`).

### Adjacent lists

Never start an unordered list right after another one with only blank lines in between. Markdown merges them into 1 loose list, which renders with extra spacing around each item. Put prose, a block equation or a `<Note>` between 2 lists, or join them into 1 tight list. Enforced by the `adjacent-list` rule (`src/integrations/notes-style-validator/rules/adjacent-list.ts`). Only top-level lists are checked, and an indented continuation or nested list belongs to its item.

### Heading titles

Don't repeat the `title` frontmatter field as a heading (`##`-`####`) inside the note, that's what the page's own `<h1>` already shows. A note that opens with a section restating the title should either drop that heading and fold its content into the intro, or rename the heading to something more specific. Enforced by the `title-heading-duplicate` rule (`src/integrations/notes-style-validator/rules/title-heading-duplicate.ts`), matched case-insensitively and ignoring markdown formatting.

Don't repeat the same heading text twice within a note, at any level. A note's anchor ids come from heading text alone regardless of level (`slugifyHeading` in `scan.ts`), so a repeated heading collides with the first one's `#anchor` and makes any in-page link to it ambiguous. Enforced by the `duplicate-heading` rule (`src/integrations/notes-style-validator/rules/duplicate-heading.ts`), matched case-insensitively and ignoring markdown formatting.

## Astro integrations

`src/integrations/` has 2 custom Astro integrations, wired up in `astro.config.mjs`. They run on `bun dev` and `bun build`:

- `notes-style-validator`: a single shared file scan enforcing 14 rules over `docs/`: `title-case`, `dash`, `math-delimiters`, `adjacent-note`, `adjacent-list`, `label-description`, `collapsed-label`, `prereq-scope`, `broken-link`, `filename`, `title-heading-duplicate`, `duplicate-heading`, `submodule-numbering`, `forward-link`. See the sections above and below. **The build fails on any violation.**
- `module-redirects`: generates redirects from `docs/` structure; not a content validator, warns only about stale redirects during dev.

`prereq-scope` and `broken-link` were originally separate integrations (`prereq-scope`, `link-validator`) and were folded into `notes-style-validator` since they're validation rules over the same corpus, just like the other 5. `broken-link` is the one rule that can't run per-file: it needs every file's slug and headings collected up front to know what a valid link target even is, so it runs as a corpus-wide pass (`rules/broken-link.ts`'s `checkBrokenLinks`) rather than through the per-file rule registry (`rules/index.ts`'s `runPerFileRules`). It's also redirect-aware — links to a slug that now 301-redirects (via `module-redirects`) aren't flagged, which is why `notes-style-validator`'s `index.ts` captures `astro:routes:resolved` before running the checks.

`prereq-scope` bans `prereqs` entries that point at a note in the same module — see "Slugs & file naming" below. `broken-link` validates internal doc links, in-page anchors, and relative image paths actually resolve, with fuzzy-match suggestions (`core/similarity.ts`) for near-miss slugs. `filename` (`rules/filename.ts`) bans uppercase letters anywhere in a note's filename, since slug and sidebar order are derived from it at build/dev time (see "Slugs & file naming" below) and an uppercase letter there leaks into the URL, and separately bans the `.md` extension in favor of `.mdx` (a file can trip both checks at once, each reported as its own violation).

After running `bun build`, always check the terminal output for `[notes-style-validator]` lines reporting violations (the build already fails on them, but read what broke).

Don't run a full `bun build` just to check note style — it's slow (Vite, image processing, pagefind). `scan.ts`/`validate.ts` have no Astro dependency at all (plain Node fs + gray-matter), so run the checks directly instead:

```bash
bun run check-notes-style
```

Same 14 rules, same redirect-awareness, same pass/fail semantics as the build (exits 1 on any violation), but scans `docs/` in isolation in well under a second. Use this after editing notes, and save `bun build` for when you actually need to verify the site renders.

Scope the report with `--filter` when you're only working in one area — a semester (`s1`), a module (`s1/mathematics`), a submodule (`s1/mathematics/matrices`), or a single note by name (`diagonalization`). Numeric prefixes are optional either way; matching is case-insensitive and looks for the filter's segments anywhere in the path, not just as a root prefix:

```bash
bun run check-notes-style -- --filter s1/mathematics
```

`--filter` only narrows what gets _printed and decided on_ — every file is still scanned underneath, since `broken-link` needs the whole corpus to know which slugs are valid; a link into an out-of-scope file is still resolved correctly, just not reported unless it's itself in scope. The same `filter` option (or a `NOTES_STYLE_FILTER` env var, e.g. `NOTES_STYLE_FILTER=s1/mathematics bun dev`) works on the Astro integration too, but only for `bun dev` — `bun build` always ignores it, so a filter left set in your shell can never silently weaken the real build check.

## Slugs & file naming

URLs come from the file path, not frontmatter. `slugFromDocsPath` (`src/utils/note-path.ts`) strips the numeric prefix from each path segment:

- `docs/s2/theory-of-electricity/01-introduction.md` becomes slug `s2/theory-of-electricity/introduction`.

It's wired into the content collection as `generateId` in `src/content.config.ts`, so `entry.id` on a `notes` collection entry _is_ the slug (`getEntry("notes", slug)` works because of this). `sidebar.order` is derived the same way from `entry.filePath`'s leaf filename via `orderFromFilePath` (same file), used wherever notes need sorting (`src/lib/sidebar.ts`, `src/pages/[sem].astro`). Neither is read from frontmatter anymore; a note is free to still carry a stale `slug`/`sidebar.order` key left over from before this changed (see "Do not hand-edit" above), it's simply ignored.

`images/` and `summary/` subdirectories are skipped.

Frontmatter: `title` is required; `sidebar.label`, `dateCreated`, `lastUpdatedOn`, `keywords` are optional.

Do not put notes from the same module in `prereqs`. The sidebar order / prev-next navigation already conveys ordering within a module, and sibling notes are assumed read. `prereqs` is only for dependencies on notes in _other_ modules. A prereq also cannot point into a _later_ semester than the note's own (e.g. an `s2` note cannot list an `s5` note as a prereq), since that material hasn't been studied yet; a prereq in the _same_ semester but a different module is fine, since modules within a semester are often studied concurrently. Both enforced by the `prereq-scope` rule (`src/integrations/notes-style-validator/rules/prereq-scope.ts`).

### Submodule numbering

Notes inside a submodule (`docs/<sem>/<module>/<submodule>/`) are numbered from `01` within that submodule. Numbering that continues across submodules (`06-`, `07-` in the 2nd submodule) is flagged. Enforced by the `submodule-numbering` rule (`src/integrations/notes-style-validator/rules/submodule-numbering.ts`), a corpus-wide pass like `broken-link`.

### Forward links

A note must not link to a later note in the same directory (a higher numeric prefix), since the reader hasn't covered that material yet. Links to earlier notes, to notes in other modules, and across submodules are fine. Enforced by the `forward-link` rule (`src/integrations/notes-style-validator/rules/forward-link.ts`), a corpus-wide pass like `broken-link`.

## Offline support (production)

`public/sw.js` is a hand-written service worker, registered by `src/scripts/offline.ts` (imported once from `Layout.astro`, production only, so it never interferes with `bun dev` or HMR). It caches visited pages with stale-while-revalidate: the cached copy is served at once, a background fetch refreshes it, and a changed `ETag` makes the worker message the page, which shows `update-toast.astro`. Every entry carries an `sn-cached-at` header and expires after 30 days. Expired entries are purged on activate, when the browser comes back online and at most every 6 hours on fetches. `/api`, `/og`, `/pagefind` and third-party hosts other than the font/KaTeX CDNs are never cached.

- Bump `VERSION` in `public/sw.js` whenever the caching logic changes, since it names the caches and old ones are deleted on activate.
- `offline.ts` reads the page cache directly, so its `PAGE_CACHE_PREFIX`, `AT_HEADER` and `MAX_AGE_MS` must match the worker.
- Pages shown through soft navigation are stored when `initOfflineStatus()` (called from `applyDocument` in `note-swap.ts`) asks the worker to cache them. Hover previews only refresh pages that are already cached.
- A feature that needs the network should react to `html[data-offline]` (set from `navigator.onLine`). Add its disabling logic to `syncOfflineUi()` or a scoped `:global(html[data-offline])` rule.
- `src/pages/offline.astro` is the fallback for uncached navigations. The worker precaches it together with the assets it references.

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
- **`primitives/`** — chrome with no domain knowledge: `panel.astro` (bordered surface box), `step-bar.astro` (label + counter), `legend.astro` (a closed vocabulary of chip kinds: `swatch` / `outline` / `line` / `glyph` / `text`), `step-nav.astro` (dots + prev/next + aria-live), `step-note.astro`, `slider-control.astro`, `status-note.astro`, plus 3 more:
  - `figure-caption.astro`
    The `<figcaption>` used by `Panel` and by illustrations that render their own `<figure>`. `hidden` makes it screen-reader-only.
  - `axes-figure.astro`
    The shell for 2-axis curve diagrams: sized `<figure>`, `<svg>` with `<title>` (and optional `desc`, wired to `aria-labelledby`), both axes with labels, and the shared curve, point, guide and caption styling. Curves, points and labels go in the default slot, the caption via `caption` or `slot="caption"` (see "Captions" below). `size="sm"` (420×340) and `size="lg"` (620×430, heavier strokes) are presets, and `viewBox`, `x0`, `y0`, `top`, `right`, `yLabelOffset`, `xLabelOffset` and `maxWidth` override them for other geometries.
  - `arrow-marker.astro`
    An SVG arrowhead `<marker>` to place inside the diagram's `<defs>`. `variant="filled"` is a solid triangle painted by `fill`, `variant="open"` is a chevron that takes the referencing line's stroke colour.
- **`lib/`** — pure TS, no markup: `uid.ts` (`makeUid("prefix")`, the per-instance id for markers, clip paths and DOM hooks), `caption.ts` (the `CaptionProps` type that makes a caption mandatory), `walkthrough.ts` (the shared carousel driver), `dots.ts` (clones a dot button from `step-nav.astro`'s `<template>` so it carries that component's scoped-CSS id), `format.ts` (slider number formatting), `legend-presets.ts` (per-`variant` legend chips), plus `src/utils/tex.ts` for the shared KaTeX render helper used across the directory.

**When adding a new interactive illustration, compose the existing primitives instead of copying chrome from another component.** If a primitive doesn't fit (e.g. it needs a different accent colour or box padding), extend the primitive with a CSS custom property or a scoped `:global()` override in the consuming component's own `<style>` block, rather than duplicating its markup and CSS — see `flow-diagram.astro`'s `--nav-accent` override for the pattern.

### Captions

Every illustration that renders a `<figure>` must render a `<figcaption>`, because it is the figure's accessible description.

- `Panel` and `AxesFigure` take `CaptionProps` (`lib/caption.ts`). Pass either plain text as `caption="..."`, or `captionSlot` plus `<Fragment slot="caption">` for a caption with markup. Passing neither is a type error under `astro check`, and `captionSlot` with an empty slot throws at render time.
- A leaf component that wraps `Panel` takes an optional `caption` prop with a default built from its other props, so existing MDX needs no change. Interactive widgets pass `hideCaption`, which keeps the caption for assistive tech and out of the layout. A static diagram shows its caption.
- A component that writes its own `<figure>` renders a `<figcaption>` on every path. When the caption is optional, fall back to `<FigureCaption hidden>` with a default instead of omitting the element.
- `figcaption.test.ts` scans the sources for a `<figure>` without a figcaption and for a `Panel` or `AxesFigure` without a caption. It runs with `bun test`.
- `astro check` currently refuses to run on TypeScript 7 (this repo's version), so the type-level check needs TypeScript 6, for example in a scratch copy of the project. The test above is the check that runs here.

### SVG diagram conventions

- A new 2-axis curve diagram (demand/supply curves, isoquants, cost curves, ...) wraps its content in `<AxesFigure>`. It never hand-writes the `<figure>`, `<svg>`, axis lines, axis labels, or the `.axis` / `.axis-label` / `.curve` / `.guide` / caption CSS. See `demand-curve-diagram.astro` (`sm`) and `isoquant-diagram.astro` (`lg`) for the pattern.
- Colour comes from a tone class on the element: `tone-s5`, `tone-ct`, `tone-pt`, `tone-key` or `tone-ink`. The same class on a curve and on its caption `<span>` keeps the two in sync. Use `dashed` for a shifted curve and `round` for round line caps.
- Styles that only 1 diagram needs (a tangent line, a shaded region, a special label) go in that component's own `<style>` block, using `var(--tone)` where the colour should follow the tone class. Scoped styles do reach slotted content written in the same file, so a plain class selector works there. Avoid redefining a class `AxesFigure` already styles (such as `.guide`), since the 2 rules have equal specificity. Use a new class name instead.
- Every arrowhead is an `<ArrowMarker>` inside `<defs>`, never a hand-written `<marker>` plus an `.arrowhead` rule.
- Every generated id (marker, clip path, DOM hook) comes from `makeUid("prefix")`, never an inline `Math.random()`.
- Diagrams are static figures without a `figure id`, so don't reference them by anchor.

### When to extract a primitive

Extract when all of these hold, and not before:

1. The same markup or CSS appears in 3 or more illustrations. For 2 copies, leave them and watch for a third.
2. The copies differ only in data, colour, size or a few offsets, so the difference can be a prop, a slot or a CSS custom property.
3. The extracted piece has no domain knowledge, such as demand curves or Kerberos tickets. Domain pieces stay in a leaf or become a composite.

How to extract:

- Put markup in `primitives/` and pure logic in `lib/`.
- Use a slot for content that varies and a prop for a value that varies. Choose defaults that match the most common existing use, so the first migration needs no overrides.
- Migrate 2 or 3 existing illustrations first and check the pages render before migrating the rest. A prop that the first migrations never needed is a sign the primitive is too general.
- Delete the now-unused CSS from each migrated file in the same change, and run `bun run lint`.
- Add the primitive to the list above, with what its props and slots do.

Do not extract:

- A shape that appears once or twice, or that only looks alike on the surface.
- Something where the props would outnumber the lines saved, or where it needs a different prop for each caller.
- A layout that is specific to one diagram, such as the node placement in `tree-properties-proofs.astro`.

If a migrated diagram shows a small visual difference (a stroke width, a font size), prefer adopting the shared value over adding a prop for 1 caller, and say so in the change description. Add a prop only when 2 or more diagrams need the difference.

`src/components/illustrations/index.ts` re-exports every illustration component; `[...slug].astro` imports it once (`import * as Illustrations from "../components/illustrations"`) and spreads it into the MDX `components` map, rather than hand-listing each one.

## Styling

- Light/dark mode via `data-theme` on `<html>`, persisted to `localStorage` key `sn-theme`.
- Per-semester accent colors are CSS custom properties `--s1`..`--s8` in `src/styles/global.css`.
- No Tailwind Typography; prose styles are hand-written in `src/pages/[...slug].astro`. `global.css` holds only CSS variables and the box-sizing reset. Other component styles are scoped `<style>` blocks.
- Math: `remark-math` + `rehype-katex`; KaTeX CSS from CDN in `Layout.astro`.
- Custom Markdown classes: `.callout`, `.term`.
- Never write a multi-line `/* ... */` comment inside an Astro `<style>` block. `prettier-plugin-astro` adds more indent to its continuation lines on every run, so `bun run format` never settles and `bun run lint` keeps failing. Write 1 single-line `/* ... */` comment per line instead.

## Commit conventions

Never add "Co-Authored-By" lines to commits. Do not include Claude attribution
in commit messages, PR descriptions, or any git metadata.
