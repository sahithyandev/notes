import type { Node } from "unist";
export interface MdNode extends Node {
  children?: MdNode[];
  value?: string;
  depth?: number;
  url?: string;
  alt?: string;
  ordered?: boolean;
}

export interface MdCodeNode extends MdNode {
  lang: string | null;
}

export function isMdCodeNode(node: MdNode): node is MdCodeNode {
  return (
    "lang" in node && (node.lang === null || typeof node.lang === "string")
  );
}
