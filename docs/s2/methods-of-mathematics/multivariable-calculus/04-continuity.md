---
title: Continuity
sidebar:
  order: 4
slug: methods-of-mathematics/multivariable-calculus/continuity
prev: true
next: true
---

Suppose $f$ is a real-valued function defined on $D \subset \mathbb{R}^2$.

$f$ is continuous at $(a,b) \in D$ **iff**:

```math
\forall{\epsilon>0}\;
\exists{\delta>0}\;
\forall{(x,y)\in D}\;
\bigg(\sqrt{(x-a)^2 + (y-b)^2}<\delta\implies{|f(x,y)-f(a,b)|<\epsilon}\bigg)
```

- **If** $(a,b)\in D$ is an isolated point of $D$, **then** $f$ is continuous at
  $(a,b)$.
- Otherwise, for $f$ to be continuous at $(a,b) \in D$:
  - $f(a,b)$ must be well defined
  - $\lim_{(x,y)\to{(a,b)}} {f(x,y)}$ must exists
  - $\lim_{(x,y)\to{(a,b)}} {f(x,y)} = f(a,b)$

:::note

- Constant multiples, sum, difference, product, quotient, and rational powers of
  continuous functions are continuous whenever they are well-defined.
- Polynomials in two variables are continuous functions.
- Rational functions are continuous functions provided they are well-defined.

:::
