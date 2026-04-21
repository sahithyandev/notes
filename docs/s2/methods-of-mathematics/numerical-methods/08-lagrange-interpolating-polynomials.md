---
title: Lagrange Interpolating Polynomials
sidebar:
  order: 8
slug: methods-of-mathematics/numerical-methods/lagrange-interpolating-polynomials
prev: true
next: true
---

A rearranged version of Newton's Divided Difference Interpolating Polynomial.

```math
L_{n,k}(x) = \prod_{i=0,i\neq k}^{n} \frac{x - x_i}{x_k - x_i}
```

$n$-th Lagrange interpolating polynomial is: $ $

```math
P_n(x)=
\sum_{k=0}^n
L_{n,k}(x)f(x_k)
```
