import { getCollection } from "astro:content";
import { generateDescription } from "../utils";
import { renderLlmsFullTxt } from "../utils/llms";
import { SITE_HOST_URL, SITE_NAME } from "../utils/values";

export const prerender = true;

export async function GET() {
  const notes = await getCollection("notes");
  const text = renderLlmsFullTxt(
    notes.map((note) => ({
      id: note.id,
      title: note.data.title,
      description: generateDescription(note.body, note.data.description),
    })),
    SITE_NAME,
    SITE_HOST_URL,
  );

  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
