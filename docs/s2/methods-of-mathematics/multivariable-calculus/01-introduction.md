---
title: Introduction to Multivariable Calculus
sidebar:
  label: Introduction
  order: 1
slug: methods-of-mathematics/multivariable-calculus/introduction
prev: false
next: true
---

### Real valued multivariable function

A function with more than 1 inputs or outputs.

$\mathbb{R}^n$ denotes a n-dimensional space with each axis denoted by real
numbers. $ $

A function $f: \mathbb{R}^{n} \rightarrow \mathbb{R}$ is a map between a ordered
n-tuple to real numbers. The domain can also be $D \subset \mathbb{R}^{n}$. The
same can be applied to the output of the function.

### Vector-valued functions

Functions with more than 1 outputs. Referred to as vector-valued functions, even
though they are also multivariable functions.

## Definitions

Suppose $P \subset \mathbb{R}^2$ and $Q \equiv (x_0,y_0)\in\mathbb{R}^2$.

### epsilon-disk

An $\epsilon$-disk around $Q$ is the set of all points $(x,y)\in\mathbb{R}^2$
where the distance between the points is less than $\epsilon$.

### Interior point

$Q$ is an interior point of $P$ **iff** there exists some $\epsilon$-disk around
$Q$ that is contained in $P$.

### Boundary point

$Q$ is an boundary point of $P$ **iff** all $\epsilon$-disks around $Q$ contains
points from $P$ and not from $P$.

### Isolated point

$Q$ is an isolated point of $P$ **iff** there exists some $\epsilon$-disk around
$Q$ that doesn't contains no other points of $P$. Subset of boundary points.

### Open subset

$P$ is an open subset of $\mathbb{R}^2$ **iff** all the points of $P$ are
interior points of $P$.

### Closed subset

$P$ is an closed subset of $\mathbb{R}^2$ **iff** $P$ contains all of its
boundary points.

:::note

A subset can neither be open nor closed. A subset in $\mathbb{R}^2$ is open
**iff** its complement is closed. $ $

:::

### Closure

The set of boundary points of $P$ and the region $P$. Denoted by $\overline{P}$.

### Bounded subset

$P$ is a bounded subset of $\mathbb{R}^2$ **iff** $P$ is contained in some
$\epsilon$-disk around some point.

### Circular neighbourhood

The below set is called a $\delta$-neighbourhood of the point $(a,b) \in D$ and
$\delta > 0$.

```math
\Big\{(x,y)\,\text{ s.t. }\,\sqrt{(x-a)^2 + (y-b)^2} \lt \delta\Big\}
```

### Square neighbourhood

The below set is called a square-neighbourhood of the point $(a,b) \in D$ and
$\delta > 0$.

```math
\Big\{(x,y)\,\text{ s.t. }\,\lvert x-a \rvert \lt \delta \land |y-b| \lt \delta\Big\}
```
