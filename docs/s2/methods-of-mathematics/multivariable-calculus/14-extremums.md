---
title: Extremums
sidebar:
  order: 14
slug: methods-of-mathematics/multivariable-calculus/extremums
prev: true
next: true
---

Revise [Extremums](https://s1.sahithyan.dev/mathematics/real-analysis/extremums/) from S1.

## Theorems

### Local extremum

**Suppose** $f$ has a local maximum or minimum at $(a,b)$ and the first order partial derivatives of $f$
exist there. **Then** $f_x (a, b) = 0$ and $f_y (a, b) = 0$.

:::note[Proof Hint]

Fix 1 variable and apply the first derivative test.

:::

### Extreme Value Theorem

**If** $f$ is continuous on a closed, bounded set $D \subseteq \mathbb{R}^2$ **then** $f$ has an absolute maximum and absolute minimum value in $D$.

### Implicit Function Theorem

**Suppose** $f(x, y) ∈ C^1$, $f_y(a, b) \neq 0$ and $f(a, b) = c$. **Then** there exists
a unique function $y = g(x) ∈ C^1$ defined on a neighbourhood of $(a, b)$ with:

```math
g'(x) = − \frac{f_x(x,g(x))}
{f_y(x,g(x))}\;\; \text{s.t.}\;\; f(x, g(x)) = c
```

## Second Derivatives Test

Suppose the second partial derivatives of $f$ are continuous on a disk
with center $(a, b)$, and suppose that $f_x (a, b) = 0$ and $f_y (a, b) = 0$. Let:

```math
D =
\begin{bmatrix}
f_{xx} & f_{xy} \\
f_{yx} & f_{yy}
\end{bmatrix}
=
D(a, b) = f_{xx}(a, b)f_{yy} (a, b) − f_{xy}^2(a, b)
```

- **If** $D=0$, **then** no information.
- **If** $D > 0 \land f_{xx} (a, b) > 0$, **then** $f(a, b)$ is a local minimum.
- **If** $D > 0 \land f_{xx} (a, b) < 0$, **then** $f(a, b)$ is a local maximum.
- **If** $D < 0$ **then** $f(a, b)$ is not a local maximum or minimum.

### Saddle point

A [critical point](/methods-of-mathematics/multivariable-calculus/directional-derivative/#critical-point) in which it is not a local maximum or local minimum.

## Closed interval method

A method for finding absolute minimum and absolute maximum values of $f$ which is continuous on a closed, bounded set $D \subseteq \mathbb{R}^2$.

1. Find the values of $f$ at the critical points of $f$ in the interior of $D$.
2. Find the extreme values of $f$ on the boundary of $D$.
3. Maximum and minimum values from step 1 and 2 are the absolute maximum and absolute minimum.
