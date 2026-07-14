import { getCollection } from "astro:content";
import { SITE_HOST_URL, isWip } from "../../utils/values";

export const prerender = true;

export async function GET({ params }: { params: { sem: string } }) {
  const { sem } = params;
  const notes = await getCollection("notes");

  // Filter notes for this semester
  const semesterNotes = notes.filter((note) => {
    const parts = note.data.slug.split("/");
    return parts[0] === sem;
  });

  // Generate XML sitemap
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Semester overview page -->
  <url>
    <loc>${SITE_HOST_URL}/${sem}</loc>
    <lastmod>${getMostRecentDate(semesterNotes)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  ${semesterNotes
    .map((note) => {
      const wip = isWip(note.data.slug);
      return `
  <url>
    <loc>${SITE_HOST_URL}/${note.data.slug}</loc>
    <lastmod>${note.data.lastUpdatedOn ? formatDate(note.data.lastUpdatedOn) : new Date().toISOString()}</lastmod>
    <changefreq>${wip ? "daily" : "weekly"}</changefreq>
    <priority>${wip ? "0.4" : "0.7"}</priority>
  </url>`;
    })
    .join("")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export async function getStaticPaths() {
  const notes = await getCollection("notes");
  const semesters = new Set<string>();

  for (const note of notes) {
    const parts = note.data.slug.split("/");
    if (parts[0].match(/^s\d$/)) {
      semesters.add(parts[0]);
    }
  }

  return Array.from(semesters).map((sem) => ({
    params: { sem },
  }));
}

function formatDate(date: Date): string {
  return date.toISOString();
}

function getMostRecentDate(notes: any[]): string {
  if (notes.length === 0) {
    return new Date().toISOString();
  }

  const dates = notes
    .map((note) => note.data.lastUpdatedOn)
    .filter((date) => date !== undefined) as Date[];

  if (dates.length === 0) {
    return new Date().toISOString();
  }

  const mostRecent = new Date(Math.max(...dates.map((d) => d.getTime())));
  return mostRecent.toISOString();
}
