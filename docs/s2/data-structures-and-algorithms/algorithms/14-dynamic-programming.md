---
title: Dynamic Programming
sidebar:
  order: 14
slug: data-structures-and-algorithms/algorithms/dynamic-programming
prev: true
next: false
---

Dynamic programming is a method for solving complex problems by breaking them down into simpler subproblems. It is particularly useful for optimization problems where the solution can be constructed from solutions to overlapping subproblems.

## Main components

- Being able to model the problem as a recursive algorithm
- Different instances of your recurrence should be bounded by polynomial
- Order of evaluation of recurrence is important. Should be able to create a directed acyclic graph from the sub-problems.

## Elements

- Optimal structure   
  An optimal solution to the problem can be formed from optimal solution to the subproblems
- Overlapping subproblems   
  The space of subproblems must be small. The same subproblems are encountered more than once.
