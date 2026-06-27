import { put, list, get } from "@vercel/blob";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { c, step } from "./log";

const PDF_OUT_DIR = "pdf-exports";
const MANIFEST_BLOB_PATH = "pdfs/manifest.json";
const token = process.env.NOTES_READ_WRITE_TOKEN;

async function fetchManifest(): Promise<Record<string, string>> {
  const { blobs } = await list({ prefix: "pdfs/manifest.json", token });
  if (!blobs.length) return {};
  try {
    const result = await get(blobs[0].url, { token, access: "private" });
    if (!result || result.statusCode !== 200) return {};
    return JSON.parse(await new Response(result.stream).text());
  } catch {
    return {};
  }
}

async function saveManifest(manifest: Record<string, string>) {
  await put(MANIFEST_BLOB_PATH, JSON.stringify(manifest), {
    access: "private",
    allowOverwrite: true,
    contentType: "application/json",
    token,
  });
}

function sha256(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

export async function uploadPdf(moduleId: string): Promise<boolean> {
  const pdfName = moduleId.replace("/", "-") + ".pdf";
  const pdfPath = resolve(PDF_OUT_DIR, pdfName);

  let buf: Buffer;
  try {
    buf = await readFile(pdfPath);
  } catch {
    console.error(`${c.red}upload: PDF not found${c.reset}  ${pdfPath}`);
    return false;
  }

  const hash = sha256(buf);
  const manifest = await fetchManifest();

  if (manifest[moduleId] === hash) {
    step(`upload skip (unchanged)  ${moduleId}`);
    return false;
  }

  const t = performance.now();
  await put(`pdfs/${pdfName}`, buf, {
    access: "private",
    allowOverwrite: true,
    contentType: "application/pdf",
    token,
  });
  step(`uploaded  ${moduleId}`, performance.now() - t);

  manifest[moduleId] = hash;
  await saveManifest(manifest);
  return true;
}
