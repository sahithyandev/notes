import { describe, expect, test } from "bun:test";
import {
  buildGlossary,
  extractGlossaryEntries,
  renderGlossaryText,
  titleCaseGlossaryAlias,
} from "./glossary";

describe("extractGlossaryEntries", () => {
  test("uses the closest preceding heading and links to it", () => {
    expect(
      extractGlossaryEntries({
        id: "s3/operating-systems/services",
        title: "Services",
        body: "## Command-Line Interface\n\n<Aka>CLI</Aka>. Takes commands.",
      }),
    ).toEqual([
      {
        alias: "CLI",
        term: "Command-Line Interface",
        noteTitle: "Services",
        href: "/s3/operating-systems/services#command-line-interface",
      },
    ]);
  });

  test("prefers a closer list item and falls back to the note title", () => {
    expect(
      extractGlossaryEntries({
        id: "s1/test",
        title: "Fallback Title",
        body: "<Aka>FT</Aka>\n\n- **Fast Transform**\n  <Aka>FFT</Aka>",
      }),
    ).toEqual([
      {
        alias: "FT",
        term: "Fallback Title",
        noteTitle: "Fallback Title",
        href: "/s1/test",
      },
      {
        alias: "FFT",
        term: "Fast Transform",
        noteTitle: "Fallback Title",
        href: "/s1/test",
      },
    ]);
  });

  test("sorts entries case-insensitively", () => {
    expect(
      buildGlossary([
        { id: "a", title: "A", body: "<Aka>zeta</Aka>" },
        { id: "b", title: "B", body: "<Aka>Alpha</Aka>" },
      ]).map((entry) => entry.alias),
    ).toEqual(["Alpha", "zeta"]);
  });

  test("renders inline TeX while escaping surrounding text", () => {
    const html = renderGlossaryText(
      "Rubber has $\\nu = 0.5$ <strong>here</strong>",
    );

    expect(html).toContain('class="katex"');
    expect(html).toContain("Rubber has ");
    expect(html).toContain("&lt;strong&gt;here&lt;/strong&gt;");
  });

  test("title-cases aliases without changing acronyms or TeX", () => {
    expect(titleCaseGlossaryAlias("elevator algorithm")).toBe(
      "Elevator Algorithm",
    );
    expect(titleCaseGlossaryAlias("CLI")).toBe("CLI");
    expect(titleCaseGlossaryAlias("$r$-regular graph")).toBe(
      "$r$-Regular Graph",
    );
  });
});
