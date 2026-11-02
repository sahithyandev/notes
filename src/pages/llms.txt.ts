import { getCollection } from "astro:content";
import { renderLlmsTxt } from "../utils/llms";
import { SITE_HOST_URL, SITE_NAME } from "../utils/values";

export const prerender = true;

export async function GET() {
  const notes = await getCollection("notes");
  const entries = notes.map((note) => ({
    id: note.id,
    title: note.data.title,
  }));
  const text = renderLlmsTxt(entries, SITE_NAME, SITE_HOST_URL);

  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
