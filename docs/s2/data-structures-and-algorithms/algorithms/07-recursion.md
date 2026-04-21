---
title: Recursion
sidebar:
  order: 7
slug: data-structures-and-algorithms/algorithms/recursion
prev: true
next: true
---

### Recursive

A recursive algorithm or function is the one that calls itself to solve a smaller version of its task. Terminating or base conditions are required.

### Divide & Conquer

- Divide: Split a problem into smaller sub-problems
- Conquer: Solve a subset of smaller sub-problems recursively
- Combine: Combine the solutions to solve the initial problem

Examples:

- [Binary search](/data-structures-and-algorithms/algorithms/searching/#binary-search)
- [Merge sort](/data-structures-and-algorithms/algorithms/sorting/#merge-sort)
- [Quick sort](/data-structures-and-algorithms/algorithms/sorting/#quicksort)
- [Depth-first traversals](/data-structures-and-algorithms/algorithms/searching/#depth-first-search)

## Analysis

### Recurrence relation

A mathematical equation that defines the overall cost of solving a problem in terms of the cost of solving its smaller sub-problems. It provides a way to express the time complexity of recursive algorithms.

3 common methods are used to solve a recurrence relation.

### Substitution method

The form of the solution is guessed and verified by induction. Then the
constants are solved for.

### Iteration method

Aka. recursion-tree method. The recurrence is expanded step-by-step to identify patterns and dervice a solution. Good for generating guesses for substituion method
but can be unreliable.

### Master theorem

#### For decreasing functions

Applies to below form:

```math
T(n) = a\,T\left( n - b \right) + O(n^k)
```

Where $a, b \gt 0$ and $k \ge 0$.

Here are the cases:
- **If** $a \lt 1$ **then** $T(n) = O(n^k)$
- **If** $a=1$ **then** $T(n) = O(n^{k+1})$
- **If** $a \gt 1$ **then** $T(n) = O(n^{k} a^{n/b})$

#### For dividing functions

Applies to recurrences of the below form:

```math
T(n) = a\,T\Big( \frac{n}{b} \Big) + O(n^k \log^p n)
```

Where $a \ge 1$, $b \gt 1$ and $k \ge 0$.

Here are the cases:
- **If** $k < \log_b{a}$ **then** $T(n) = O(n^{\log_b a})$.
- **If** $k = \log_b{a}$ and $p<-1$ **then** $T(n) = O(n^k)$.
- **If** $k = \log_b{a}$ and $p=-1$ **then** $T(n) = O(n^k \log \log n)$.
- **If** $k = \log_b{a}$ and $p>-1$ **then** $T(n) = O(n^k \log^{p+1} n)$.
- **If** $k > \log_b{a}$ and $p\ge 0$ **then** $T(n) = O(n^k \log^p n)$.
- **If** $k > \log_b{a}$ and $p\lt 0$ **then** $T(n) = O(n^k)$.
