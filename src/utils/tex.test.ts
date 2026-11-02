import { expect, test } from "bun:test";
import { inlineTex, parseInlineTex } from "./tex";

test("parseInlineTex separates inline TeX from prose", () => {
  expect(
    parseInlineTex(
      "Order 4 Runge-Kutta combines slopes with weights $1, 2, 2, 1$.",
    ),
  ).toEqual([
    {
      type: "text",
      value: "Order 4 Runge-Kutta combines slopes with weights ",
    },
    { type: "tex", value: "1, 2, 2, 1" },
    { type: "text", value: "." },
  ]);
});

test("parseInlineTex leaves unmatched delimiters as prose", () => {
  expect(parseInlineTex("Costs $5 per step")).toEqual([
    { type: "text", value: "Costs $5 per step" },
  ]);
});

test("inlineTex escapes prose and renders only inline TeX", () => {
  const html = inlineTex("Compare <a> with $x_1$.");

  expect(html).toContain("Compare &lt;a&gt; with ");
  expect(html).toContain('class="katex"');
  expect(html).not.toContain("&lt;a&gt;</span>");
});
