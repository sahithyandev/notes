---
title: Travelling Problems
sidebar:
  order: 12
slug: s4/graph-theory/travelling-problems
prev: true
next: true
dateCreated: 2026-04-23T17:39:39.623Z
lastUpdatedOn: 2026-04-23T17:39:39.623Z
---

Modeled using graphs to formalize routes and distances.

- Vertices: locations or cities
- Edges: paths between locations. may be directed.
- Weights: cost, distance, or time

## Travelling Salesman Problem

The problem of finding the shortest possible closed walk that visits every vertex at least once and returns to the starting point. Edges may repeat. Multiple valid optimal solutions may exist.

Defined on a weighted graph. The graph is typically assumed connected and undirected.

Widely used in:

- route planning (logistics, delivery systems)
- circuit design (minimizing wiring length)
- scheduling problems
- network optimization

### Brute force algorithm

A method that solves a problem by trying all possible solutions and selecting the optimal one. May start at any vertex. Simple. Guaranteed to be optimal. Computationally very expense. Not suitable for real world applications.

The algorithm systematically generates all possible closed walks and computes their total cost.

Steps:

- choose a starting city (e.g., A)
- list all permutations of other cities
- for each permutation:
  - construct route: A → permutation → A
  - calculate total cost
- compare all route costs
- return the minimum cost route

Time complexity is $O(n!)$. Space complexity is $O(n)$.

### Nearest neighbour algorithm

A greedy method that builds a route by repeatedly visiting the closest unvisited vertex. Sensitive to starting vertex. Fast. Simple. Not necessarily optimal.

Steps:

- select a starting vertex
- mark it as visited
- repeat:
  - find the nearest unvisited vertex
  - move to that vertex
  - mark it as visited
- after visiting all vertices, return to the start

Time complexity is $O(n^2)$. Space complexity is $O(n)$.

### Bellman-Held-Karp algorithm

A dynamic programming method. Solves TSP by breaking it into smaller subproblems and combining their optimal solutions. Guaranteed to be optimal. More optimal than brute force. Still exponential in nature. High memory usage. Impractical for very large $n$.

In this algorithm:

- $D_{AB}$ denotes the distance between $A$ and $B$.
- $C_{AB(C)} = D_{AC} + D_{CB}$  
  Denotes the cost to go from $A$ to $B$ via $C$.
- $C_{AB(CD)} = \min{ \set{ C_{AC(D)} + D_{CB}, C_{AD(C)} + D_{DB} } }$  
  Denotes the cost to go from $A$ to $B$ via $C$ and $D$ (either $ADCB$ or $ACDB$).

The steps:

- Calculate the cost of visiting every possible combination of 2 nodes from the starting node
- Extend it to one more node
- Use the above cost equation to find the minimum cost and minimum cost route
- Do this until all the vertices are included

Used for complete graphs. If not complete, the graph is completed by adding missing edges.

Time complexity is $O(n^2 \cdot 2^n)$. Much better than $O(n!)$. Space complexity is $O(n\cdot 2^n)$.

## Chinese Postman Problem

Aka. Route Inspection Problem. The problem of finding the shortest closed path that traverses every edge of a graph at least once. Defined on undirected connected graph.

Used in:
- postal delivery routes
- garbage collection
- street cleaning
- inspection and maintenance routes

The goal is to find/produce a minimal Eulerian circuit. Duplicate edges are added to the graph to produce a minimal Eulerian circuit.

Steps:
- Check if graph is connected
- find all vertices with odd degree (must be even numbered by [the handshaking lemma](/graph-theory/handshaking-lemma#corollary))
- if none: Eulerian circuit exists and find it.
- else:
  - compute shortest paths between them
  - find minimum pairing
  - duplicate corresponding edges to construct Eulerian graph

Time complexity is $O(n^k)$ (efficient compared to TSP). Space complexity is.

### Types of CPP

- Undirected CPP   
  On undirected graph. Solved using degree parity and matching.
- Directed CPP   
- On directed graph. Requires balancing in and out degrees.
- Mixed CPP   
  Contains both directed and undirected graphs.
