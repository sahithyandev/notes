/**
 * Reverse-fingerprint: extract embedded fingerprint info from a PDF.
 * Run: bun scripts/extract-fingerprint.ts <path-to-pdf>
 */
import { readFile } from "node:fs/promises";
import { extractFingerprint } from "../src/lib/fingerprint";

const path = process.argv[2];
if (!path) {
  console.error("Usage: bun scripts/extract-fingerprint.ts <path-to-pdf>");
  process.exit(1);
}

const bytes = await readFile(path);
const { fingerprint, issuedAt, emails } = await extractFingerprint(bytes);

console.log("Metadata layer:");
console.log("  X-Fingerprint:", fingerprint ?? "(none found)");
console.log("  X-IssuedAt:   ", issuedAt ?? "(none found)");
console.log();
console.log("Text layer:");
if (emails.length) {
  for (const email of emails) console.log("  ", email);
} else {
  console.log("  (no email found)");
}

if (!fingerprint && !emails.length) process.exit(1);
