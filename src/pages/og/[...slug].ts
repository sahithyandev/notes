export const prerender = true;

import { getCollection } from "astro:content";
import { OGImageRoute } from "astro-og-canvas";
import { titleize } from "../../utils/index";
import { SITE_NAME, SITE_DESCRIPTION } from "../../utils/values";

type RGBColor = [r: number, g: number, b: number];

interface ParsedSlug {
  semester: string;
  module: string;
  submodule?: string;
}

const LOGO_PATH = "./public/android-chrome-192x192.png";
const LOGO_SIZE = 192;
const LOGO_CONFIG: {
  /** Path to the logo image file, e.g. `'./src/logo.png'` */
  path: string;
  /**
   * Size to display logo at.
   * - `undefined` — Use original image file dimensions. (Default)
   * - `[width]` — Resize to the specified width, height will be resize proportionally.
   * - `[width, height]` — Resized to the specified width and height.
   */
  size?: [width?: number, height?: number];
} = {
  path: LOGO_PATH,
  size: [LOGO_SIZE],
};

// Semester color mapping (RGB arrays from CSS variables)
const semesterColors: Record<string, { primary: RGBColor; bg: RGBColor }> = {
  s1: { primary: [51, 72, 200], bg: [235, 237, 250] },
  s2: { primary: [107, 56, 160], bg: [241, 235, 248] },
  s3: { primary: [26, 122, 74], bg: [232, 243, 237] },
  s4: { primary: [138, 90, 24], bg: [245, 239, 227] },
  s5: { primary: [79, 58, 192], bg: [237, 237, 250] },
  s6: { primary: [160, 36, 90], bg: [250, 235, 242] },
  s7: { primary: [14, 122, 150], bg: [228, 242, 246] },
  s8: { primary: [148, 64, 24], bg: [246, 237, 231] },
};

// Parse slug to extract semester, module, and submodule
function parseSlug(slug: string): ParsedSlug {
  const parts = slug.split("/");
  const semester = parts[0]; // e.g., "s2"
  const module = parts[1]; // e.g., "theory-of-electricity"
  const submodule = parts[2]; // e.g., "introduction" (optional)
  return { semester, module, submodule };
}

// Format module/submodule for display
function formatModuleInfo(semester: string, module: string) {
  return `Semester ${semester.slice(1)}: ${titleize(module)}`;
}

const BASE_OG_CONFIG = {
  format: "JPEG" as const,
  logo: LOGO_CONFIG,
  padding: 60,
  font: {
    title: {
      weight: "Bold" as const,
      size: 90,
      lineHeight: 1.2,
    },
    description: {
      size: 32,
    },
  },
} as const;

const entries = await getCollection("notes");

const pages: Record<
  string,
  {
    data: (typeof entries)[number]["data"];
  }
> = {};

// Add default entry for homepage
pages["default.jpg"] = {
  data: {
    title: SITE_NAME,
    slug: "default",
  },
};

const semesters = new Set<string>();

for (const entry of entries) {
  const { data } = entry;
  const slug = data.slug;
  if (!slug || slug.endsWith("summary")) {
    continue;
  }
  pages[`${slug}.jpg`] = { data };
  semesters.add(slug.split("/")[0]);
}

for (const semester of semesters) {
  pages[`sem-${semester.slice(1)}.jpg`] = {
    data: {
      title: `Semester ${semester.slice(1)}`,
      slug: semester,
    },
  };
}

export const { getStaticPaths, GET } = await OGImageRoute({
  pages,
  param: "slug",
  getSlug: (path) => path.replace(/\.jpe?g$/i, "").concat(".jpg"),
  getImageOptions: (_path, page: (typeof pages)[number]) => {
    // Handle default homepage OG image
    if (page.data.slug === "default") {
      return {
        ...BASE_OG_CONFIG,
        title: SITE_NAME,
        description: SITE_DESCRIPTION,
        bgGradient: [[235, 237, 250]] as RGBColor[],
        font: {
          title: {
            ...BASE_OG_CONFIG?.font.title,
            color: [51, 72, 200] as RGBColor,
          },
          description: {
            ...BASE_OG_CONFIG?.font.description,
            color: [51, 72, 200] as RGBColor,
          },
        },
      };
    }

    // Handle semester-specific OG images (e.g., sem-s1, sem-s2)
    if (page.data.slug.match(/^s\d$/)) {
      const colors = semesterColors[page.data.slug] || semesterColors.s1;
      const semesterNum = page.data.slug.replace("s", "");
      return {
        ...BASE_OG_CONFIG,
        title: `Semester ${semesterNum}`,
        description: SITE_DESCRIPTION,
        bgGradient: [colors.bg],
        font: {
          title: { ...BASE_OG_CONFIG.font.title, color: colors.primary },
          description: {
            ...BASE_OG_CONFIG.font.description,
            color: colors.primary,
          },
        },
      };
    }

    // Handle note pages
    const { semester, module } = parseSlug(page.data.slug);
    const colors = semesterColors[semester] || semesterColors.s1;
    const description = formatModuleInfo(semester, module);

    return {
      ...BASE_OG_CONFIG,
      title: page.data.title,
      description,
      bgGradient: [colors.bg],
      font: {
        title: { ...BASE_OG_CONFIG.font.title, color: colors.primary },
        description: {
          ...BASE_OG_CONFIG.font.description,
          color: colors.primary,
        },
      },
    };
  },
});
