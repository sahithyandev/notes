---
title: Graph
sidebar:
  order: 6
slug: data-structures-and-algorithms/data-structures/graph
prev: true
next: true
---

Consists of a set of nodes and a set of edges that connect
pairs of nodes.

Used in many different domains to model complex relationships and solve various computational problems. Such as social networks, transportation networks, and web page links.

### Node

A fundamental point or unit. Aka. vertex. Holds a value.

### Edge

Connects a pair of nodes. Aka. link. Optionally has an associated _weight_. Can
either be directed (one-way) or undirected (two-way).

#### Parallel edge

Aka. multi edge. A pair of edges that connect 2 nodes with the same source and destination.

#### Self edge

An edge that connects a node to itself.

### Adjacency

Two nodes are adjacent **iff** they are connected by an edge.

### Degree

Number of edges connected to a vertex. In case of directed graphs, in-degree and
out-degree are defined.

#### In-degree

Number of edges that point towards a vertex.

#### Out-degree

Number of edges that point away from a vertex.

### Path

A sequence of vertices where each adjacent pair is connected by an edge. Number of edges in a path is the length of the graph.

#### Simple path

A path that does not visit any vertex more than once.

#### Closed path

A path that starts and ends at the same vertex.

#### Cycle

A closed path without repeating any edges or vertices.

#### Path cost

The sum of the weights of the edges in a path.

### Reachability

A vertex $U$ is reachable from vertex $V$ **iff** there exists a path from $U$ to
$V$.

### Complete

A graph is complete **iff** every pair of distinct vertices is connected by a
unique edge.

```math
E = \binom{V}{2} = \frac{V(V-1)}{2}
```

### Subgraph

A subset of the vertices and edges of a graph.

### Connected component

A maximal set of vertices such that every pair is connected.

## Implementation

### Adjacency Matrix

A 2-dimensional array of size $V \times V$. The rows and columns represent the vertices of the
graph. The value at each cell indicates whether there is an edge between the
corresponding vertices. Better for dense graph. $ $

Slow to add or remove vertices, because matrix must be resized/copied.

### Adjacency List

A collection of linked lists or arrays where each element represents a vertex
and contains a list of its adjacent vertices. Better for sparse graph.

Slow to remove vertices and edges, because it needs to find all vertices or edges.

### Incidence Matrix

A 2-dimensional array of size $V \times E$. The rows represent the vertices and the columns represent the edges.
The value at each cell indicates whether the corresponding vertex is incident to the corresponding edge. $ $

Slow to add or remove vertices and edges, because matrix must be resized/copied.

### Comparison

|                 | Adjacency list | Adjacency matrix | Incidence matrix                      |
| --------------- | -------------- | ---------------- | ------------------------------------- |
| Store graph     | $O(V+E)$       | $O(V^2)$         | $O(V \cdot E)$                        |
| Add vertex      | $O(1)$         | $O(V^2)$         | $O(V \cdot E)$                        |
| Add edge        | $O(1)$         | $O(1)$           | $O(V \cdot E)$                        |
| Remove vertex   | $O(E)$         | $O(V^2)$         | $O(V \cdot E)$                        |
| Remove edge     | $O(V)$         | $O(1)$           | $O(V \cdot E)$                        |
| Check adjacency | $O(V)$         | $O(1)$           | $O(E)$                                |
| Best for        | Sparse graphs  | Dense graphs     | Dense graphs, edge-centric algorithms |

## Operations

- Searching
  - [Depth First Search](/data-structures-and-algorithms/algorithms/searching/#depth-first-search-dfs)
  - [Breadth First Search](/data-structures-and-algorithms/algorithms/searching/#breadth-first-search-bfs)
- Shortest Path between 2 vertices
  - [Dijkstra's Algorithm](/data-structures-and-algorithms/algorithms/dijkstras-algorithm/)
  - [Bellman-Ford Algorithm](/data-structures-and-algorithms/algorithms/bellman-ford-algorithm)

## Types

### Simple Graph

A graph with no self-loops or multiple edges.

- For directed graphs: $0 \le E \le  V (V - 1)$
- For undirected graphs: $0 \le E \le  V (V - 1) / 2$

### Connected Graph

When all vertices are reachable from all other vertices.

### Dense Graph

A graph is dense **iff** the number of edges is close to the maximum possible
number of edges. Or $E \approx V^2$. $ $

### Sparse Graph

A graph is sparse **iff** the number of edges is close to the minimum possible
number of edges. Or $E \ll V^2$. $ $

### Undirected Graph

Edges have no direction. The edges are not ordered.

### Directed Graph

Edges have a direction. The edges are ordered pairs of nodes.

#### Strongly Connected Graph

A connected directed graph.

```math
E \ge V - 1
```

#### Weakly Connected Graph

When a directed graph is not connected and its undirected version is connected.

### Unweighted Graph

All edges have no weights associated with them.

### Weighted Graph

All edges have weights associated with them.

### Cyclic Graph

A graph with atleast 1 cycle.

### Acyclic Graph

A graph with no cycles.

### Tree

A connected, acyclic graph where $E = V - 1$. $ $

### Forest

A collection of Trees.

### Bipartite Graph

When a graph's vertices can be divided into two disjoint sets such that every edge connects a vertex in one set to a vertex in the other set. No edge exists between vertices within the same set.

Does not contain odd-length cycles.
