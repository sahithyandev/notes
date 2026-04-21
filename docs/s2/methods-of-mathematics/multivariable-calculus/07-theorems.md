---
title: Theorems
sidebar:
  order: 7
slug: methods-of-mathematics/multivariable-calculus/theorems
prev: true
next: true
---

## Mean Value Theorem

Let

- $\delta > 0$
- $D = \big\{ (x,y) \in \mathbb{R}^2 : (x-a)^2 + (y-b)^2 \lt \delta \big\}$
- $f : D \rightarrow \mathbb{R}$
- $(a,b) \in D$
- $f_x$ and $f_y$ exists

**Then** $\exists \theta, \alpha \in (0,1)$ such that: $ $

```math
\Delta f = f(P_x, P_y) - f(a,b) = \Delta{x} f_x (a+\theta \Delta{x}, b)
+ \Delta{y} f_y (a+\Delta{x}, b+\alpha \Delta{y})
```

:::note[Proof Hint]

- Define $\Delta f$ in terms of $\Delta x$, $\Delta y$, $f(a+\Delta x, b)$,
  $f(a+\Delta x, b+\Delta y)$
- Use
  [single variable MVT](https://s1.sahithyan.dev/mathematics/real-analysis/other-theorems/#mean-value-theorem)
  for the terms

:::

## Schwarz's theorem
Aka. Clairaut's theorem on equality of mixed partials.

Let $D \subset \mathbb{R}^2$ be open. Let $f: D \rightarrow \mathbb{R}$. **If**
$f_{xy}$ and $f_{yx}$ are continous on $D$ **then** $f_{xy}=f_{yx}$.

:::note[Proof Hint]

- Take a square neighbourhood around $(a,b)$ with side length
  $2\lvert h \rvert$.
- Define $\phi_f = \big[f(a+h,b+h) - f(a+h,b)] - [f(a,b+h) - f(a,b)\big]$
- Use
  [single variable MVT](https://s1.sahithyan.dev/mathematics/real-analysis/other-theorems/#mean-value-theorem)
  for $x$, then $y$
- Prove $\phi_f = h^2 f_{xy}(c,d)$ where $c$ is between $a$ and $a+h$ and $d$ is
  between $b$ and $b+h$
- Rearrange the terms and prove $\phi_f = h^2 f_{yx}(l,k)$ where $l$ is between
  $a$ and $a+h$ and $k$ is between $b$ and $b+h$
- Take the limit

:::
