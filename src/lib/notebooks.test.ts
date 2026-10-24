import { test, expect } from "bun:test";
import { buildNotebookTree, formatBytes } from "./notebooks";

const nb = (path: string) => ({
  id: path.split("/").pop()!.replace(/\.nb$/, ""),
  data: { url: `/notebooks/${path.split("/").pop()}`, bytes: 2048, path },
});

test("groups notebooks by semester and module, skipping empty folders", () => {
  const root = buildNotebookTree(
    [
      nb("s5/numerical-methods/notebooks/eulers-method.nb"),
      nb("s5/calculus/1-vectors/notebooks/arc.nb"),
    ] as never,
    [],
  );

  expect(root.notebooks).toEqual([]);
  expect(root.children.map((c) => c.label)).toEqual(["Semester 5"]);
  const sem = root.children[0];
  expect(sem.notebooks).toEqual([]);
  expect(sem.children.map((c) => c.label)).toEqual([
    "Calculus",
    "Numerical Methods",
  ]);
  expect(sem.children[1].notebooks.map((n) => n.id)).toEqual(["eulers-method"]);
});

test("nests submodules under their module", () => {
  const root = buildNotebookTree(
    [nb("s2/math/2-numerical/1-sub/notebooks/x.nb")] as never,
    [],
  );
  const mod = root.children[0].children[0];
  expect(mod.label).toBe("Math");
  const sub = mod.children[0];
  expect(sub.label).toBe("Numerical");
  expect(sub.notebooks).toEqual([]);
  expect(sub.children[0].label).toBe("Sub");
  expect(sub.children[0].notebooks[0].id).toBe("x");
});

test("links each notebook to the notes that reference it", () => {
  const root = buildNotebookTree(
    [nb("s5/numerical-methods/notebooks/eulers-method.nb")] as never,
    [
      {
        id: "s5/numerical-methods/euler",
        data: {
          title: "Euler's Method",
          notebooks: [{ id: "eulers-method", collection: "notebooks" }],
        },
      },
    ] as never,
  );
  const item = root.children[0].children[0].notebooks[0];
  expect(item.notes).toEqual([
    { title: "Euler's Method", href: "/s5/numerical-methods/euler" },
  ]);
});

test("formats sizes in whole kilobytes, at least 1 KB", () => {
  expect(formatBytes(2048)).toBe("2 KB");
  expect(formatBytes(10)).toBe("1 KB");
});
