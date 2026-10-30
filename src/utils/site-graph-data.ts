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

export interface SiteGraphModuleDependency {
  from: string;
  to: string;
  links: number;
}

export interface SiteGraphData {
  nodes: SiteGraphNode[];
  edges: GraphEdge[];
  semList: number[];
  blobs: SiteGraphBlob[];
  moduleDependencies: SiteGraphModuleDependency[];
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

type ModulePosition = { x: number; y: number };

/**
 * Refines the ring seed into a stable overview. Repeated links pull modules
 * together, while their measured radii keep the clusters from sitting on top
 * of one another. This runs at build time, so every visitor sees the same map.
 */
function settleModulePositions(
  modulesBySem: Map<number, string[]>,
  moduleRadius: Map<string, number>,
  moduleOffsets: Map<string, [number, number]>,
  semAnchors: Map<number, readonly [number, number]>,
  moduleDependencies: SiteGraphModuleDependency[],
) {
  const positions = new Map<string, ModulePosition>();
  for (const [sem, modules] of modulesBySem) {
    const [sx, sy] = semAnchors.get(sem)!;
    for (const module of modules) {
      const [mx, my] = moduleOffsets.get(module)!;
      positions.set(module, { x: sx + mx, y: sy + my });
    }
  }

  const links = new Map<string, number>();
  for (const dependency of moduleDependencies) {
    const [a, b] = [dependency.from, dependency.to].sort();
    const key = `${a}\u0000${b}`;
    links.set(key, (links.get(key) ?? 0) + dependency.links);
  }
  const modules = [...positions.keys()].sort();
  const pairs = [...links].map(([key, count]) => {
    const [from, to] = key.split("\u0000");
    return { from, to, count };
  });

  for (let step = 0; step < 260; step++) {
    const forces = new Map(modules.map((module) => [module, { x: 0, y: 0 }]));
    const push = (module: string, x: number, y: number) => {
      const force = forces.get(module)!;
      force.x += x;
      force.y += y;
    };

    for (const { from, to, count } of pairs) {
      const a = positions.get(from)!;
      const b = positions.get(to)!;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.hypot(dx, dy) || 1;
      const clearance = moduleRadius.get(from)! + moduleRadius.get(to)! + 34;
      // More direct links create a shorter, but never overlapping, target.
      const desired = clearance + 240 / Math.sqrt(count);
      const pull =
        ((distance - desired) / distance) *
        0.006 *
        Math.min(Math.sqrt(count), 3);
      push(from, dx * pull, dy * pull);
      push(to, -dx * pull, -dy * pull);
    }

    for (let i = 0; i < modules.length; i++) {
      for (let j = i + 1; j < modules.length; j++) {
        const from = modules[i];
        const to = modules[j];
        const a = positions.get(from)!;
        const b = positions.get(to)!;
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let distance = Math.hypot(dx, dy);
        if (!distance) {
          dx = 1;
          dy = 0;
          distance = 1;
        }
        const minimum = moduleRadius.get(from)! + moduleRadius.get(to)! + 32;
        if (distance >= minimum) continue;
        const repel = ((minimum - distance) / distance) * 0.16;
        push(from, -dx * repel, -dy * repel);
        push(to, dx * repel, dy * repel);
      }
    }

    for (const [sem, semModules] of modulesBySem) {
      const [sx, sy] = semAnchors.get(sem)!;
      for (const module of semModules) {
        const p = positions.get(module)!;
        // Keep the semester grouping recognisable without overpowering links.
        push(module, (sx - p.x) * 0.0025, (sy - p.y) * 0.0025);
      }
    }

    for (const module of modules) {
      const p = positions.get(module)!;
      const force = forces.get(module)!;
      p.x += force.x;
      p.y += force.y;
    }
  }

  return positions;
}

/** Prepares the static data that the site graph client needs to render. */
export function buildSiteGraphData(graph: NoteGraph): SiteGraphData {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  // Keep only edges that cross a module boundary. Multiple direct note links
  // between the same modules become one useful relationship for the overview.
  const dependencyCounts = new Map<string, SiteGraphModuleDependency>();
  for (const edge of graph.edges) {
    const from = nodeById.get(edge.from);
    const to = nodeById.get(edge.to);
    if (!from || !to || from.module === to.module) continue;
    const key = `${from.module}\u0000${to.module}`;
    const dependency = dependencyCounts.get(key);
    if (dependency) {
      dependency.links++;
    } else {
      dependencyCounts.set(key, { from: from.module, to: to.module, links: 1 });
    }
  }
  const moduleDependencies = [...dependencyCounts.values()].sort(
    (a, b) =>
      b.links - a.links ||
      a.from.localeCompare(b.from) ||
      a.to.localeCompare(b.to),
  );
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
  const modulePositions = settleModulePositions(
    modulesBySem,
    moduleRadius,
    moduleOffsets,
    semAnchors,
    moduleDependencies,
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
    const { x: mx, y: my } = modulePositions.get(node.module)!;
    const [gx, gy] = groupOffsets.get(node.group)!;
    const ax = mx + gx;
    const ay = my + gy;
    const radius =
      layout.initialNodeRadiusFactor *
      Math.sqrt(position + layout.initialNodeRadiusOffset);
    const angle = position * layout.initialNodeAngle;
    return {
      ...node,
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
    moduleDependencies,
    longestPath: graph.longestPath(),
  };
}
