import fs from "node:fs";
import path from "node:path";
import {
  accentFor,
  darken,
  hueShift,
  lighten,
  rgbToCss,
  SEMESTER_ACCENTS,
  type RGB,
} from "./colors";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export type OgPage =
  | { kind: "default"; title: string; description: string }
  | { kind: "semester"; title: string; description: string; semester: string }
  | {
      kind: "note";
      title: string;
      semester: string;
      module: string;
    };

const INK = "#241f1a";
const PAPER: RGB = [244, 242, 238];

// satori positions absolute children against the nearest sized ancestor,
// but doesn't support the `inset` shorthand reliably, so every full-bleed
// layer spells out explicit pixel top/left/width/height instead.
const FULL_BLEED = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  width: `${OG_WIDTH}px`,
  height: `${OG_HEIGHT}px`,
};

// The diagonal cut, as a pixel polygon (satori's clip-path percentage
// support is unreliable, so this spells out absolute coordinates instead).
// The slab widens toward the bottom, so notes with more metadata (breadcrumb
// + longer titles) still have room on the paper side while the cut still
// reads as a single confident stroke.
const CUT_TOP_X = OG_WIDTH * 0.75;
const CUT_BOTTOM_X = OG_WIDTH * 0.54;
const SEAM_W = OG_WIDTH * 0.006;

const PAPER_POLYGON = `polygon(0px 0px, ${CUT_TOP_X}px 0px, ${CUT_BOTTOM_X}px ${OG_HEIGHT}px, 0px ${OG_HEIGHT}px)`;
const SLAB_POLYGON = `polygon(${CUT_TOP_X}px 0px, ${OG_WIDTH}px 0px, ${OG_WIDTH}px ${OG_HEIGHT}px, ${CUT_BOTTOM_X}px ${OG_HEIGHT}px)`;
const RULE_POLYGON = `polygon(${CUT_TOP_X - SEAM_W}px 0px, ${CUT_TOP_X}px 0px, ${CUT_BOTTOM_X}px ${OG_HEIGHT}px, ${CUT_BOTTOM_X - SEAM_W}px ${OG_HEIGHT}px)`;

// Layered gradients standing in for a mesh/conic gradient, which satori
// doesn't support: a linear base plus a couple of off-center radial blooms
// in hue-shifted tints of the same accent. Kept small and tucked into the
// corners, well clear of the middle band where the title bleeds across the
// seam, since dark ink loses contrast against a bright bloom.
function slabBackground(accent: RGB) {
  const deep = darken(accent, 0.42);
  const bloomA = lighten(hueShift(accent, -18), 0.18);
  const bloomB = lighten(hueShift(accent, 24), 0.1);
  return [
    `radial-gradient(circle at 92% 4%, ${rgbToCss(bloomA, 0.55)}, transparent 28%)`,
    `radial-gradient(circle at 8% 98%, ${rgbToCss(bloomB, 0.45)}, transparent 26%)`,
    `linear-gradient(155deg, ${rgbToCss(accent)} 0%, ${rgbToCss(deep)} 100%)`,
  ].join(", ");
}

function defaultSlabBackground() {
  const stops = Object.values(SEMESTER_ACCENTS)
    .map((c, i, arr) => `${rgbToCss(c)} ${(i / (arr.length - 1)) * 100}%`)
    .join(", ");
  return [
    `radial-gradient(circle at 92% 4%, rgba(255,255,255,0.35), transparent 26%)`,
    `linear-gradient(160deg, ${stops})`,
  ].join(", ");
}

function fitTitleSize(title: string): number {
  if (title.length <= 18) return 100;
  if (title.length <= 28) return 84;
  return 70;
}

export function ogTemplate(page: OgPage) {
  const accent =
    page.kind === "note" || page.kind === "semester"
      ? accentFor(page.semester)
      : undefined;

  const eyebrow =
    page.kind === "note"
      ? `S${page.semester.replace("s", "")} / ${page.module}`
      : "SAHITHYAN'S NOTES";

  const eyebrowColor = accent ? rgbToCss(accent) : "#5b544c";

  const numeral =
    page.kind === "note" || page.kind === "semester"
      ? page.semester.replace("s", "")
      : null;

  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        width: `${OG_WIDTH}px`,
        height: `${OG_HEIGHT}px`,
        position: "relative",
        fontFamily: "DM Sans",
      },
      children: [
        // Paper side.
        {
          type: "div",
          props: {
            style: {
              ...FULL_BLEED,
              display: "flex",
              background: rgbToCss(PAPER),
              clipPath: PAPER_POLYGON,
            },
          },
        },
        grainOverlayClipped(PAPER_POLYGON, 0.05),
        // Slab side.
        {
          type: "div",
          props: {
            style: {
              ...FULL_BLEED,
              display: "flex",
              backgroundImage:
                page.kind === "default"
                  ? defaultSlabBackground()
                  : slabBackground(accent!),
              clipPath: SLAB_POLYGON,
            },
          },
        },
        grainOverlayClipped(SLAB_POLYGON, 0.12),
        // Seam rule, a thin accent-colored line just left of the cut.
        {
          type: "div",
          props: {
            style: {
              ...FULL_BLEED,
              display: "flex",
              background: eyebrowColor,
              opacity: 0.5,
              clipPath: RULE_POLYGON,
            },
          },
        },
        // Giant bleeding numeral inside the slab.
        numeral
          ? {
              type: "div",
              props: {
                style: {
                  position: "absolute",
                  right: "-40px",
                  bottom: "-120px",
                  display: "flex",
                  fontFamily: "Sagittaire Display",
                  fontSize: "560px",
                  lineHeight: 1,
                  color: "rgba(255,255,255,0.16)",
                },
                children: numeral,
              },
            }
          : null,
        // Content layer.
        {
          type: "div",
          props: {
            style: {
              ...FULL_BLEED,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "56px 64px",
            },
            children: [
              // Eyebrow / breadcrumb.
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    fontFamily: "JetBrains Mono",
                    fontSize: "24px",
                    letterSpacing: "3px",
                    color: eyebrowColor,
                    maxWidth: "560px",
                  },
                  children: eyebrow.toUpperCase(),
                },
              },
              // Title block.
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    maxWidth: "660px",
                  },
                  children: {
                    type: "div",
                    props: {
                      style: {
                        display: "flex",
                        fontFamily: "Sagittaire Display",
                        fontSize: `${fitTitleSize(page.title)}px`,
                        lineHeight: 1.08,
                        color: INK,
                      },
                      children: page.title,
                    },
                  },
                },
              },
              // Footer.
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                  },
                  children: [
                    {
                      type: "img",
                      props: {
                        src: LOGO_DATA_URI,
                        width: 44,
                        height: 44,
                        style: { display: "flex", borderRadius: "10px" },
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px",
                          maxWidth: "330px",
                        },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: {
                                display: "flex",
                                fontFamily: "DM Sans",
                                fontWeight: 500,
                                fontSize: "22px",
                                color: INK,
                              },
                              children: "notes.sahithyan.dev",
                            },
                          },
                          page.kind !== "note"
                            ? {
                                type: "div",
                                props: {
                                  style: {
                                    display: "flex",
                                    fontFamily: "DM Sans",
                                    fontSize: "18px",
                                    color: "#77716a",
                                  },
                                  children: page.description,
                                },
                              }
                            : null,
                        ].filter(Boolean),
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ].filter(Boolean),
    },
  };
}

function grainOverlayClipped(clip: string, opacity: number) {
  return {
    type: "div",
    props: {
      style: {
        ...FULL_BLEED,
        display: "flex",
        clipPath: clip,
        backgroundImage: `url(${GRAIN_DATA_URI})`,
        backgroundSize: "220px 220px",
        opacity,
        mixBlendMode: "overlay",
      },
    },
  };
}

// Small tiled feTurbulence noise swatch, generated once, base64-inlined so
// render() doesn't need to touch the filesystem for it.
export const GRAIN_DATA_URI =
  "data:image/svg+xml;base64," +
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220">
      <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.9 0"/></filter>
      <rect width="100%" height="100%" filter="url(#n)"/>
    </svg>`,
  ).toString("base64");

// Resolved against the project root (not `import.meta.dirname`): this
// module ends up bundled into the prerendered OG route's output chunk,
// where `import.meta.dirname` would point at the build output, not source.
const LOGO_PATH = path.resolve(
  process.cwd(),
  "public/android-chrome-192x192.png",
);
export const LOGO_DATA_URI =
  "data:image/png;base64," + fs.readFileSync(LOGO_PATH).toString("base64");
