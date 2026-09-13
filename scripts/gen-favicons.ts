/**
 * Regenerates every raster icon in public/ from public/favicon.svg.
 *
 *   bun scripts/gen-favicons.ts
 *
 * Outputs: favicon-16x16.png, favicon-32x32.png, apple-touch-icon.png,
 * android-chrome-192x192.png, android-chrome-512x512.png, favicon.ico
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const PUBLIC = join(import.meta.dir, "..", "public");
const svg = await readFile(join(PUBLIC, "favicon.svg"));

const BG = { r: 0x23, g: 0x38, b: 0xc0, alpha: 1 };

/** Transparent-background render (the tile is already drawn inside the SVG). */
async function png(size: number): Promise<Buffer> {
  return sharp(svg, { density: 384 })
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

/** Opaque render for platforms that ignore rounded corners / alpha (iOS). */
async function opaquePng(size: number): Promise<Buffer> {
  return sharp(svg, { density: 384 })
    .resize(size, size, { fit: "contain", background: BG })
    .flatten({ background: BG })
    .png()
    .toBuffer();
}

/** Minimal ICO writer: each entry carries a full PNG payload. */
function buildIco(images: { size: number; data: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const dir = Buffer.alloc(16 * images.length);
  let offset = 6 + dir.length;
  const payloads: Buffer[] = [];

  images.forEach((img, i) => {
    const b = i * 16;
    dir.writeUInt8(img.size >= 256 ? 0 : img.size, b + 0);
    dir.writeUInt8(img.size >= 256 ? 0 : img.size, b + 1);
    dir.writeUInt8(0, b + 2);
    dir.writeUInt8(0, b + 3);
    dir.writeUInt16LE(1, b + 4);
    dir.writeUInt16LE(32, b + 6);
    dir.writeUInt32LE(img.data.length, b + 8);
    dir.writeUInt32LE(offset, b + 12);
    offset += img.data.length;
    payloads.push(img.data);
  });

  return Buffer.concat([header, dir, ...payloads]);
}

const jobs: [string, Promise<Buffer>][] = [
  ["favicon-16x16.png", png(16)],
  ["favicon-32x32.png", png(32)],
  ["apple-touch-icon.png", opaquePng(180)],
  ["android-chrome-192x192.png", opaquePng(192)],
  ["android-chrome-512x512.png", opaquePng(512)],
];

for (const [name, job] of jobs) {
  await writeFile(join(PUBLIC, name), await job);
  console.log("wrote", name);
}

const ico = buildIco([
  { size: 16, data: await png(16) },
  { size: 32, data: await png(32) },
  { size: 48, data: await png(48) },
]);
await writeFile(join(PUBLIC, "favicon.ico"), ico);
console.log("wrote favicon.ico");
