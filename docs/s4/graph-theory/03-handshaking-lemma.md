---
title: Handshaking Lemma
sidebar:
  order: 3
slug: s4/graph-theory/handshaking-lemma
prev: true
next: true
dateCreated: 2026-04-23T17:39:39.622Z
lastUpdatedOn: 2026-04-23T17:39:39.622Z
---

Describes the relationship between vertex degrees and edges in a graph. Each edge contributes 1 to the degree of each of its endpoints, leading to a fundamental counting principle.

For all the definitions below, consider a graph $G$ with $n$ vertices and $m$ edges.

## For Simple Graphs

Sum of all vertex degrees equals twice the number of edges.

```math
\sum_{i=1}^{n} \deg(v_i) = 2m
```

Applies for connected components as well.

### Corollary

The number of vertices with odd degree is always even.

## For Digraphs

Sum of in-degrees equals sum of out-degrees, both equal to the number of edges.

```math
\sum_{i=1}^{n} \text{indeg}(v_i) = \sum_{i=1}^{n} \text{outdeg}(v_i) = m
```
