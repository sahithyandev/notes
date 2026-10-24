import { test, expect } from "bun:test";
import { summaryNotebookId } from "./summary-notebook";

test("summaryNotebookId names the summary of the note's module", () => {
  expect(summaryNotebookId("s5/numerical-methods/gaussian-elimination")).toBe(
    "numerical-methods-summary",
  );
});

test("summaryNotebookId is null for a note outside a module", () => {
  expect(summaryNotebookId("s5/introduction")).toBeNull();
});
