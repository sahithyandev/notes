import { expect, test } from "bun:test";
import { resolvePrereqSlug } from "./note-path";

test("resolves relative prerequisite references and preserves anchors", () => {
  expect(
    resolvePrereqSlug(
      "s5/business/economics/firm-and-costs",
      "../accounting/cost-terms#fixed-costs",
    ),
  ).toBe("s5/business/accounting/cost-terms#fixed-costs");
});

test("leaves absolute prerequisite IDs unchanged", () => {
  expect(
    resolvePrereqSlug(
      "s5/business/economics/firm-and-costs",
      "s4/accounting/cost-terms",
    ),
  ).toBe("s4/accounting/cost-terms");
});
