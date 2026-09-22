import { basename } from "node:path";
import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";

export function checkFilename(f: ScannedFile): Violation[] {
  const name = basename(f.file);
  const violations: Violation[] = [];

  if (/[A-Z]/.test(name)) {
    violations.push({
      rule: "filename",
      line: 1,
      text: `filename "${name}" contains uppercase letters`,
      snippet: name,
    });
  }

  if (name.endsWith(".md")) {
    violations.push({
      rule: "filename",
      line: 1,
      text: `filename "${name}" uses .md instead of .mdx`,
      snippet: name,
    });
  }

  if (/introduction/i.test(name) && !/^01-/.test(name)) {
    violations.push({
      rule: "filename",
      line: 1,
      text: `filename "${name}" contains "introduction" but doesn't start with "01-"`,
      snippet: name,
    });
  }

  return violations;
}
