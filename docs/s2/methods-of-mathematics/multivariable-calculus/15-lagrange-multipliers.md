---
title: Lagrange Multipliers
sidebar:
  order: 15
slug: methods-of-mathematics/multivariable-calculus/lagrange-multipliers
prev: true
next: true
---

A method for maximizing or minimizing a general function $f(x, y, z)$ subject
to a constraint (or side condition) of the form $g(x, y, z) = k$.


## Theorem

**Suppose** $f,g \in C^1$ and $\nabla g \neq 0$. **Then** the extremum(s) of $f(x,y)$ subjected to $g(x,y) = k$ are included in each of:

```math
\det \frac{\partial (f,g)}{\partial (x,y)} = 0\;\;\text{and}\;\;g(x,y) = 0
```

```math
\nabla f(x,y) = \lambda \nabla g(x,y)
\;\;\text{and}\;\;
g(x,y) = 0
```

When there are $n$ constraint, the system of equations becomes: $ $

```math
\text{The system of equations is}
\begin{cases}
\nabla f = \lambda_1 \nabla g_1 + \lambda_2 \nabla g_2 + \cdots + \lambda_n \nabla g_n \\
g_1(x,y) = k_1 \\
g_2(x,y) = k_2 \\
\vdots \\
g_n(x,y) = k_n
\end{cases}
```
