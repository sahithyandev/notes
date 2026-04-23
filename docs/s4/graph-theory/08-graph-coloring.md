---
title: Graph Coloring
sidebar:
  order: 8
slug: s4/graph-theory/graph-coloring
prev: true
next: true
dateCreated: 2026-04-23T17:39:39.623Z
lastUpdatedOn: 2026-04-23T17:39:39.623Z
---

The assignment of colors to elements of a graph where adjacent elements must not share the same color.

## k-Colorable Graph

A graph is $k$-colorable **iff** it can be colored using $k$ colors.

```math
G\text{ is }k\text{-Colorable} \implies G\text{ is }{j}\text{-Colorable}\quad \forall j \ge k
```

## Four-Color Theorem

Any planar graph can be colored with at most 4 colors. Other direction is not true.

## Algorithms

Greedy algorithm give a valid coloring by making local-optimal choices at each step. But not globally optimal.

Heuristic based algorithms improve quality of the solution (low number of colors). Optimal solutions become harder for large graphs. Exact solutions are computationally expensive.
