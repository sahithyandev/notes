import type { GraphEdge, NoteGraph } from "./note-graph";

const layout = {
  groupGap: 22,
  groupRadiusFactor: 18,
  groupRadiusPadding: 16,
  initialNodeRadiusFactor: 18,
  initialNodeRadiusOffset: 0.5,
  initialNodeAngle: Math.PI * (3 - Math.sqrt(5)),
  nodeRadius: 8,
  entryDelayStep: 37,
  entryDelayCycle: 500,
};

export interface SiteGraphNode {
  id: string;
  title: string;
  sem: number;
  module: string;
  group: string;
  ax: number;
  ay: number;
  x: number;
  y: number;
  r: number;
  delay: number;
  incoming: string[];
  outgoing: string[];
}

export interface SiteGraphBlob {
  group: string;
  sem: number;
  label: string;
  members: string[];
}

export interface SiteGraphData {
  nodes: SiteGraphNode[];
  edges: GraphEdge[];
  semList: number[];
  blobs: SiteGraphBlob[];
  longestPath: string[] | null;
}

function ringLayout(
  items: string[],
  radius: (key: string) => number,
  offsets: Map<string, [number, number]>,
) {
  const sortedItems = [...items].sort();
  const radii = sortedItems.map(radius).sort((a, b) => b - a);
  let ring = 0;
  if (sortedItems.length > 1) {
    const byCircumference =
      radii.reduce((sum, radius) => sum + 2 * radius + layout.groupGap, 0) /
      (2 * Math.PI);
    const byPair =
      (radii[0] + radii[1] + layout.groupGap) /
      (2 * Math.sin(Math.PI / sortedItems.length));
    ring = Math.max(byCircumference, byPair);
  }
  sortedItems.forEach((key, index) => {
    const angle = (index / sortedItems.length) * Math.PI * 2;
    offsets.set(key, [Math.cos(angle) * ring, Math.sin(angle) * ring]);
  });
  return ring + radii[0];
}

const prettify = (slug: string) =>
  (slug.split("/").pop() ?? slug)
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

/** Prepares the static data that the site graph client needs to render. */
export function buildSiteGraphData(graph: NoteGraph): SiteGraphData {
  const groupCounts = new Map<string, number>();
  const groupsByModule = new Map<string, string[]>();
  const modulesBySem = new Map<number, string[]>();
  for (const node of graph.nodes) {
    const count = groupCounts.get(node.group) ?? 0;
    groupCounts.set(node.group, count + 1);
    if (count) continue;
    if (!groupsByModule.has(node.module)) {
      groupsByModule.set(node.module, []);
      (
        modulesBySem.get(node.sem) ??
        modulesBySem.set(node.sem, []).get(node.sem)!
      ).push(node.module);
    }
    groupsByModule.get(node.module)!.push(node.group);
  }

  const groupRadius = (group: string) =>
    layout.groupRadiusFactor * Math.sqrt(groupCounts.get(group)!) +
    layout.groupRadiusPadding;
  const groupOffsets = new Map<string, [number, number]>();
  const moduleOffsets = new Map<string, [number, number]>();
  const moduleRadius = new Map<string, number>();
  for (const [module, groups] of groupsByModule) {
    moduleRadius.set(module, ringLayout(groups, groupRadius, groupOffsets));
  }
  const semRadius = new Map<number, number>();
  for (const [sem, modules] of modulesBySem) {
    semRadius.set(
      sem,
      ringLayout(modules, (module) => moduleRadius.get(module)!, moduleOffsets),
    );
  }
  const semList = [...modulesBySem.keys()].sort();
  const ringRadius =
    semList.length > 1
      ? (2 * Math.max(...semRadius.values()) + layout.groupGap * 2) /
        (2 * Math.sin(Math.PI / semList.length))
      : 0;
  const semAnchors = new Map(
    semList.map((sem, index) => {
      const angle = (index / semList.length) * Math.PI * 2;
      return [
        sem,
        [Math.cos(angle) * ringRadius, Math.sin(angle) * ringRadius],
      ] as const;
    }),
  );

  const incoming = new Map(
    graph.nodes.map((node) => [node.id, [] as string[]]),
  );
  const outgoing = new Map(
    graph.nodes.map((node) => [node.id, [] as string[]]),
  );
  for (const edge of graph.edges) {
    outgoing.get(edge.from)?.push(edge.to);
    incoming.get(edge.to)?.push(edge.from);
  }

  const placed = new Map<string, number>();
  const nodes = graph.nodes.map((node, index) => {
    const position = placed.get(node.group) ?? 0;
    placed.set(node.group, position + 1);
    const [sx, sy] = semAnchors.get(node.sem)!;
    const [mx, my] = moduleOffsets.get(node.module)!;
    const [gx, gy] = groupOffsets.get(node.group)!;
    const ax = sx + mx + gx;
    const ay = sy + my + gy;
    const radius =
      layout.initialNodeRadiusFactor *
      Math.sqrt(position + layout.initialNodeRadiusOffset);
    const angle = position * layout.initialNodeAngle;
    return {
      ...node,
      ax,
      ay,
      x: ax + Math.cos(angle) * radius,
      y: ay + Math.sin(angle) * radius,
      r: layout.nodeRadius,
      delay: (index * layout.entryDelayStep) % layout.entryDelayCycle,
      incoming: incoming.get(node.id)!,
      outgoing: outgoing.get(node.id)!,
    };
  });

  const nodesByGroup = new Map<string, SiteGraphNode[]>();
  for (const node of nodes) {
    (
      nodesByGroup.get(node.group) ??
      nodesByGroup.set(node.group, []).get(node.group)!
    ).push(node);
  }
  const blobs = [...nodesByGroup.entries()].map(([group, members]) => ({
    group,
    sem: members[0].sem,
    label: prettify(group),
    members: members.map((node) => node.id),
  }));

  return {
    nodes,
    edges: graph.edges,
    semList,
    blobs,
    longestPath: graph.longestPath(),
  };
}
