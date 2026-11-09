import { describe, expect, test } from "bun:test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { remarkNoteLinks } from "./remark-note-links";

function render(value: string, path: string): string {
  return String(
    unified()
      .use(remarkParse)
      .use(remarkNoteLinks)
      .use(remarkStringify)
      .processSync({ value, path }),
  );
}

describe("remarkNoteLinks", () => {
  const source = "/workspace/docs/s5/secure-app-dev/25-dynamic-analysis.mdx";

  test("resolves same-directory links and removes numeric prefixes", () => {
    expect(render("[security](./security-analysis)", source)).toContain(
      "[security](/s5/secure-app-dev/security-analysis)",
    );
  });

  test("resolves parent links", () => {
    expect(render("[intro](../01-introduction)", source)).toContain(
      "[intro](/s5/introduction)",
    );
  });

  test("supports bare site-root semester links", () => {
    expect(render("[Arduino](s4/iot/arduino)", source)).toContain(
      "[Arduino](/s4/iot/arduino)",
    );
  });

  test("preserves external links and anchors", () => {
    const output = render(
      "[web](https://example.com) [section](#part)",
      source,
    );
    expect(output).toContain("[web](https://example.com)");
    expect(output).toContain("[section](#part)");
  });
});
