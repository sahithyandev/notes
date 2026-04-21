---
title: Bisection Method
sidebar:
  order: 2
slug: methods-of-mathematics/numerical-methods/bisection-method
prev: true
next: true
---

Suppose $f$ is a continuous function on the interval $[a, b]$ such that
$f(a) \cdot f(b) < 0$.

A root exists on the interval chosen above by
[Intermediate Value Theorem](https://s1.sahithyan.dev/mathematics/real-analysis/continuity-theorems/#intermediate-value-theorem).
The bisection method is an iterative algorithm that approximates the root $c$ of
$f$.

Let the midpoint $m = \frac{1}{2}(a + b)$. $ $

- **If** $f(m) = 0$, **then** $m$ is the root
- **If** $f(a) \cdot f(m) < 0$, **then** the root lies in $[a, m]$, so the
  interval is updated to $[a, m]$
- **If** $f(m) \cdot f(b) < 0$, **then** the root lies in $[m, b]$, so the
  interval is updated to $[m, b]$.

### Code example

```py
def bisection(f, a, b, tolerance=1e-6):
    if f(a) * f(b) >= 0:
        raise ValueError("f(a) and f(b) must have opposite signs")
    while (b - a) / 2 > tolerance:
        m = (a + b) / 2
        if f(m) == 0:
            return m
        elif f(a) * f(m) < 0:
            b = m
        else:
            a = m
    return (a + b) / 2
```

## Bisection theorem

Suppose $f$ is continuous in $[a, b]$ and $f(a) \cdot f(b) < 0$. The bisection
generates a sequence $p_n$ such that:

```math
|p_n - c| \leq \frac{b - a}{2^n}
```

Here $c$ is a root of $f$.

## Properties

- Always convergent
- Linear convergence rate
- Order of convergence is 1.
- Error can be controlled
- Error is bounded
- Error decreases with each iteration
- Simpler calculations

## Limitations

- Slow convergence
- Cannot approximate solutions for even functions and more
- Cannot determine complex roots
- Cannot be applied if there are discontinuities or its sign doesn't change in the interval
