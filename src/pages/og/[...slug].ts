// Rendered on demand (not prerendered): with ~1000 notes, baking every OG
// image at build time was the single largest chunk of build time (minutes,
// even parallelized, on a 2 vCPU Vercel plan). Each image is cheap to render
// once, immutable per note, and rarely fetched outside of social-preview
// crawlers, so it's a better fit for "render once on first request, then let
// the CDN cache it forever" than "render all of them on every deploy
// whether or not that note changed."
export const prerender = false;

import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { titleize } from "../../utils/index";
import { SITE_NAME, SITE_DESCRIPTION } from "../../utils/values";
import { renderOgImage } from "../../lib/og/render";
import type { OgPage } from "../../lib/og/template";

interface ParsedSlug {
  semester: string;
  module: string;
}

function parseSlug(slug: string): ParsedSlug {
  const parts = slug.split("/");
  return { semester: parts[0], module: parts[1] };
}

const entries = await getCollection("notes");

// Maps each output filename (e.g. "s3/operating-systems/raid.jpg",
// "sem-3.jpg", "default.jpg") to the OG page description needed to render
// it. Built once per server start, same enumeration as before: every note
// except `*summary` slugs, one card per semester, and the homepage default.
const pages: Record<string, OgPage> = {
  "default.jpg": {
    kind: "default",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

const semesters = new Set<string>();

for (const entry of entries) {
  const { data, id: slug } = entry;
  if (slug.endsWith("summary")) {
    continue;
  }
  const { semester, module } = parseSlug(slug);
  pages[`${slug}.jpg`] = {
    kind: "note",
    title: data.title,
    semester,
    module: titleize(module),
  };
  semesters.add(semester);
}

for (const semester of semesters) {
  pages[`sem-${semester.slice(1)}.jpg`] = {
    kind: "semester",
    title: `Semester ${semester.slice(1)}`,
    description: SITE_DESCRIPTION,
    semester,
  };
}

export const GET: APIRoute = async ({ params }) => {
  const page = pages[params.slug ?? ""];
  if (!page) {
    return new Response("Not found", { status: 404 });
  }
  const jpeg = await renderOgImage(page);
  return new Response(jpeg, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
