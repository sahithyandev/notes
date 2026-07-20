import {
  PDFDocument,
  PDFDict,
  PDFName,
  PDFString,
  PDFStream,
  PDFRawStream,
  PDFArray,
  PDFOperator,
  PDFOperatorNames,
  StandardFonts,
  rgb,
  decodePDFRawStream,
  type PDFPage,
  type RGB,
} from "pdf-lib";
import { inflateSync } from "node:zlib";

const GRID = [0.2, 0.5, 0.8];
const XMP_NS = "https://sahithyan.notes/ns/1.0/";
const WATERMARK_SIZE = 8;
const WATERMARK_SHIFT = 0.15; // how far the watermark tone is nudged off the detected background

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Walks a page's content stream tracking the CTM and fill color to find
 * what's actually painted at (x, y) — so the watermark can blend into
 * colored bands instead of standing out as a fixed gray. Falls back to white
 * if no covering fill is found (the common case for plain content pages).
 */
function detectBackgroundColor(
  page: PDFPage,
  x: number,
  y: number,
): [number, number, number] {
  type Matrix = [number, number, number, number, number, number];
  const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];
  const multiply = (m: Matrix, n: Matrix): Matrix => [
    m[0] * n[0] + m[1] * n[2],
    m[0] * n[1] + m[1] * n[3],
    m[2] * n[0] + m[3] * n[2],
    m[2] * n[1] + m[3] * n[3],
    m[4] * n[0] + m[5] * n[2] + n[4],
    m[4] * n[1] + m[5] * n[3] + n[5],
  ];
  const apply = (m: Matrix, px: number, py: number): [number, number] => [
    m[0] * px + m[2] * py + m[4],
    m[1] * px + m[3] * py + m[5],
  ];

  const contents = page.node.Contents();
  const streams =
    contents instanceof PDFArray
      ? contents.asArray().map((ref) => page.doc.context.lookup(ref))
      : [contents];

  let text = "";
  for (const s of streams) {
    if (!(s instanceof PDFRawStream)) continue;
    text += Buffer.from(decodePDFRawStream(s).decode()).toString("latin1");
    text += " ";
  }

  let ctm: Matrix = IDENTITY;
  const stack: Matrix[] = [];
  let fillColor: [number, number, number] | null = null;
  let path: Array<[number, number]> = [];
  let numBuf: number[] = [];
  let result: [number, number, number] | undefined;

  const FILL_OPS = new Set(["f", "F", "f*", "B", "B*", "b", "b*"]);
  const CLEAR_OPS = new Set(["n", "S", "s"]);

  for (const tok of text.split(/\s+/)) {
    if (!tok) continue;
    if (/^-?[0-9]*\.?[0-9]+$/.test(tok)) {
      numBuf.push(Number(tok));
      continue;
    }
    switch (tok) {
      case "q":
        stack.push(ctm);
        break;
      case "Q":
        ctm = stack.pop() ?? IDENTITY;
        break;
      case "cm":
        if (numBuf.length >= 6) {
          ctm = multiply(numBuf.slice(-6) as Matrix, ctm);
        }
        break;
      case "rg":
        if (numBuf.length >= 3)
          fillColor = numBuf.slice(-3) as [number, number, number];
        break;
      case "g":
        if (numBuf.length >= 1) {
          const v = numBuf[numBuf.length - 1];
          fillColor = [v, v, v];
        }
        break;
      case "k":
        if (numBuf.length >= 4) {
          const [c, m2, y2, k] = numBuf.slice(-4);
          fillColor = [
            (1 - c) * (1 - k),
            (1 - m2) * (1 - k),
            (1 - y2) * (1 - k),
          ];
        }
        break;
      case "m":
      case "l":
        if (numBuf.length >= 2) {
          const [px, py] = numBuf.slice(-2);
          path.push(apply(ctm, px, py));
        }
        break;
      case "re":
        if (numBuf.length >= 4) {
          const [rx, ry, rw, rh] = numBuf.slice(-4);
          path.push(
            apply(ctm, rx, ry),
            apply(ctm, rx + rw, ry),
            apply(ctm, rx + rw, ry + rh),
            apply(ctm, rx, ry + rh),
          );
        }
        break;
      default:
        if (FILL_OPS.has(tok)) {
          if (path.length && fillColor) {
            const xs = path.map((p) => p[0]);
            const ys = path.map((p) => p[1]);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);
            if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
              result = fillColor;
            }
          }
          path = [];
        } else if (CLEAR_OPS.has(tok)) {
          path = [];
        }
        break;
    }
    numBuf = [];
  }

  return result ?? [1, 1, 1];
}

function watermarkColorFor(bg: [number, number, number]): RGB {
  const [r, g, b] = bg;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  const shift = luminance > 0.5 ? -WATERMARK_SHIFT : WATERMARK_SHIFT;
  const clamp = (v: number) => Math.min(1, Math.max(0, v + shift));
  return rgb(clamp(r), clamp(g), clamp(b));
}

function buildXmpPacket(email: string, issuedAt: string): string {
  return `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
<rdf:Description rdf:about="" xmlns:sn="${XMP_NS}">
<sn:Fingerprint>${escapeXml(email)}</sn:Fingerprint>
<sn:IssuedAt>${escapeXml(issuedAt)}</sn:IssuedAt>
</rdf:Description>
</rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

/**
 * Inject an invisible fingerprint into a PDF.
 *
 * Layers (each independent — stripping one leaves the others):
 *   1. Invisible text — email at 1pt, white (rgb 1,1,1), 9 positions per page.
 *      Invisible in viewers but present in the content stream; recoverable via
 *      `pdftotext` or any PDF parser.
 *   2. Info-dict metadata — /X-Fingerprint and /X-IssuedAt; readable with
 *      `exiftool` or `pypdf`.
 *   3. XMP metadata stream — same fields, in a separate structure some
 *      "remove hidden info" tools don't also clear.
 *   4. Faint visible watermark — survives flattening/screenshots/rescans,
 *      since it's baked into the rendered pixels, not the document structure.
 */
export async function fingerprintPdf(
  pdfBytes: Uint8Array,
  email: string,
  issuedAt: string,
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes, { updateMetadata: false });
  const font = await doc.embedFont(StandardFonts.Helvetica);

  const watermarkText = `Licensed to ${email}`;
  const watermarkWidth = font.widthOfTextAtSize(watermarkText, WATERMARK_SIZE);
  const watermarkY = 16;

  const pages = doc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const watermarkX = (width - watermarkWidth) / 2;

    // Detect every background color needed before drawing anything on this
    // page — drawing first would make later detections see our own marks.
    const gridPoints = GRID.flatMap((fx) =>
      GRID.map((fy) => ({ x: width * fx, y: height * fy })),
    ).map(({ x, y }) => ({ x, y, bg: detectBackgroundColor(page, x, y) }));
    const watermarkBg =
      i === 0 ? null : detectBackgroundColor(page, watermarkX, watermarkY);

    // Invisible layer matches the exact background at each point, so it
    // stays imperceptible on colored bands too, not just on white pages.
    for (const { x, y, bg } of gridPoints) {
      page.drawText(email, { x, y, size: 1, font, color: rgb(...bg) });
    }

    // Skip the title page — its colored band makes any fixed watermark tone
    // either invisible or, worse, a bright contrasting caption.
    if (i === 0) continue;

    // Mark as a non-content Artifact so spec-compliant viewers (Acrobat,
    // screen readers) exclude it from text selection, copy, and search.
    // Note: this doesn't stop OS-level OCR (e.g. macOS Live Text), which
    // reads rendered pixels — any legible watermark is selectable there
    // regardless of the underlying PDF structure.
    page.pushOperators(
      PDFOperator.of(PDFOperatorNames.BeginMarkedContent, [
        PDFName.of("Artifact"),
      ]),
    );
    page.drawText(watermarkText, {
      x: watermarkX,
      y: watermarkY,
      size: WATERMARK_SIZE,
      font,
      color: watermarkColorFor(watermarkBg!),
    });
    page.pushOperators(PDFOperator.of(PDFOperatorNames.EndMarkedContent));
  }

  // Low-level Info-dict insertion
  const trailerInfo = doc.context.trailerInfo;
  if (trailerInfo.Info) {
    const info = doc.context.lookup(trailerInfo.Info, PDFDict);
    info.set(PDFName.of("X-Fingerprint"), PDFString.of(email));
    info.set(PDFName.of("X-IssuedAt"), PDFString.of(issuedAt));
  }

  // XMP metadata stream — redundant with the Info dict above
  const xmpBytes = new TextEncoder().encode(buildXmpPacket(email, issuedAt));
  const metadataStream = doc.context.stream(xmpBytes, {
    Type: "Metadata",
    Subtype: "XML",
  });
  const metadataRef = doc.context.register(metadataStream);
  doc.catalog.set(PDFName.of("Metadata"), metadataRef);

  return doc.save();
}

export interface ExtractedFingerprint {
  fingerprint?: string;
  issuedAt?: string;
  emails: string[];
}

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

/**
 * Reverse-fingerprint: recover the metadata and invisible text layers written
 * by fingerprintPdf.
 */
export async function extractFingerprint(
  pdfBytes: Uint8Array,
): Promise<ExtractedFingerprint> {
  const doc = await PDFDocument.load(pdfBytes, {
    updateMetadata: false,
    ignoreEncryption: true,
  });

  let fingerprint: string | undefined;
  let issuedAt: string | undefined;

  const infoRef = doc.context.trailerInfo.Info;
  if (infoRef) {
    const info = doc.context.lookup(infoRef, PDFDict);
    const fp = info.get(PDFName.of("X-Fingerprint"));
    const ia = info.get(PDFName.of("X-IssuedAt"));
    if (fp instanceof PDFString) fingerprint = fp.decodeText();
    if (ia instanceof PDFString) issuedAt = ia.decodeText();
  }

  // XMP metadata stream — fallback in case the Info dict was stripped
  const metadataRef = doc.catalog.get(PDFName.of("Metadata"));
  if (metadataRef) {
    const stream = doc.context.lookupMaybe(metadataRef, PDFStream);
    const xml = stream?.getContentsString();
    if (xml) {
      const fpMatch = xml.match(/<sn:Fingerprint>([^<]*)<\/sn:Fingerprint>/);
      const iaMatch = xml.match(/<sn:IssuedAt>([^<]*)<\/sn:IssuedAt>/);
      if (!fingerprint && fpMatch) fingerprint = fpMatch[1];
      if (!issuedAt && iaMatch) issuedAt = iaMatch[1];
    }
  }

  // Content streams store drawText as PDF hex strings, e.g. <7465...> Tj.
  // Inflate every stream and decode any hex strings to recover the text layer.
  const buf = Buffer.from(pdfBytes);
  const pdfStr = buf.toString("binary");
  const emails = new Set<string>();

  const streamRe = /stream\r?\n/g;
  let m: RegExpExecArray | null;
  while ((m = streamRe.exec(pdfStr)) !== null) {
    const start = m.index + m[0].length;
    const endIdx = pdfStr.indexOf("endstream", start);
    if (endIdx < 0) continue;

    let text: string;
    try {
      text = inflateSync(buf.subarray(start, endIdx)).toString("utf8");
    } catch {
      text = pdfStr.slice(start, endIdx); // uncompressed stream
    }

    for (const hex of text.match(/<[0-9A-Fa-f]+>/g) ?? []) {
      const decoded = Buffer.from(hex.slice(1, -1), "hex").toString("utf8");
      for (const email of decoded.match(EMAIL_RE) ?? []) emails.add(email);
    }
    // Fallback in case a viewer wrote literal (…) strings uncompressed
    for (const email of text.match(EMAIL_RE) ?? []) emails.add(email);
  }

  return { fingerprint, issuedAt, emails: [...emails] };
}
