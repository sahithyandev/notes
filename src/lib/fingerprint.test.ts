import { test, expect } from "bun:test";
import {
  PDFDocument,
  PDFDict,
  PDFName,
  PDFString,
  StandardFonts,
  rgb,
  grayscale,
  cmyk,
  degrees,
  PDFOperator,
  PDFOperatorNames,
} from "pdf-lib";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fingerprintPdf, extractFingerprint } from "./fingerprint";

const OUT_DIR = join(tmpdir(), "fingerprint-test-pdfs");
mkdirSync(OUT_DIR, { recursive: true });
console.log(`fingerprint-test-pdfs: writing generated PDFs to ${OUT_DIR}`);

function save(name: string, bytes: Uint8Array): void {
  writeFileSync(join(OUT_DIR, `${name}.pdf`), bytes);
}

async function blankPdf(pageCount = 1): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) doc.addPage([595, 842]); // A4
  return doc.save();
}

test("fingerprintPdf / extractFingerprint round-trip", async () => {
  const email = `${randomUUID()}@example.com`;
  const issuedAt = new Date().toISOString();

  const fingerprinted = await fingerprintPdf(await blankPdf(), email, issuedAt);
  save("round-trip", fingerprinted);
  const result = await extractFingerprint(fingerprinted);

  expect(result.fingerprint).toBe(email);
  expect(result.issuedAt).toBe(issuedAt);
  expect(result.emails).toContain(email);
});

test("survives being re-saved through pdf-lib (e.g. merge/flatten tools)", async () => {
  const email = `${randomUUID()}@example.com`;
  const issuedAt = new Date().toISOString();

  const fingerprinted = await fingerprintPdf(await blankPdf(), email, issuedAt);

  // Load and re-save with pdf-lib, simulating a tool that re-serializes the
  // PDF (recompresses streams, rewrites xref) without touching content.
  const reloaded = await PDFDocument.load(fingerprinted, {
    updateMetadata: false,
  });
  const resaved = await reloaded.save();
  save("resaved", resaved);

  const result = await extractFingerprint(resaved);
  expect(result.fingerprint).toBe(email);
  expect(result.emails).toContain(email);
});

test("Info dict alone being stripped doesn't lose the fingerprint (XMP survives)", async () => {
  const email = `${randomUUID()}@example.com`;
  const issuedAt = new Date().toISOString();

  const fingerprinted = await fingerprintPdf(await blankPdf(), email, issuedAt);

  const doc = await PDFDocument.load(fingerprinted, { updateMetadata: false });
  doc.context.trailerInfo.Info = undefined;
  const scrubbed = await doc.save();
  save("info-dict-stripped", scrubbed);

  const result = await extractFingerprint(scrubbed);
  expect(result.fingerprint).toBe(email); // recovered via the XMP stream
  expect(result.emails).toContain(email);
});

test("text layer alone still yields the email if all metadata layers are stripped", async () => {
  const email = `${randomUUID()}@example.com`;
  const issuedAt = new Date().toISOString();

  const fingerprinted = await fingerprintPdf(await blankPdf(), email, issuedAt);

  // Simulate a thorough metadata scrubber (e.g. "remove PDF properties") that
  // clears the Info dict *and* the XMP metadata stream, but leaves page
  // content untouched.
  const doc = await PDFDocument.load(fingerprinted, { updateMetadata: false });
  doc.context.trailerInfo.Info = undefined;
  doc.catalog.delete(PDFName.of("Metadata"));
  const scrubbed = await doc.save();
  save("all-metadata-stripped", scrubbed);

  const result = await extractFingerprint(scrubbed);
  expect(result.fingerprint).toBeUndefined();
  expect(result.emails).toContain(email);
});

test("metadata layer alone still yields the fingerprint if text content is stripped", async () => {
  const email = `${randomUUID()}@example.com`;
  const issuedAt = new Date().toISOString();

  // A document with only the Info-dict layer written (no drawText calls),
  // simulating a redaction tool that strips all visible/invisible text
  // objects but leaves document metadata alone.
  const doc = await PDFDocument.create();
  doc.addPage([595, 842]);
  const info = doc.context.lookup(doc.context.trailerInfo.Info, PDFDict);
  info.set(PDFName.of("X-Fingerprint"), PDFString.of(email));
  info.set(PDFName.of("X-IssuedAt"), PDFString.of(issuedAt));
  // useObjectStreams: false keeps the Info dict as a standalone indirect
  // object rather than compressed into an object stream — otherwise our own
  // text-layer scan would pick up the metadata's plain-text serialization
  // and produce a false positive, defeating the point of this test.
  const metadataOnly = await doc.save({ useObjectStreams: false });
  save("metadata-only", metadataOnly);

  const result = await extractFingerprint(metadataOnly);
  expect(result.fingerprint).toBe(email);
  expect(result.issuedAt).toBe(issuedAt);
  expect(result.emails).not.toContain(email);
});

test("survives on a multi-page document", async () => {
  const email = `${randomUUID()}@example.com`;
  const issuedAt = new Date().toISOString();

  const fingerprinted = await fingerprintPdf(
    await blankPdf(5),
    email,
    issuedAt,
  );
  save("multi-page", fingerprinted);
  const result = await extractFingerprint(fingerprinted);

  expect(result.fingerprint).toBe(email);
  expect(result.emails).toContain(email);
});

test("survives amid pre-existing visible page content", async () => {
  const email = `${randomUUID()}@example.com`;
  const issuedAt = new Date().toISOString();

  // A page that already has real, visible text — the fingerprint's own
  // Tj/hex parsing must not get confused by unrelated content streams.
  const source = await PDFDocument.create();
  const page = source.addPage([595, 842]);
  const font = await source.embedFont(StandardFonts.Helvetica);
  page.drawText("Chapter 1: Vector Spaces", {
    x: 50,
    y: 780,
    size: 18,
    font,
    color: rgb(0, 0, 0),
  });
  const sourceBytes = await source.save();

  const fingerprinted = await fingerprintPdf(sourceBytes, email, issuedAt);
  save("pre-existing-content", fingerprinted);
  const result = await extractFingerprint(fingerprinted);

  expect(result.fingerprint).toBe(email);
  expect(result.emails).toContain(email);
  expect(result.emails).not.toContain("Chapter 1: Vector Spaces");
});

test("handles plus-addressed, mixed-case emails", async () => {
  const email = "Jane.Doe+order123@Example.COM";
  const issuedAt = new Date().toISOString();

  const fingerprinted = await fingerprintPdf(await blankPdf(), email, issuedAt);
  save("plus-addressed-email", fingerprinted);
  const result = await extractFingerprint(fingerprinted);

  expect(result.fingerprint).toBe(email);
  expect(result.emails).toContain(email);
});

test("fingerprintPdf / extractFingerprint round-trip", async () => {
  const blank = await blankPdf();
  const result = await extractFingerprint(blank);

  expect(result.emails).toEqual([]);
  expect(result.fingerprint).toBe(undefined);
  expect(result.issuedAt).toBe(undefined);
});

test("blends the invisible layer into a grayscale-filled background", async () => {
  const email = `${randomUUID()}@example.com`;
  const issuedAt = new Date().toISOString();

  // Full-bleed "re" + "g" fill so detectBackgroundColor's grid-point scan
  // (and, since this is page 2, the watermark background scan) both land
  // inside the filled rect and take the FILL_OPS match branch.
  const source = await PDFDocument.create();
  source.addPage([595, 842]);
  const page2 = source.addPage([595, 842]);
  page2.drawRectangle({
    x: 0,
    y: 0,
    width: 595,
    height: 842,
    color: grayscale(0.5),
  });
  const sourceBytes = await source.save();

  const fingerprinted = await fingerprintPdf(sourceBytes, email, issuedAt);
  save("grayscale-background", fingerprinted);
  const result = await extractFingerprint(fingerprinted);

  expect(result.fingerprint).toBe(email);
  expect(result.emails).toContain(email);
});

test("blends the invisible layer into a CMYK-filled background", async () => {
  const email = `${randomUUID()}@example.com`;
  const issuedAt = new Date().toISOString();

  const source = await PDFDocument.create();
  source.addPage([595, 842]);
  const page2 = source.addPage([595, 842]);
  page2.drawRectangle({
    x: 0,
    y: 0,
    width: 595,
    height: 842,
    color: cmyk(0.2, 0.1, 0, 0.3),
  });
  const sourceBytes = await source.save();

  const fingerprinted = await fingerprintPdf(sourceBytes, email, issuedAt);
  save("cmyk-background", fingerprinted);
  const result = await extractFingerprint(fingerprinted);

  expect(result.fingerprint).toBe(email);
  expect(result.emails).toContain(email);
});

test("survives amid a background painted with a raw 're'+'f' rectangle op", async () => {
  const email = `${randomUUID()}@example.com`;
  const issuedAt = new Date().toISOString();

  // pdf-lib's own drawRectangle helper never emits "re" (it paints via
  // moveTo/lineTo instead), but plenty of real-world PDFs (e.g. from
  // InDesign/Illustrator) do — so exercise that path directly.
  const source = await PDFDocument.create();
  source.addPage([595, 842]);
  const page2 = source.addPage([595, 842]);
  page2.pushOperators(
    PDFOperator.of(PDFOperatorNames.NonStrokingColorRgb, ["0.9", "0.9", "0.1"]),
    PDFOperator.of(PDFOperatorNames.AppendRectangle, ["0", "0", "595", "842"]),
    PDFOperator.of(PDFOperatorNames.FillNonZero),
  );
  const sourceBytes = await source.save();

  const fingerprinted = await fingerprintPdf(sourceBytes, email, issuedAt);
  save("raw-re-fill-background", fingerprinted);
  const result = await extractFingerprint(fingerprinted);

  expect(result.fingerprint).toBe(email);
  expect(result.emails).toContain(email);
});

test("survives amid a rotated, filled SVG path (cm-transformed content)", async () => {
  const email = `${randomUUID()}@example.com`;
  const issuedAt = new Date().toISOString();

  // drawSvgPath emits translate/rotate/scale "cm" operators around a
  // moveTo/lineTo/fill path — exercises the CTM matrix stack that plain
  // rectangles (no rotate) don't touch.
  const source = await PDFDocument.create();
  const page = source.addPage([595, 842]);
  page.drawSvgPath("M 0 0 L 100 0 L 100 100 L 0 100 Z", {
    x: 50,
    y: 50,
    rotate: degrees(30),
    color: rgb(0.8, 0.1, 0.1),
  });
  const sourceBytes = await source.save();

  const fingerprinted = await fingerprintPdf(sourceBytes, email, issuedAt);
  save("rotated-svg-path", fingerprinted);
  const result = await extractFingerprint(fingerprinted);

  expect(result.fingerprint).toBe(email);
  expect(result.emails).toContain(email);
});
