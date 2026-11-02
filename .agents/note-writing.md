# Writing Notes

Applies when creating or editing notes under `docs/`.

Use the `write-notes` skill whenever writing a new note or editing an existing one, so the content matches Sahithyan's style.

## Practical Focus

Match the balance of theory and application to the module. Applied modules, especially Numerical Methods, are procedure-first.

- State what to choose, calculate, check, and do when the method fails.
- Include theory only when it directly supports applying or assessing the method.
- Keep standalone illustrative cases and comparisons out of conceptual sections. Put them in the final worked-examples section.
- Make the expected inputs, starting values or assumptions, stopping condition, and output clear wherever they are relevant.

## Worked Examples

Worked examples appear at the end of the note. Each example starts with a plain, concrete question before its `<Solution>`.

- State the given data and the required result.
- State any required starting value, bounds, assumptions, or method.
- Make the task actionable enough for the reader to attempt before revealing the solution.
- Put every calculation, comparison, and final answer inside the following `<Solution>`.

Use `<Note>` sparingly, only for a genuine exception, clarification, or cross-note reminder. Ordinary content stays in the main prose.

Worked examples hide their workings behind `<Solution>` (`src/components/mdx/solution.astro`, a native `<details>` with no script). Keep the heading and the question as plain prose, then wrap everything after it, including calculations, comparisons, and the answer, in `<Solution>`, with a blank line after the opening tag and before the closing one. A heading with several questions gets one `<Solution>` after each question. A solution with several independent methods keeps its shared lead-in in the `<Solution>` and wraps each method in `<Method label="...">` (`src/components/mdx/method.astro`). With 2 or more methods, `<Solution>` shows them as tabs (built by its script on reveal, first tab selected), so only 1 method is visible at a time. Statements that are not problems (a fact, a list of cases) stay unwrapped. If the heading itself is the question (such as `### $\log i$`), wrap the whole body.

Never place 2 `<Note>` components next to each other with the same `type` (default `"note"`). Merge them into 1, or move one back into the main text. The `adjacent-note` rule enforces this.

## Metadata, Paths, and Links

Do not hand-edit these automatic fields:

- `lastUpdatedOn` frontmatter is set on commit.
- Numeric file prefixes are managed by `scripts/sync-note-metadata.ts`.
- `slug` and `sidebar.order` are not frontmatter fields. Both are derived from the file path at build/dev time. A note may still carry stale values; `sync-note-metadata.ts` deletes them the next time it touches that file.

URLs come from the file path, not frontmatter. `slugFromDocsPath` (`src/utils/note-path.ts`) strips the numeric prefix from every path segment. For example, `docs/s2/theory-of-electricity/01-introduction.md` becomes `s2/theory-of-electricity/introduction`.

`images/` and `summary/` subdirectories are skipped. Frontmatter requires `title`; `sidebar.label`, `dateCreated`, `lastUpdatedOn`, `keywords`, and `notebooks` are optional.

Do not put notes from the same module in `prereqs`. Prereqs are only for dependencies in other modules, and cannot point to a later semester. The `prereq-scope` rule enforces both requirements.

Notes inside a submodule (`docs/<sem>/<module>/<submodule>/`) start numbering from `01` within that submodule. The `submodule-numbering` rule rejects numbering carried over from another submodule.

A note must not link to a later note in the same directory. Links to earlier notes, other modules, and across submodules are fine. The `forward-link` rule enforces this.

## Content Style

### Labels

`label: description` pairs are banned in lists, prose, and table cells. When a list item has a label and description, use the 2-line form:

```
- Continuous intensity  
  No fixed set of allowed values.
```

The label line needs 2 trailing spaces. If the item does not naturally split, write a plain sentence. Use `<Symbols>` rather than `$symbol$: meaning` glossary bullets. `label-description` and `collapsed-label` enforce these rules.

### Dashes and Math

Never use an em dash, or an en dash with spaces around it, as punctuation. A tight en dash is allowed for a numeric range or a two-part proper noun.

Use `$...$` inline and `$$...$$` for block math only. Do not use `\(...\)` or `\[...\]`; `remark-math` renders them literally. The `dash` and `math-delimiters` rules enforce these rules, excluding code and math where applicable.

### Wording and Titles

Avoid using “meaning” or “that is” as a conjunction for restatement. Avoid casual filler, shorthand fragments, and unnecessary contrast clauses.

Headings (`##` to `####`) and `title` frontmatter must be title case. Capitalize the first and last word and the word after a colon; retain minor words otherwise. Hyphenated compounds are cased segment by segment. Domain terms in `ALLOWED_LOWERCASE`, math, code, links, paths, and mixed-case acronyms are exempt.

The `title` frontmatter field must be 40 characters or fewer, unless it begins with `Introduction to `. Use singular for one concept or method and plural for a survey, list, or class of things. Do not rename a note solely to change singular/plural wording.

Never repeat the title as a heading, repeat any heading text, phrase a heading as “What Is X?”, or exceed 40 headings. Named math blocks count as headings. The relevant validators are `title-heading-duplicate`, `duplicate-heading`, `what-is-heading`, and `too-many-headings`.

### Lists

Do not separate 2 top-level lists of the same kind with only blank lines. Join them or put prose, a block equation, or a `<Note>` between them. The `adjacent-list` rule enforces this.

## Math Blocks

Leave a blank line after each opening tag and before each closing tag.

- `<Theorem name="...">`
  A claim with a left rule. A name creates a normal heading, anchor, and TOC entry; omit it if it repeats the note title. `level="3"` renders an `h3`; default is `2`. Never write a separate heading beside a named theorem.
- `<Definition name="...">`
  Unstyled. A name becomes a plain heading.
- `<Proof label="...">`
  A bordered, expanded card ending in ∎. It follows its `<Theorem>`, with at most one `<Note>` between them. Use `label="Proof Hint"` for a hint, never `<Note title="Proof Hint">`.
- `<Formula>`
  A standalone centered equation.
- `<Symbols>` with `<Sym s="l">length</Sym>` rows
  A symbol legend for the equation above it. Use `columns={2}` for many symbols.
- `<Aka>`
  Put only aliases inside it, followed by a full stop and the definition sentence outside it.

`math-block` enforces valid proof placement, non-adjacent formulas, and allowed theorem levels. `proof-hint` enforces the proof-hint component.

## Wolfram Notebooks

Notebook files live under `docs/<sem>/<module>/notebooks/` and are listed by basename, without `.nb`, in a note’s `notebooks` frontmatter field. Add the file and its frontmatter entry in the same change. `notebook-file` enforces both that a listed notebook exists and that every notebook is listed.

## Validation

`notes-style-validator`, registered in `astro.config.mjs`, runs on `bun dev` and `bun build`; the build fails on violations. For note work, use the fast standalone check rather than a full build:

```bash
bun run check-notes-style
bun run check-notes-style -- --filter s1/mathematics
```

The filter supports a semester, module, submodule, or note name. It narrows reporting only; the full corpus is still scanned so links resolve correctly. `NOTES_STYLE_FILTER` applies to `bun dev`, never `bun build`.

Make all changes to a note in one pass rather than incremental saves.
