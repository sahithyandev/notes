---
title: Multinomial Distribution
sidebar:
  order: 5
slug: s3/applied-statistics/multinomial-distribution
prev: true
next: true
dateCreated: 2026-04-22T07:09:10.679Z
lastUpdatedOn: 2026-04-22T07:15:36.784Z
---

Suppose the random variables $X_1, X_2, \ldots, X_k$ represent the number of times each outcome $\theta_1, \theta_2, \ldots, \theta_k$ occurs in $n$ independent trials.

These random variables are said to follow a multinomial distribution with parameters $n$ and $\mathbf{p} = (p_1, p_2, \ldots, p_k)$ **iff** the following conditions are met:
```math
\sum_{i=1}^{k} p_i = 1
```

```math
\sum_{i=1}^{k} x_i = n
```

```math
P(X_1 = x_1, X_2 = x_2, \ldots, X_k = x_k) =
\frac{n!}{x_1! \, x_2! \, \cdots \, x_k!} \, p_1^{x_1} \, p_2^{x_2} \, \cdots \, p_k^{x_k}
```

```math
\binom{n}{x_1, x_2, \ldots, x_k}=
\frac{n!}{x_1! \, x_2! \, \cdots \, x_k!}
```
