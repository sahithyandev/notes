import { expect, test } from "bun:test";
import { renderLlmsFullTxt, renderLlmsTxt } from "./llms";

const notes = [
  { id: "s3/operating-systems/process", title: "Process" },
  {
    id: "s1/electrical-fundamentals/capacitors",
    title: "Capacitors",
    description: " Stores\ncharge. ",
  },
];

test("renderLlmsTxt links each subject and the full catalogue", () => {
  const text = renderLlmsTxt(notes, "Example Notes", "https://notes.example");

  expect(text).toContain("# Example Notes");
  expect(text).toContain("### Semester 1");
  expect(text).toContain(
    "- [Electrical Fundamentals](https://notes.example/s1/electrical-fundamentals): 1 notes",
  );
  expect(text).toContain("https://notes.example/llms-full.txt");
  expect(text.indexOf("Semester 1")).toBeLessThan(text.indexOf("Semester 3"));
});

test("renderLlmsFullTxt preserves canonical note URLs and descriptions", () => {
  const text = renderLlmsFullTxt(
    notes,
    "Example Notes",
    "https://notes.example",
  );

  expect(text).toContain("# Example Notes: Full Note Catalogue");
  expect(text).toContain("### Semester 1 — Electrical Fundamentals");
  expect(text).toContain(
    "- [Capacitors](https://notes.example/s1/electrical-fundamentals/capacitors): Stores charge.",
  );
});
