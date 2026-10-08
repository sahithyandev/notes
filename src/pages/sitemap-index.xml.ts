import { getCollection } from "astro:content";
import { SITE_HOST_URL } from "../utils/values";

export async function GET() {
  const notes = await getCollection("notes");
  const semesters = new Map<string, Date | undefined>();

  // Group notes by semester and find most recent date for each
  for (const note of notes) {
    const parts = note.id.split("/");
    if (parts[0].match(/^s\d$/)) {
      const sem = parts[0];
      const noteDate = note.data.lastUpdatedOn;
      const current = semesters.get(sem);

      if (
        !semesters.has(sem) ||
        (noteDate && (!current || noteDate > current))
      ) {
        semesters.set(sem, noteDate ?? current);
      }
    }
  }

  // Sort semesters
  const sortedSemesters = Array.from(semesters.entries()).sort((a, b) => {
    const aNum = parseInt(a[0].substring(1));
    const bNum = parseInt(b[0].substring(1));
    return aNum - bNum;
  });

  // Homepage is as fresh as the newest semester; omitted when no date is known
  const homepageLastmod = sortedSemesters.reduce<Date | undefined>(
    (max, [, d]) => (d && (!max || d > max) ? d : max),
    undefined,
  );

  // Generate XML sitemap index
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage -->
  <sitemap>
    <loc>${SITE_HOST_URL}/</loc>${homepageLastmod ? `\n    <lastmod>${homepageLastmod.toISOString()}</lastmod>` : ""}
  </sitemap>
  ${sortedSemesters
    .map(
      ([sem, lastmod]) => `
  <sitemap>
    <loc>${SITE_HOST_URL}/sitemaps/${sem}.xml</loc>${lastmod ? `\n    <lastmod>${lastmod.toISOString()}</lastmod>` : ""}
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
