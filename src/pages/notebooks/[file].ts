import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getCollection } from "astro:content";
import type { APIRoute } from "astro";

export const prerender = true;

export async function getStaticPaths() {
  const notebooks = await getCollection("notebooks");
  return notebooks.map((entry) => ({
    params: { file: `${entry.id}.nb` },
    props: { entry },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const bytes = await readFile(
    join(process.cwd(), "docs", props.entry.data.path),
  );
  return new Response(bytes, {
    headers: { "Content-Type": "application/octet-stream" },
  });
};
