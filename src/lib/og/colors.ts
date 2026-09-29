// Imported as raw text (Vite `?raw` suffix) rather than read from disk at
// runtime: this module gets bundled into the prerendered OG route, and a
// filesystem path resolved from `import.meta.dirname` there would point at
// the build output, not the source tree.
import globalCss from "../../styles/global.css?raw";

export type RGB = [r: number, g: number, b: number];

// Reads the light-mode `--s1`..`--s8` accent colors straight out of
// global.css so the OG palette can never drift from the site's real
// per-semester accents (the previous astro-og-canvas config hard-coded its
// own copy that fell out of sync).
function loadSemesterAccents(): Record<string, RGB> {
  const css = globalCss;
  const accents: Record<string, RGB> = {};
  for (let n = 1; n <= 8; n++) {
    const match = css.match(new RegExp(`--s${n}:\\s*#([0-9a-fA-F]{6})`));
    if (!match) {
      throw new Error(`Could not find --s${n} accent color in global.css`);
    }
    accents[`s${n}`] = hexToRgb(match[1]);
  }
  return accents;
}

export function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
}

export function rgbToCss([r, g, b]: RGB, alpha = 1): string {
  return alpha === 1
    ? `rgb(${r}, ${g}, ${b})`
    : `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function mix(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

export function darken(color: RGB, amount: number): RGB {
  return mix(color, [0, 0, 0], amount);
}

export function lighten(color: RGB, amount: number): RGB {
  return mix(color, [255, 255, 255], amount);
}

// Rotates hue in HSL space, used to derive a complementary bloom color from
// a single semester accent without needing a second hand-picked color.
export function hueShift(color: RGB, degrees: number): RGB {
  const [h, s, l] = rgbToHsl(color);
  return hslToRgb((h + degrees + 360) % 360, s, l);
}

function rgbToHsl([r, g, b]: RGB): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case rn:
      h = (gn - bn) / d + (gn < bn ? 6 : 0);
      break;
    case gn:
      h = (bn - rn) / d + 2;
      break;
    default:
      h = (rn - gn) / d + 4;
  }
  return [h * 60, s, l];
}

function hslToRgb(h: number, s: number, l: number): RGB {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  return [
    Math.round(hue2rgb(h / 360 + 1 / 3) * 255),
    Math.round(hue2rgb(h / 360) * 255),
    Math.round(hue2rgb(h / 360 - 1 / 3) * 255),
  ];
}

export const SEMESTER_ACCENTS: Record<string, RGB> = loadSemesterAccents();

export function accentFor(semester: string): RGB {
  return SEMESTER_ACCENTS[semester] ?? SEMESTER_ACCENTS.s1;
}
