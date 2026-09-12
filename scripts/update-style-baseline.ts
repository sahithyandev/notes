import { join } from "node:path";
import { computeBaselineEntries } from "../src/integrations/notes-style-validator/validate.ts";
import { saveBaseline } from "../src/integrations/notes-style-validator/baseline.ts";

const docsRoot = join(process.cwd(), "docs");
const entries = computeBaselineEntries(docsRoot);
saveBaseline(entries);

const total = entries.reduce((n, e) => n + e.count, 0);
console.log(
  "notes-style-validator: baseline updated with " +
    entries.length +
    " entries (" +
    total +
    " violations) covering " +
    new Set(entries.map((e) => e.file)).size +
    " files.",
);
