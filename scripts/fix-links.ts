import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const semesterMap: Record<string, string> = {
  "electrical-fundamentals": "s1",
  "fluid-mechanics": "s1",
  mathematics: "s1",
  mechanics: "s1",
  "programming-fundamentals": "s1",
  "properties-of-materials": "s1",
  "computer-organization-and-digital-design": "s2",
  "data-structures-and-algorithms": "s2",
  "methods-of-mathematics": "s2",
  "program-construction": "s2",
  "theory-of-electricity": "s2",
  "applied-statistics": "s3",
  "artificial-intelligence": "s3",
  "computer-architecture": "s3",
  "data-communication-and-networking": "s3",
  "database-systems": "s3",
  "differential-equations": "s3",
  "engineering-thermodynamics": "s3",
  "operating-systems": "s3",
  "computer-networks": "s4",
  "graph-theory": "s4",
  iot: "s4",
  "linear-algebra": "s4",
  "operating-systems-security": "s4",
  "software-engineering": "s4",
  "theory-of-computing": "s4",
};

const subjectPattern = Object.keys(semesterMap).join("|");
// Matches (/subject-folder...) but not already prefixed with /s1/ etc.
const linkRegex = new RegExp(`\\(/(${subjectPattern})(/[^)]*)?\\)`, "g");

const dryRun = process.argv.includes("--dry-run");
const dir = import.meta.dirname;
console.log("dir=", dir);
const docsDir = join(dir, "../docs");

function walkFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(full));
    } else if (entry.name.endsWith(".md") || entry.name.endsWith(".mdx")) {
      files.push(full);
    }
  }
  return files;
}

let totalFiles = 0;
let totalReplacements = 0;

for (const file of walkFiles(docsDir)) {
  const original = readFileSync(file, "utf-8");
  let count = 0;
  const updated = original.replace(linkRegex, (match, subject, rest) => {
    const sem = semesterMap[subject];
    count++;
    return `(/${sem}/${subject}${rest ?? ""})`;
  });

  if (count > 0) {
    totalFiles++;
    totalReplacements += count;
    console.log(
      `${dryRun ? "[dry-run] " : ""}${file} — ${count} replacement(s)`,
    );
    if (!dryRun) {
      writeFileSync(file, updated, "utf-8");
    }
  }
}

console.log(
  `\n${dryRun ? "[dry-run] " : ""}Done: ${totalReplacements} replacement(s) across ${totalFiles} file(s).`,
);
