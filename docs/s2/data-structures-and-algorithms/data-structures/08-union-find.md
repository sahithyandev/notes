---
title: Union Find
sidebar:
  order: 8
slug: data-structures-and-algorithms/data-structures/union-find
prev: true
next: false
---

Aka. Disjoint Set Union (DSU). Keeps track of a partition of a set into disjoint subsets.

Used in [Kruskal's algorithm](/data-structures-and-algorithms/algorithms/kruskals-algorithm/), connected components in a graph, cycle detection in undirected graphs, dynamic connectivity problems.

## Operations

### Find
Determines which subset a particular element belongs to. This can be used to check if two elements are in the same subset.

### Union
Joins two subsets into a single subset. This is used to merge groups.

## Implementation

Typically implemented using two techniques to optimize its operations:

### Path Compression
During the `Find` operation, the structure flattens the tree by making every node point directly to the root. This reduces the time complexity of future operations.

### Union by Rank
During the `Union` operation, the smaller tree is attached under the root of the larger tree. This keeps the tree shallow, improving efficiency.
