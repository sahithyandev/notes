---
title: Errors of Interpolating Polynomials
sidebar:
  order: 9
slug: methods-of-mathematics/numerical-methods/errors-of-interpolating-polynomials
prev: true
next: true
---

### Theorem 

Suppose $x_0, x_1, \ldots, x_n$ are distinct numbers in the interval $[a, b]$ and $f \in C^{n+1}[a, b]$. Then, for each $x$ in $[a, b]$, a number $\xi(x)$ (generally unknown) between $x_0, x_1, \ldots, x_n$, and hence in $(a, b)$, exists with:

```math
f(x) = P_n(x) + \frac{f^{(n+1)}(\xi(x)) (x - x_0)(x - x_1) \cdots (x - x_n)}{(n + 1)!} = P_n(x) + R_n(x)
```

where $P_n(x)$ is the interpolating polynomial. $R_n(x)$ is the error term. The above equation can only be used for known and differentiable functions, which is usually not the case.

An alternative formula to find error is by applying a finite divided difference to approximate the $(n + 1)$th derivative. Thus, we have: $ $

```math
R_n = f[x, x_n, x_{n-1}, \ldots, x_0](x - x_0)(x - x_1) \cdots (x - x_n)
```

Since this contains the unknown $f(x)$, it cannot be solved for the error. However, using an additional data point $f(x_{n+1})$, the error can be estimated as follows.

```math
R_n \approx f[x_{n+1}, x_n, x_{n-1}, \ldots, x_0](x - x_0)(x - x_1) \cdots (x - x_n)
```
