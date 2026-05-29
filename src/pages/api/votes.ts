/**
 * /api/votes — serverless API route (runs on Vercel, never prerendered).
 *
 * GET  /api/votes?slug=<slug>  → { up: number, down: number }
 * POST /api/votes              ← JSON { slug: string, vote: 1 | -1 }
 *                              → { up: number, down: number }
 *
 * Spam control:
 *  - One vote per (slug, hashed IP). The PK on the note_votes table enforces
 *    this at the database level; an upsert flips the value instead of stacking.
 *  - Raw IPs are never stored — only sha256(ip + VOTE_IP_SALT).
 */
export const prerender = false;

import type { APIRoute } from "astro";
import { createHash } from "node:crypto";
import { getSupabase, getVoteCounts } from "../../lib/supabase";

const SLUG_RE = /^[a-z0-9][a-z0-9/\-]*[a-z0-9]$/;

function hashIp(ip: string): string {
  const salt = import.meta.env.VOTE_IP_SALT ?? "";
  return createHash("sha256")
    .update(ip + salt)
    .digest("hex");
}

function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug") ?? "";

  if (!SLUG_RE.test(slug)) {
    return new Response(JSON.stringify({ error: "Invalid slug" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const counts = await getVoteCounts(slug);
  return new Response(JSON.stringify(counts), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
};

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).slug !== "string" ||
    !(
      (body as Record<string, unknown>).vote === 1 ||
      (body as Record<string, unknown>).vote === -1
    )
  ) {
    return new Response(JSON.stringify({ error: "Invalid body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { slug, vote } = body as { slug: string; vote: 1 | -1 };
  if (!SLUG_RE.test(slug)) {
    return new Response(JSON.stringify({ error: "Invalid slug" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = getSupabase();
  const ip_hash = hashIp(clientIp(request));
  const now = new Date().toISOString();

  const { error: upsertError } = await supabase
    .from("note_votes")
    .upsert(
      { slug, ip_hash, vote, updated_at: now },
      { onConflict: "slug,ip_hash" },
    );

  if (upsertError) {
    return new Response(JSON.stringify({ error: "Database error" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  const counts = await getVoteCounts(slug);
  return new Response(JSON.stringify(counts), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
