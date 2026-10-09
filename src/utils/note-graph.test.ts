import { describe, expect, test } from "bun:test";
import { NoteGraph, type NoteInput } from "./note-graph";

const note = (id: string, file: string, prereqs: string[] = []): NoteInput => ({
  id,
  title: id,
  filePath: `docs/${file}`,
  prereqs,
});

// s1/a: a1 -> a2 -> a3, s1/b: b1 -> b2, with b1 requiring a2 and a3 requiring b2
const notes = [
  note("s1/a/a2", "s1/a/02-a2.md"),
  note("s1/a/a1", "s1/a/01-a1.md"),
  note("s1/a/a3", "s1/a/03-a3.md", ["s1/b/b2"]),
  note("s1/b/b1", "s1/b/01-b1.md", ["s1/a/a2"]),
  note("s1/b/b2", "s1/b/02-b2.md", ["s1/missing/x"]),
  note("loose", "loose.md"),
];

describe("NoteGraph.build", () => {
  const g = NoteGraph.build(notes);
  const pairs = (kind: string) =>
    g.edges
      .filter((e) => e.kind === kind)
      .map((e) => `${e.from}>${e.to}`)
      .sort();

  test("chains notes of a directory by filename order", () => {
    expect(pairs("chain")).toEqual([
      "s1/a/a1>s1/a/a2",
      "s1/a/a2>s1/a/a3",
      "s1/b/b1>s1/b/b2",
    ]);
  });

  test("points each prereq at the note that lists it and drops unknown ones", () => {
    expect(pairs("prereq")).toEqual(["s1/a/a2>s1/b/b1", "s1/b/b2>s1/a/a3"]);
  });

  test("derives semester, module and group from the slug", () => {
    expect(g.node("s1/a/a1")).toMatchObject({
      sem: 1,
      module: "s1/a",
      group: "s1/a",
    });
    expect(g.node("loose")).toMatchObject({ sem: 0, module: "general" });
  });

  test("survives a JSON round trip", () => {
    const copy = NoteGraph.fromJSON(JSON.parse(JSON.stringify(g)));
    expect(copy.edges).toEqual(g.edges);
    expect(copy.longestPath()).toEqual(g.longestPath());
  });
});

describe("NoteGraph algorithms", () => {
  const g = NoteGraph.build(notes);

  test("successors and predecessors can be limited to one edge kind", () => {
    expect(g.successors("s1/a/a2").sort()).toEqual(["s1/a/a3", "s1/b/b1"]);
    expect(g.successors("s1/a/a2", ["chain"])).toEqual(["s1/a/a3"]);
    expect(g.predecessors("s1/a/a3", ["prereq"])).toEqual(["s1/b/b2"]);
  });

  test("longest path crosses modules along prereqs", () => {
    expect(g.longestPath()).toEqual([
      "s1/a/a1",
      "s1/a/a2",
      "s1/b/b1",
      "s1/b/b2",
      "s1/a/a3",
    ]);
    expect(g.longestPath({ kinds: ["chain"] })).toHaveLength(3);
  });

  test("topological order puts prerequisites first", () => {
    const order = g.topologicalOrder()!;
    for (const e of g.edges) {
      expect(order.indexOf(e.from)).toBeLessThan(order.indexOf(e.to));
    }
  });

  test("a cycle has no topological order or longest path", () => {
    const cyclic = NoteGraph.build([
      note("s1/a/x", "s1/a/01-x.md", ["s1/a/y"]),
      note("s1/a/y", "s1/a/02-y.md", ["s1/a/x"]),
    ]);
    expect(cyclic.topologicalOrder()).toBeNull();
    expect(cyclic.longestPath()).toBeNull();
  });

  test("shortest path takes the fewest edges", () => {
    expect(g.shortestPath("s1/a/a1", "s1/a/a3")).toEqual([
      "s1/a/a1",
      "s1/a/a2",
      "s1/a/a3",
    ]);
    expect(g.shortestPath("s1/a/a3", "s1/a/a1")).toBeNull();
    expect(g.shortestPath("s1/a/a1", "nope")).toBeNull();
  });

  test("ancestors and descendants are listed nearest first", () => {
    expect(g.ancestors("s1/b/b2")[0]).toBe("s1/b/b1");
    expect(new Set(g.ancestors("s1/a/a3"))).toEqual(
      new Set(["s1/a/a1", "s1/a/a2", "s1/b/b1", "s1/b/b2"]),
    );
    expect(g.descendants("s1/a/a3")).toEqual([]);
  });

  test("components ignore direction and put the biggest first", () => {
    const parts = g.components();
    expect(parts[0]).toHaveLength(5);
    expect(parts[1]).toEqual(["loose"]);
  });
});
