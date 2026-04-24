import { getCollection } from "astro:content";
import { SITE_HOST_URL } from "../utils/values";

export async function GET() {
  const notes = await getCollection("notes");
  const semesters = new Map<string, Date>();

  // Group notes by semester and find most recent date for each
  for (const note of notes) {
    const parts = note.data.slug.split("/");
    if (parts[0].match(/^s\d$/)) {
      const sem = parts[0];
      const noteDate = note.data.lastUpdatedOn || new Date();

      if (!semesters.has(sem) || noteDate > semesters.get(sem)!) {
        semesters.set(sem, noteDate);
      }
    }
  }

  // Sort semesters
  const sortedSemesters = Array.from(semesters.entries()).sort((a, b) => {
    const aNum = parseInt(a[0].substring(1));
    const bNum = parseInt(b[0].substring(1));
    return aNum - bNum;
  });

  // Generate XML sitemap index
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage -->
  <sitemap>
    <loc>${SITE_HOST_URL}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  ${sortedSemesters
    .map(
      ([sem, lastmod]) => `
  <sitemap>
    <loc>${SITE_HOST_URL}/sitemaps/${sem}.xml</loc>
    <lastmod>${lastmod.toISOString()}</lastmod>
  </sitemap>`,
    )
    .join("")}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
