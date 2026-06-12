import type { Node } from "unist";

export interface MdJsxAttribute {
  type: "mdxJsxAttribute";
  name: string;
  value:
    | string
    | { type: "mdxJsxAttributeValueExpression"; value: string }
    | null;
}

export interface MdNode extends Node {
  children?: MdNode[];
  value?: string;
  depth?: number;
  url?: string;
  alt?: string;
  ordered?: boolean;
  name?: string;
  attributes?: MdJsxAttribute[];
}

export interface MdCodeNode extends MdNode {
  lang: string | null;
}

export function isMdCodeNode(node: MdNode): node is MdCodeNode {
  return (
    "lang" in node && (node.lang === null || typeof node.lang === "string")
  );
}
