---
title: Fixed Point Method
sidebar:
  order: 3
slug: methods-of-mathematics/numerical-methods/fixed-point-method
prev: true
next: true
---

The number $p$ is a fixed point of the function $f$ **iff** $f(p) = p$.

## Existence and uniqueness

**If** $g \in C[a,b]$ and $g(x) \in [a,b]\;\forall x \in [a,b]$, **then** $g$ has
at least one fixed point in $[a,b]$.

**If** in addition, $g'(x)$ exists on $(a,b)$ and
$\exists k\ \in (0,1)$ such that:

```math
\Big\rvert g'(x)\Big\rvert \leq k \;\; \forall x \in (a,b)
```

**Then** $g$ has a unique fixed point in $(a,b)$.

:::note

If $g$ has a fixed point at $p$, $f(x) = x - g(x)$ has a zero at $p$.

If $g$ has a zero at $p$, $f(x)=x-g(x)$ has a fixed point at $p$. 

Root finding ($f(p) = 0$) and fixed point problems ($f(x) = x - g(x)$) are
equivalent classes if both functions have a linear relationship.

When converting a root finding to a fixed point problem $g(x)=x$, $g'(x)$

:::

## Iteration algorithm

Start with $p_0$ (arbitrary point). Iterate using $p_{n+1} = g(p_n)$ until
convergence. Convergence is guaranteed **if** the fixed point exists and is
unique.

### Implementation

```py
def fixed_point(g, p0, tolerance=1e-6, max_iteration_count=100):
    p = p0
    for _ in range(max_iteration_count):
        p_new = g(p)
        if abs(p_new - p) < tolerance:
            return p_new
        p = p_new
    raise ValueError("Fixed point not found")
```

## Fixed point theorem

**If**:

- $g \in C[a,b]$
- $\forall x \in [a,b],\; g(x) \in [a,b]$
- $g'$ exists on $(a,b)$
- $\exists k \in (0,1)$ and
  $\big\lvert g'(x) \big\rvert \le k\; \forall x \in (a,b)$

**Then** both equations mentioned below hold:

```math
\Big\lvert p_n - p \Big\rvert \le k^n \max\Big\{p_0 - a, b - p_0\Big\}
```

```math
\lvert p_n - p \rvert \le \frac{k^n}{1-k} \lvert p_1 - p_0 \rvert
```
