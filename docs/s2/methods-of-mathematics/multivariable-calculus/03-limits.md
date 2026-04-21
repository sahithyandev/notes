---
title: Limits
sidebar:
  order: 3
slug: methods-of-mathematics/multivariable-calculus/limits
prev: true
next: true
---

$\lim_{(x,y)\to{(a,b)}} {f(x)}=L$ **iff**: $ $

```math
\forall{\epsilon>0}\;
\exists{\delta>0}\;
\forall{(x,y)\in D}\;
\bigg(
  0<\sqrt{(x-a)^2 + (y-b)^2}<\delta\implies |f(x,y)-L|<\epsilon
\bigg)
```

In the above definition statement, circular $\delta-$disk was used; square
neighbourhood can also be used. The target point can be approached in any
directions. $ $

Multivariable limit properties are analogous to the
[single variable limits](https://s1.sahithyan.dev/mathematics/real-analysis/limits/#properties).

## Uniqueness of limit

Let $f$ be a real-valued function defined on $D\subseteq \mathbb{R}^2$. Let
$(a,b)\in \overline{D}$.

**If** $\lim_{(x,y)\to {(a,b)}} f$ exists, **then** it is unique. $ $

:::note[Proof Hint]

- Consider 2 limits $l,m$ for $f$ at $(a,b)$
- Consider $\delta_1, \delta_2 > 0$ for both limitting values for a chosen
  $\epsilon \gt 0$
- Reduce to $\forall \epsilon \gt 0, |l-m| < \epsilon$

:::

## Non existence of limit

Suppose as $(x,y) \to (a,b)$, $f \to L_1$ along a path $C_1$ and $f\to L_2$
along a different path $C_2$.

**If** $L_1 \neq L_2$ **then** the $\lim_{(x,y)\to (a,b)} f$ doesn't
exist.

## Iterated limits

Aka. repeated limits. **If** $f$ is defined in a neighborhood of a point $(a,b)$
in $\mathbb{R}^2$ and $\lim_{x\to a} f(x,y)$ exists, which is a function
of $y$ only, **then** the limit of this function as $y\to b$ can be written as:

```math
\lim_{y\to{b}}
\;
\lim_{x\to{a}}
 {f(x,y)}
```

Similarily, another limit exists.

```math
\lim_{x\to{a}}
\;
\lim_{y\to{b}}
 {f(x,y)}
```

Note:

- The two repeated limits may or may not exist independently
- The two repeated limits, when they exist, may or may not be equal.
- Existence of the 2-variable limit $\centernot\implies$ existence of either
  of the two repeated limits
- Existence of the repeated limits $\centernot\implies$ existence of
  2-variable limit
- **If** the repeated limit exists and they are not equal, **then** the 2-variable limit
  cannot exist.
- **If** a repeated limit exists, along with the 2-variable limit, **then** these two would
  be equal
