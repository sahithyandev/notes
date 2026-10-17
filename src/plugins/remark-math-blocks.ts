import { visit } from "unist-util-visit";
import { isMathBlockKind, mathBlockDepth } from "../utils/math-blocks.ts";

interface JsxAttribute {
  type: string;
  name?: string;
  value?: unknown;
}

interface JsxElement {
  type: string;
  name: string | null;
  attributes: JsxAttribute[];
  children: unknown[];
}

function stringAttr(node: JsxElement, name: string): string | undefined {
  const attr = node.attributes.find(
    (a) => a.type === "mdxJsxAttribute" && a.name === name,
  );
  return typeof attr?.value === "string" ? attr.value : undefined;
}

// Splits "Abel's $x^2$ Identity" into text and inlineMath nodes, so math in a
// `name` attribute is typeset by the same KaTeX pass as the rest of the note.
function inlineNodes(text: string) {
  const nodes: Array<{ type: string; value: string }> = [];
  const parts = text.split(/(\$[^$]+\$)/);
  for (const part of parts) {
    if (!part) continue;
    if (part.length > 2 && part.startsWith("$") && part.endsWith("$")) {
      nodes.push({ type: "inlineMath", value: part.slice(1, -1) });
    } else {
      nodes.push({ type: "text", value: part });
    }
  }
  return nodes;
}

// Turns the `name` of a <Theorem> or <Definition> into a real heading, injected
// as the element's first child, so a named block gets an anchor and a TOC
// entry from Astro's normal heading pass. An unnamed block gets no heading.
// Must run before remarkKatexMhchem, which collects heading HTML by index.
// An unnamed first <Theorem> in a note whose title already says "Theorem" gets
// `titled`, so the component drops its redundant "Theorem" label.
export function remarkMathBlocks() {
  return (
    tree: unknown,
    file?: { data?: { astro?: { frontmatter?: { title?: unknown } } } },
  ) => {
    const title = file?.data?.astro?.frontmatter?.title;
    let titleSaysTheorem =
      typeof title === "string" && /\btheorem\b/i.test(title);
    visit(tree as never, "mdxJsxFlowElement", (raw) => {
      const node = raw as JsxElement;
      if (!node.name || !isMathBlockKind(node.name)) return;

      const name = stringAttr(node, "name");
      if (node.name === "Theorem" && !name && titleSaysTheorem) {
        node.attributes.push({
          type: "mdxJsxAttribute",
          name: "titled",
          value: null,
        });
      }
      if (node.name === "Theorem") titleSaysTheorem = false;
      if (!name) return;

      node.children.unshift({
        type: "heading",
        depth: mathBlockDepth(stringAttr(node, "level")) ?? 2,
        children: inlineNodes(name),
      });
    });
  };
}
