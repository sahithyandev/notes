import type { Node } from "unist";
export type MdNode = Node & {
  children?: MdNode[];
  value?: string;
  depth?: number;
  url?: string;
  alt?: string;
  ordered?: boolean;
};
