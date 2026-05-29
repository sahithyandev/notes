/**
 * Server-only Supabase helpers.
 *
 * IMPORTANT: Never import this module from a client <script> block or any
 * file that gets bundled for the browser. It must only be imported from
 * Astro API routes (prerender = false) or page frontmatter that runs server-side.
 */
import { createClient } from "@supabase/supabase-js";

function makeClient() {
  const url = import.meta.env.SUPABASE_URL;
  const key = import.meta.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Returns the client or throws — use in API routes where the DB is required. */
export function getSupabase() {
  const client = makeClient();
  if (!client)
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SECRET_KEY environment variables.",
    );
  return client;
}

/** Aggregate up/down counts for a slug. Returns zeros if unconfigured. */
export async function getVoteCounts(
  slug: string,
): Promise<{ up: number; down: number }> {
  const client = makeClient();
  if (!client) return { up: 0, down: 0 };
  const { data } = await client
    .from("note_votes")
    .select("vote")
    .eq("slug", slug);
  let up = 0;
  let down = 0;
  for (const row of data ?? []) {
    if (row.vote === 1) up++;
    else if (row.vote === -1) down++;
  }
  return { up, down };
}
