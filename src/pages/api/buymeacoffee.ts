/**
 * POST /api/buymeacoffee — BuyMeACoffee purchase webhook.
 *
 * On a successful purchase of "Sahithyan's S<N> Notes":
 *   1. Verify HMAC-SHA256 signature from BMC.
 *   2. Extract buyer email + semester number from the payload.
 *   3. Download every module PDF for that semester from Vercel Blob (private).
 *   4. Fingerprint each PDF with the buyer's email.
 *   5. Zip them up and email the zip to the buyer via Resend.
 */
export const prerender = false;

import type { APIRoute } from "astro";
import { createHmac, timingSafeEqual } from "node:crypto";
import { list, get } from "@vercel/blob";
import { zipSync } from "fflate";
import { fingerprintPdf } from "../../lib/fingerprint";
import { titleize } from "../../utils";
import { SITE_HOST_URL } from "../../utils/values";

// BuyMeACoffee sends the signature in this header.
// Adjust if BMC's dashboard shows a different name.
const SIG_HEADER = "x-signature-sha256";

function err(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function json(body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function verifySignature(raw: string, sig: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    // Buffer length mismatch (sig missing / wrong length) → always reject
    return false;
  }
}

interface BuyerOrder {
  email: string;
  semester: number;
}

// Matches BMC product names like "Sahithyan's S1 Notes".
const PRODUCT_RE = /\bS(\d+)\b/i;

function extractOrder(raw: string): BuyerOrder | undefined {
  const body = JSON.parse(raw) as Record<string, unknown>;
  const data = (body.data ?? body) as Record<string, unknown>;
  const email =
    (data.supporter_email as string | undefined) ??
    (data.payer_email as string | undefined) ??
    (data.email as string | undefined);
  const productName = data.product_name as string | undefined;
  const semester = productName?.match(PRODUCT_RE)?.[1];

  if (!email || !semester) return undefined;
  return { email, semester: Number(semester) };
}

interface ModulePdf {
  filename: string;
  moduleName: string;
  bytes: Uint8Array;
}

async function downloadSemesterPdfs(
  semester: number,
  token: string,
): Promise<ModulePdf[]> {
  const { blobs } = await list({ prefix: `pdfs/s${semester}-`, token });

  const pdfs = await Promise.all(
    blobs.map(async (blob): Promise<ModulePdf> => {
      const blobRes = await get(blob.url, { token, access: "private" });
      const bytes = new Uint8Array(
        await new Response(blobRes!.stream).arrayBuffer(),
      );
      const filename = blob.pathname.replace(/^pdfs\//, "");
      const moduleName = titleize(
        filename.replace(/^s\d+-/, "").replace(/\.pdf$/, ""),
      );
      return { filename, moduleName, bytes };
    }),
  );
  return pdfs.sort((a, b) => a.moduleName.localeCompare(b.moduleName));
}

function buildEmailHtml(semester: number, moduleNames: string[]): string {
  const moduleList = moduleNames.map((name) => `<li>${name}</li>`).join("");

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;">
  <p>Hi there,</p>
  <p>Thanks so much for grabbing the Semester ${semester} notes! Attached is a zip with every module, ready to study from:</p>
  <ul>${moduleList}</ul>
  <p>These PDFs are personalized for you, so please keep them to yourself rather than sharing or reposting them.</p>
  <p>If anything's missing or you run into trouble opening the files, just contact me on sahithyan.dev@gmail.com and I'll sort it out.</p>
  <p>Good luck with the semester!</p>
  <p>Regards,<br>Sahithyan K.<br><a href="https://sahithyan.dev">sahithyan.dev</a></p>
  <p style="color:#666;font-size:13px;">More notes at <a href="${SITE_HOST_URL}">${SITE_HOST_URL.replace("https://", "")}</a>.</p>
</div>`;
}

async function sendNotesEmail(
  email: string,
  semester: number,
  moduleNames: string[],
  zipBytes: Uint8Array,
): Promise<Response | undefined> {
  const resendKey = import.meta.env.RESEND_API_KEY;
  const resendFrom = import.meta.env.RESEND_FROM;

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFrom,
      to: email,
      subject: `Your Semester ${semester} notes are ready`,
      html: buildEmailHtml(semester, moduleNames),
      attachments: [
        {
          filename: `s${semester}-notes.zip`,
          content: Buffer.from(zipBytes).toString("base64"),
        },
      ],
    }),
  });

  if (resendRes.ok) return undefined;

  const detail = await resendRes.text().catch(() => "");
  console.error("Resend error", resendRes.status, detail);
  return err(502, "Failed to send email");
}

export const POST: APIRoute = async ({ request }) => {
  const secret = import.meta.env.BMC_WEBHOOK_SECRET;
  if (!secret) return err(500, "Webhook secret not configured");

  // Raw body needed for HMAC verification — read before JSON parse.
  const raw = await request.text();
  const sig = request.headers.get(SIG_HEADER) ?? "";
  if (!verifySignature(raw, sig, secret)) return err(401, "Invalid signature");

  let order: BuyerOrder | undefined;
  try {
    order = extractOrder(raw);
  } catch {
    return err(400, "Invalid JSON");
  }
  if (!order) return err(400, "Buyer email or semester not found in payload");
  const { email, semester } = order;

  const token = import.meta.env.NOTES_READ_WRITE_TOKEN;
  if (!token) return err(500, "Blob token not configured");

  const pdfs = await downloadSemesterPdfs(semester, token);
  if (!pdfs.length) return err(500, `No notes found for semester ${semester}`);

  const issuedAt = new Date().toISOString();
  const fingerprinted = await Promise.all(
    pdfs.map(async ({ filename, bytes }) => ({
      filename,
      bytes: await fingerprintPdf(bytes, email, issuedAt),
    })),
  );
  const zipBytes = zipSync(
    Object.fromEntries(fingerprinted.map((f) => [f.filename, f.bytes])),
  );

  // Send via Resend — skipped (dry run) if not configured, so the
  // signature-verify + fingerprint path can be tested without Resend set up.
  const resendKey = import.meta.env.RESEND_API_KEY;
  const resendFrom = import.meta.env.RESEND_FROM;
  if (!resendKey || !resendFrom) {
    console.warn("Resend not configured — dry run, email not sent");
    return json({ ok: true, dryRun: true, email, semester, issuedAt });
  }

  const moduleNames = pdfs.map((p) => p.moduleName);
  const emailErr = await sendNotesEmail(email, semester, moduleNames, zipBytes);
  if (emailErr) return emailErr;

  return json({ ok: true });
};
