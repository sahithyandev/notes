import type { ScannedFile } from "../scan.ts";
import type { Violation } from "../report.ts";

export function checkEmptyPrereq(f: ScannedFile): Violation[] {
  if (f.prereqsLine === null || f.prereqs.length > 0) return [];

  return [
    {
      rule: "empty-prereq",
      line: f.prereqsLine,
      text: "prereqs must contain at least one note or be removed",
      snippet: "prereqs",
    },
  ];
}
