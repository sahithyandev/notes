// The graph of notes, independent of any rendering. Nodes are notes, edges
// are either "chain" (a note points to the next one in its module or
// submodule) or "prereq" (a note's prerequisite points to the note). Built
// once at build time, serialised with `toJSON`, revived with `fromJSON`.
import { orderFromFilePath } from "./note-path";

const ALL_KINDS: EdgeKind[] = ["chain", "prereq"] as const;

export type EdgeKind = "chain" | "prereq";

export interface NoteInput {
  /** Slug, as in `entry.id`. */
  id: string;
  title: string;
  /** Repo-relative path, used to order notes inside a directory. */
  filePath?: string;
  prereqs?: string[];
}

export interface GraphNode {
  id: string;
  title: string;
  /** 1 to 8 for `sN` notes, 0 for anything outside a semester. */
  sem: number;
  /** `s1/mathematics`, or `general` outside a semester. */
  module: string;
  /** The note's own directory: a module, or one submodule of it. */
  group: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  kind: EdgeKind;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface PathOptions {
  /** Only follow these kinds of edges. Defaults to all. */
  kinds?: EdgeKind[];
}

export class NoteGraph {
  readonly nodes: GraphNode[];
  readonly edges: GraphEdge[];
  private readonly byId = new Map<string, GraphNode>();
  // Adjacency per set of edge kinds, built on first use
  private readonly adjacency = new Map<
    string,
    { out: Map<string, string[]>; in: Map<string, string[]> }
  >();

  constructor(data: GraphData) {
    this.nodes = data.nodes;
    this.edges = data.edges;
    for (const n of this.nodes) this.byId.set(n.id, n);
  }

  static fromJSON(data: GraphData): NoteGraph {
    return new NoteGraph(data);
  }

  toJSON(): GraphData {
    return { nodes: this.nodes, edges: this.edges };
  }

  static build(notes: NoteInput[]): NoteGraph {
    const nodes: GraphNode[] = [];
    const ids = new Set<string>();
    const edges: GraphEdge[] = [];
    const byDir = new Map<string, { id: string; file: string }[]>();

    for (const note of notes) {
      const parts = note.id.split("/");
      const sem = /^s\d$/.test(parts[0]) ? parseInt(parts[0][1]) : 0;
      const module = sem ? `${parts[0]}/${parts[1]}` : "general";
      const group = parts.slice(0, -1).join("/") || module;
      nodes.push({ id: note.id, title: note.title, sem, module, group });
      ids.add(note.id);

      const file = note.filePath ?? note.id;
      const dir = file.slice(0, file.lastIndexOf("/"));
      (byDir.get(dir) ?? byDir.set(dir, []).get(dir)!).push({
        id: note.id,
        file,
      });
    }

    // A prereq can only be validated once every id is known
    for (const note of notes) {
      for (const p of note.prereqs ?? []) {
        if (ids.has(p)) edges.push({ from: p, to: note.id, kind: "prereq" });
      }
    }

    // Within a module or submodule, each note points to the next one in order
    for (const group of byDir.values()) {
      group.sort(
        (a, b) =>
          orderFromFilePath(a.file) - orderFromFilePath(b.file) ||
          a.file.localeCompare(b.file),
      );
      for (let i = 0; i + 1 < group.length; i++) {
        edges.push({ from: group[i].id, to: group[i + 1].id, kind: "chain" });
      }
    }

    return new NoteGraph({ nodes, edges });
  }

  node(id: string): GraphNode | undefined {
    return this.byId.get(id);
  }

  /** Notes that `id` points to. */
  successors(id: string, kinds: EdgeKind[] = ALL_KINDS): string[] {
    return this.adj(kinds).out.get(id) ?? [];
  }

  /** Notes that point to `id`. */
  predecessors(id: string, kinds: EdgeKind[] = ALL_KINDS): string[] {
    return this.adj(kinds).in.get(id) ?? [];
  }

  /** Every note that can reach `id`, nearest first. */
  ancestors(id: string, opts: PathOptions = {}): string[] {
    return this.reach(id, this.adj(opts.kinds ?? ALL_KINDS).in);
  }

  /** Every note reachable from `id`, nearest first. */
  descendants(id: string, opts: PathOptions = {}): string[] {
    return this.reach(id, this.adj(opts.kinds ?? ALL_KINDS).out);
  }

  /** Fewest-edges directed path from one note to another, ends included. */
  shortestPath(
    from: string,
    to: string,
    opts: PathOptions = {},
  ): string[] | null {
    if (!this.byId.has(from) || !this.byId.has(to)) return null;
    const { out } = this.adj(opts.kinds ?? ALL_KINDS);
    const parent = new Map<string, string | null>([[from, null]]);
    const queue = [from];
    for (let head = 0; head < queue.length; head++) {
      const id = queue[head];
      if (id === to) break;
      for (const next of out.get(id) ?? []) {
        if (parent.has(next)) continue;
        parent.set(next, id);
        queue.push(next);
      }
    }
    return parent.has(to) ? this.unwind(parent, to) : null;
  }

  /** Prerequisites before dependents, or null if the edges contain a cycle. */
  topologicalOrder(opts: PathOptions = {}): string[] | null {
    const { out } = this.adj(opts.kinds ?? ALL_KINDS);
    const indegree = new Map(this.nodes.map((n) => [n.id, 0]));
    for (const targets of out.values()) {
      for (const t of targets) indegree.set(t, indegree.get(t)! + 1);
    }
    const order = this.nodes.map((n) => n.id).filter((id) => !indegree.get(id));
    for (let head = 0; head < order.length; head++) {
      for (const t of out.get(order[head]) ?? []) {
        const left = indegree.get(t)! - 1;
        indegree.set(t, left);
        if (!left) order.push(t);
      }
    }
    return order.length === this.nodes.length ? order : null;
  }

  /**
   * Longest directed path, counted in edges. Null if the edges contain a
   * cycle, since the longest path is then unbounded.
   */
  longestPath(opts: PathOptions = {}): string[] | null {
    const order = this.topologicalOrder(opts);
    if (!order) return null;
    const { out } = this.adj(opts.kinds ?? ALL_KINDS);
    const dist = new Map(order.map((id) => [id, 0]));
    const parent = new Map<string, string | null>(
      order.map((id) => [id, null]),
    );
    let best: string | null = order[0] ?? null;
    for (const id of order) {
      for (const t of out.get(id) ?? []) {
        if (dist.get(id)! + 1 > dist.get(t)!) {
          dist.set(t, dist.get(id)! + 1);
          parent.set(t, id);
        }
      }
      if (dist.get(id)! > dist.get(best!)!) best = id;
    }
    return best ? this.unwind(parent, best) : [];
  }

  /** Groups of notes joined by edges, ignoring direction. Biggest first. */
  components(opts: PathOptions = {}): string[][] {
    const { out } = this.adj(opts.kinds ?? ALL_KINDS);
    const root = new Map(this.nodes.map((n) => [n.id, n.id]));
    const find = (id: string): string => {
      while (root.get(id) !== id) {
        root.set(id, root.get(root.get(id)!)!);
        id = root.get(id)!;
      }
      return id;
    };
    for (const [from, targets] of out) {
      for (const t of targets) root.set(find(from), find(t));
    }
    const groups = new Map<string, string[]>();
    for (const n of this.nodes) {
      const r = find(n.id);
      (groups.get(r) ?? groups.set(r, []).get(r)!).push(n.id);
    }
    return [...groups.values()].sort((a, b) => b.length - a.length);
  }

  private adj(kinds: EdgeKind[]) {
    const key = [...kinds].sort().join(",");
    let a = this.adjacency.get(key);
    if (!a) {
      a = { out: new Map(), in: new Map() };
      const seen = new Set<string>();
      for (const e of this.edges) {
        if (!kinds.includes(e.kind)) continue;
        // A prereq that repeats a chain edge is still a single connection
        const pair = `${e.from}\n${e.to}`;
        if (seen.has(pair)) continue;
        seen.add(pair);
        (a.out.get(e.from) ?? a.out.set(e.from, []).get(e.from)!).push(e.to);
        (a.in.get(e.to) ?? a.in.set(e.to, []).get(e.to)!).push(e.from);
      }
      this.adjacency.set(key, a);
    }
    return a;
  }

  private reach(start: string, next: Map<string, string[]>): string[] {
    const seen = new Set([start]);
    const queue = [start];
    for (let head = 0; head < queue.length; head++) {
      for (const id of next.get(queue[head]) ?? []) {
        if (seen.has(id)) continue;
        seen.add(id);
        queue.push(id);
      }
    }
    return queue.slice(1);
  }

  private unwind(parent: Map<string, string | null>, end: string): string[] {
    const path = [end];
    for (let id = parent.get(end); id; id = parent.get(id)) path.push(id);
    return path.reverse();
  }
}
