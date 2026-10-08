import { getCollection } from "astro:content";
import { SITE_HOST_URL } from "../../utils/values";

export const prerender = true;

export async function GET({ params }: { params: { sem: string } }) {
  const { sem } = params;
  const notes = await getCollection("notes");

  // Filter notes for this semester
  const semesterNotes = notes.filter((note) => {
    const parts = note.id.split("/");
    return parts[0] === sem;
  });

  // Generate XML sitemap
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Semester overview page -->
  <url>
    <loc>${SITE_HOST_URL}/${sem}</loc>${lastmodTag(getMostRecentDate(semesterNotes))}
  </url>
  ${semesterNotes
    .map(
      (note) => `
  <url>
    <loc>${SITE_HOST_URL}/${note.id}</loc>${lastmodTag(note.data.lastUpdatedOn?.toISOString())}
  </url>`,
    )
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
    const parts = note.id.split("/");
    if (parts[0].match(/^s\d$/)) {
      semesters.add(parts[0]);
    }
  }

  return Array.from(semesters).map((sem) => ({
    params: { sem },
  }));
}

function lastmodTag(date: string | undefined): string {
  return date ? `\n    <lastmod>${date}</lastmod>` : "";
}

function getMostRecentDate(notes: any[]): string | undefined {
  const dates = notes
    .map((note) => note.data.lastUpdatedOn)
    .filter((date) => date !== undefined) as Date[];

  if (dates.length === 0) return undefined;

  return new Date(Math.max(...dates.map((d) => d.getTime()))).toISOString();
}
