import { getCollection } from "astro:content";
import { OGImageRoute } from "astro-og-canvas";
import { titleize } from "../../utils/index";
import { SITE_NAME, SITE_DESCRIPTION } from "../../utils/values";

// Semester color mapping (RGB arrays from CSS variables)
const semesterColors: Record<string, { primary: number[]; bg: number[] }> = {
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
function parseSlug(slug: string) {
  const parts = slug.split("/");
  const semester = parts[0]; // e.g., "s2"
  const module = parts[1]; // e.g., "theory-of-electricity"
  const submodule = parts[2]; // e.g., "introduction" (optional)
  return { semester, module, submodule };
}

// Format module/submodule for display
function formatModuleInfo(
  semester: string,
  module: string,
  submodule?: string,
) {
  const semesterNum = semester.replace("s", "");

  if (submodule) {
    return `Semester ${semesterNum}: ${titleize(module)} - ${titleize(submodule)}`;
  }
  return `Semester ${semesterNum}: ${titleize(module)}`;
}

const entries = await getCollection("notes");

const pages: Record<
  string,
  {
    data: (typeof entries)[number]["data"];
  }
> = {};

// Add default entry for homepage
pages["default"] = {
  data: {
    title: SITE_NAME,
    slug: "default",
  },
};

const semesters = new Set<string>();

for (const entry of entries) {
  const { data, id } = entry;
  const _id = id.replace(".md", "").replace(/\d+-/, "");
  if (typeof _id !== "string" || _id.endsWith("summary")) {
    continue;
  }
  pages[_id] = { data };
  semesters.add(_id.split("/")[0]);
}

for (const semester of semesters) {
  pages[semester] = {
    data: {
      title: `Semester ${semester.slice(1)}`,
      slug: semester,
    },
  };
}

export const { getStaticPaths, GET } = await OGImageRoute({
  pages,
  param: "slug",
  getImageOptions: (_path, page: (typeof pages)[number]) => {
    // Handle default homepage OG image
    if (page.data.slug === "default") {
      return {
        title: SITE_NAME,
        description: SITE_DESCRIPTION,
        bgGradient: [[235, 237, 250]],
        font: {
          title: {
            color: [51, 72, 200],
            weight: "Bold",
            size: 90,
            lineHeight: 1.2,
          },
          description: {
            color: [51, 72, 200],
            size: 32,
          },
        },
        padding: 60,
      };
    }

    // Handle semester-specific OG images (e.g., s1, s2)
    if (page.data.slug.match(/^s\d$/)) {
      const colors = semesterColors[page.data.slug] || semesterColors.s1;
      const semesterNum = page.data.slug.replace("s", "");
      return {
        title: `Semester ${semesterNum}`,
        description: SITE_DESCRIPTION,
        bgGradient: [colors.bg],
        font: {
          title: {
            color: colors.primary,
            weight: "Bold",
            size: 90,
            lineHeight: 1.2,
          },
          description: {
            color: colors.primary,
            size: 32,
          },
        },
        padding: 60,
      };
    }

    // Handle note pages
    const { semester, module, submodule } = parseSlug(page.data.slug);
    const colors = semesterColors[semester] || semesterColors.s1; // Default to s1 if not found
    const description = formatModuleInfo(semester, module, submodule);

    return {
      title: page.data.title,
      description: description,
      bgGradient: [colors.bg],
      font: {
        title: {
          color: colors.primary,
          weight: "Bold",
          size: 90,
          lineHeight: 1.2,
        },
        description: {
          color: colors.primary,
          size: 32,
        },
      },
      padding: 60,
    };
  },
});
