---
title: Spanning Tree
sidebar:
  order: 7
slug: data-structures-and-algorithms/data-structures/spanning-tree
prev: true
next: true
---

A connected, acyclic subgraph that includes all the vertices of the original graph. Undefined for disconnected graphs.

### Minimum Spanning Tree

A spanning tree with the smallest total edge weight. Defined for weighted graphs. May not be unique.

- If all weights are different, the MST is unique.
- If 2 or more edges have the same weight, there are more than 1 MSTs
- If all edges have the same weight, there are $n^{n-2}$ MSTs

### Steiner spanning tree

A spanning tree with a subset of vertices. Terminals are the nodes that are required to be included in the tree. Steiner points are the nodes that are not terminals but can be added to minimize the total edge weight.

### Minimum Steiner tree

A Steiner spanning tree that has the minimum weight. Finding a minimum Steiner tree is NP-hard, making it computationally more difficult than finding a minimum spanning tree. Useful in network design problems where new junction points can be added to reduce the overall cost of connecting required locations.

## Definitions

### Cut
A partition of the vertices of a graph into 2 disjoint subsets.

### Crossing Cut
An edge that has one endpoint in each subset of a cut is said to cross the cut. 

### Respecting Cut
Given a subset $A$ of edges, a cut respects $A$ **iff** no edge in $A$ crosses the cut.

### Light Edge
For a given cut, the edge with the minimum weight among all edges crossing the cut. Prime candidates in MST algorithms.

### MST property

For any cut in a graph, the light edge crossing the cut is always part of a minimum spanning tree.

Used in [Kruskal's algorithm](/data-structures-and-algorithms/algorithms/kruskals-algorithm/) and [Prim's algorithm](/data-structures-and-algorithms/algorithms/prims-algorithm/).

### Safe Edge
An edge that can be safely included in the growing MST subset without violating the MST property.

#### Finding a Safe Edge

- Choose a cut that respects the current set of edges A
- Select the light edge crossing this cut
- This light edge is guaranteed to be safe for inclusion in the MST

## Algorithms to Find MST

The general idea is to:

- Start with a subset of edges $A$
- Add 1 safe edge to $A$ at each iteration
- Keep adding until an MST is found

Commonly used algorithms to find MST are:
- [Kruskal's algorithm](/data-structures-and-algorithms/algorithms/kruskals-algorithm)
- [Prim's algorithm](/data-structures-and-algorithms/algorithms/prims-algorithm)

## Uniqueness

A graph has a unique MST **iff** all edge weights are distinct.

In an unweighted graph, the number of distinct spanning trees in a complete unweighted graph is $V^{V-2}$. $ $
