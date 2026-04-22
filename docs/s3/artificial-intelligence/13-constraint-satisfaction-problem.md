---
title: Constraint Satisfaction Problem
sidebar:
  order: 13
slug: s3/artificial-intelligence/constraint-satisfaction-problem
prev: true
next: true
dateCreated: 2026-04-22T07:09:10.685Z
lastUpdatedOn: 2026-04-22T07:15:36.788Z
---

Aka. CSP.

Defined by a set of [variables](#variable), their [domains](#domain), and [constraints](#constraint). Solution to a CSP is a [complete](#complete-assignment) and [consistent](#consistent-assignment) assignment.

CSPs are useful because they:

- provides a uniform structure for diverse problems.
- enables general-purpose solvers without problem-specific logic.
- allows early elimination of inconsistent states, reducing the search space.

## Terminology

### Variable

Can either be discrete or continuous.

### Domain

Possible values for a given variable. Can either be finite or infinite.

### State

Defined by values assigned to all or some variables.

### Constraint

Defines allowable combinations of values for a subset of variables. Can either be:

- Unary: Single variable (e.g., SA ≠ green).
- Binary: Pairs of variables (e.g., SA ≠ WA).
- Global: Multiple variables involved together.

### Assignment

Gives values to some or all variables.

### Complete Assignment

Assigns all variables.

### Consistent Assignment

Aka. legal assignment. An assignment that satisfies all constraints.

## Local Search for CSP

Effective for large CSPs like N-Queens, often reaching solutions quickly.

Approach:

- Start with a random complete assignment.
- Choose a conflicted variable randomly.
- Reassign its value to minimize conflicts.

Min-Conflicts Heuristic:

- Select the value causing the fewest violations.
- Used in hill climbing or simulated annealing variants.
