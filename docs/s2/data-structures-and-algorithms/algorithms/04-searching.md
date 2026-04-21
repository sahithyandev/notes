---
title: Searching
sidebar:
  order: 4
slug: data-structures-and-algorithms/algorithms/searching
prev: true
next: true
---

Used to retrieve information stored within some data structure. Below is an explanation of common searching algorithms along with their time and space complexities.

## Common searching algorithms

### Linear Search

The simplest searching algorithm. It checks each element of the list sequentially until the desired element is found or the list ends.

### Binary Search

An efficient algorithm for finding an item from a sorted list of items. Works by repeatedly dividing the search interval in half.

[Depth-first search](/data-structures-and-algorithms/algorithms/depth-first-search) and [breadth-first search](/data-structures-and-algorithms/algorithms/breadth-first-search) are explained in their respective sections.

## Comparison

| Algorithm                  | Best Time  | Worst Time  | Average Time | Memory |
| -------------------------- | ---------- | ----------- | ------------ | ------ |
| Linear Search              | $O(1)$     | $O(n)$      | $O(n)$       | $O(1)$ |
| Binary Search              | $O(1)$     | $O(\log n)$ | $O(\log n)$  | $O(1)$ |
| Depth-First Search (DFS)   | $O(V + E)$ | $O(V + E)$  | $O(V + E)$   | $O(V)$ |
| Breadth-First Search (BFS) | $O(V + E)$ | $O(V + E)$  | $O(V + E)$   | $O(V)$ |
