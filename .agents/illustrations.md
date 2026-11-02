# Illustration Components

Applies when changing `src/components/illustrations/`.

Interactive diagrams are layered:

- **Leaf illustrations**
  Domain-specific MDX components such as `simplex-step.astro`, `transportation-table.astro`, `sensitivity-rhs-slider.astro`, and `flow-diagram.astro`.
- **Composites**
  Reusable domain shapes. `walkthrough.astro` is the generic carousel; step components render a hidden `[data-stage]` that the shared controller clones and updates.
- **`primitives/`**
  Domain-free chrome: panels, step bars, legends, navigation, notes, sliders, status, captions, axes figures, range inputs, and arrow figures/markers.
- **`lib/`**
  Pure TypeScript including `uid.ts`, `caption.ts`, `range.ts`, `walkthrough.ts`, `dots.ts`, `format.ts`, and `legend-presets.ts`.

Compose existing primitives rather than copying chrome. If a primitive needs a variation, extend it with a prop, CSS custom property, or a scoped `:global()` override in the consumer.

## Captions and Accessibility

Every `<figure>` needs a `<figcaption>`.

- `Panel` and `AxesFigure` accept `CaptionProps`. Pass `caption="..."`, or use `captionSlot` with a non-empty `<Fragment slot="caption">`.
- A leaf that wraps `Panel` offers an optional `caption` with a meaningful default. Interactive widgets use `hideCaption` to retain an assistive description without visual layout.
- A component that writes its own figure renders a caption on every path. When optional, fall back to `<FigureCaption hidden>` rather than omitting it.
- `figcaption.test.ts` detects missing captions and runs with `bun test`.
- `astro check` does not run with this repository’s TypeScript 7; use TypeScript 6 in a scratch copy for its type-level checks.

## SVG Conventions

- A new 2-axis curve diagram uses `<AxesFigure>`, never hand-written figure, SVG shell, axes, labels, or shared curve/caption styles.
- Apply one of `tone-s5`, `tone-ct`, `tone-pt`, `tone-key`, or `tone-ink` to both a curve and its caption span. Use `dashed` for a shifted curve and `round` for rounded line caps.
- Keep one-off styles in the component’s own style block with `var(--tone)`. Do not redefine an existing `AxesFigure` class such as `.guide`; choose a specific class name.
- Every arrowhead uses `<ArrowMarker>` inside `<defs>`, never a handwritten `<marker>` or `.arrowhead` rule.
- Every generated marker, clip-path, or DOM id uses `makeUid("prefix")`, never `Math.random()`.
- Static diagrams do not have a `figure id`; do not reference them by anchor.

## Extracting Primitives

Extract a primitive only when all apply:

1. The markup or CSS appears in 3 or more illustrations.
2. The copies differ only by data, color, size, or a small set of offsets that props, slots, or CSS custom properties can express.
3. The extracted piece has no domain knowledge.

Put markup in `primitives/` and pure logic in `lib/`. Migrate 2 or 3 callers first, remove their unused CSS in the same change, run `bun run lint`, and document the primitive above. Prefer the shared visual value for an isolated difference; add a prop only if at least 2 diagrams need it.

Do not extract a shape used once or twice, a superficially similar layout, a component with more props than saved lines, or a domain-specific layout such as the node placement in `tree-properties-proofs.astro`.

`src/components/illustrations/index.ts` re-exports every illustration. `[...slug].astro` imports that index once and spreads it into the MDX component map.
