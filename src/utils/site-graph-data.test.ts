import { describe, expect, test } from "bun:test";
import { NoteGraph, type NoteInput } from "./note-graph";
import { buildSiteGraphData } from "./site-graph-data";

const notes: NoteInput[] = [
  {
    id: "s1/math/first",
    title: "First",
    filePath: "docs/s1/math/01-first.mdx",
  },
  {
    id: "s1/math/second",
    title: "Second",
    filePath: "docs/s1/math/02-second.mdx",
    prereqs: ["s1/math/first"],
  },
  {
    id: "s2/physics/third",
    title: "Third",
    filePath: "docs/s2/physics/01-third.mdx",
    prereqs: ["s1/math/second"],
  },
];

describe("buildSiteGraphData", () => {
  const data = buildSiteGraphData(NoteGraph.build(notes));

  test("serializes the calculated layout and graph properties", () => {
    expect(data.semList).toEqual([1, 2]);
    expect(data.longestPath).toEqual([
      "s1/math/first",
      "s1/math/second",
      "s2/physics/third",
    ]);
    expect(data.nodes[0]).toMatchObject({
      ax: expect.any(Number),
      ay: expect.any(Number),
      x: expect.any(Number),
      y: expect.any(Number),
      r: 8,
      incoming: [],
      outgoing: ["s1/math/second", "s1/math/second"],
    });
  });

  test("groups nodes into labelled blobs without object references", () => {
    expect(data.blobs).toEqual([
      {
        group: "s1/math",
        sem: 1,
        label: "Math",
        members: ["s1/math/first", "s1/math/second"],
      },
      {
        group: "s2/physics",
        sem: 2,
        label: "Physics",
        members: ["s2/physics/third"],
      },
    ]);
    expect(() => JSON.stringify(data)).not.toThrow();
  });
});
