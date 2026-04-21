---
title: Interpolation
sidebar:
  order: 6
slug: methods-of-mathematics/numerical-methods/interpolation
prev: true
next: true
---

A type of estimation. A method of constructing new data points
based on the range of a discrete set of known data points. It is the process of deriving a simple function from a set of discrete data points so that the function passes through all the given data points and can be used to estimate data points in-between the given ones.

## Weierstrass Approximation Theorem

Suppose $f$ is continuous on $[a,b]$. Then $\forall \epsilon \gt 0,\;\exists P(x)$ such that $\forall x \in [a,b]$:

```math
\left\lvert f(x) - P(x) \right\rvert < \epsilon
```

:::note

For $n + 1$ data points, there is one and only one polynomial of order $n$ that passes through
all the points.

:::
