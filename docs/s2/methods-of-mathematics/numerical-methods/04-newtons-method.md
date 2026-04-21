---
title: Newton's Method
sidebar:
  order: 4
slug: methods-of-mathematics/numerical-methods/newtons-method
prev: true
next: true
---

A special case of
[fixed point method](/methods-of-mathematics/numerical-methods/fixed-point-method/).

Given a root finding problem $f(x)=0$, $g(x)$ is defined as:

```math
g(x) = x - \frac{f(x)}{f'(x)}
```

Start with an arbitrary point $p_0$ and generate the sequence: $p_n = g(p_0)$.
The sequence $p_n$ approaches the root of $f$ quickly.

Order of convergence is 2 for simple roots.
