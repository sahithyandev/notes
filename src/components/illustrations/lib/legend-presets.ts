import type { Chip } from "../primitives/legend.astro";

// One legend preset per walkthrough family, replacing the near-identical
// <p class="legend">...</p> markup each of the 3 walkthroughs used to carry.
// `caption` is the default accessible description of the carousel.
export const WALKTHROUGH_PRESETS = {
  simplex: {
    caption: "Step-by-step walkthrough of the simplex method on a tableau",
    legend: [
      {
        label: "entering column",
        kind: "swatch",
        fill: "var(--accent-dim)",
        border: "var(--accent)",
      },
      {
        label: "leaving row",
        kind: "swatch",
        fill: "var(--accent-dim)",
        border: "transparent",
      },
      {
        label: "pivot element",
        kind: "swatch",
        fill: "var(--accent-subtle)",
        border: "transparent",
      },
      { label: "updated this step", kind: "text" },
    ] satisfies Chip[],
  },
  transportation: {
    caption: "Step-by-step walkthrough of a transportation problem solution",
    legend: [
      { label: "occupied cell", kind: "swatch", fill: "var(--accent-subtle)" },
      { label: "0 allocation", kind: "swatch", fill: "var(--accent-subtle)" },
      {
        label: "this step",
        kind: "swatch",
        fill: "var(--accent-dim)",
        border: "var(--accent)",
      },
      { label: "loop path", kind: "outline", border: "var(--accent)" },
      {
        label: "+ cell",
        kind: "swatch",
        fill: "var(--loop-plus)",
        border: "var(--loop-plus)",
      },
      {
        label: "− cell",
        kind: "swatch",
        fill: "var(--loop-minus)",
        border: "var(--loop-minus)",
      },
    ] satisfies Chip[],
  },
  assignment: {
    caption: "Step-by-step walkthrough of an assignment problem solution",
    legend: [
      {
        label: "0 entry",
        kind: "glyph",
        fill: "var(--accent)",
        glyph: "0",
      },
      { label: "covering line", kind: "line", border: "var(--accent)" },
      {
        label: "assigned",
        kind: "swatch",
        fill: "var(--dia-pt)",
        border: "var(--dia-pt)",
      },
      { label: "updated this step", kind: "text" },
    ] satisfies Chip[],
  },
  cpm: {
    caption: "Step-by-step walkthrough of a critical path method calculation",
    legend: [
      {
        label: "critical event (E(i) = L(i))",
        kind: "swatch",
        fill: "var(--accent-subtle)",
      },
      { label: "updated this step", kind: "text" },
    ] satisfies Chip[],
  },
} satisfies Record<string, { caption: string; legend: Chip[] }>;

export type WalkthroughVariant = keyof typeof WALKTHROUGH_PRESETS;
