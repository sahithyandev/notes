---
title: Least Squares Approximation
sidebar:
  order: 10
slug: methods-of-mathematics/numerical-methods/least-squares-approximation
prev: true
next: true
---

```math
S_r = \sum_{i=1}^n e_i^2=
\sum_{i=1}^{n} (y_{i,\text{measured}} - y_{i,\text{model}})^2
```

## Linear regression

The least squares approach that involves determining the best approximating line.

Let the best _least squares line_ to a collection of data points ${(x_i,y_i)_{i=1}^n}$ be: $ $

```math
y = a_1 x + a_0
```

$a_1$ and $a_0$ can be found by solving:

```math
a_1 \sum_{i=1}^n {x_i^2} + a_0\sum_{i=1}^n {x_i} = \sum_{i=1}^n {x_i y_i}
```

```math
a_1 \sum_{i=1}^n {x_i} + a_0\sum_{i=1}^n {1} = \sum_{i=1}^n {y_i}
```

## Polynomial regression

The least squares approach that involves determining the best approximating polynomial.

Let the best _least squares polynomial_ to a collection of data points ${(x_i,y_i)_{i=1}^m}$ be: $ $

```math
P_n(x) = \sum_{i=1}^{n} a_i x^i
```

Here $n \lt m-1$. $ $

The constants $a_i$ can be found by subtituting the known data points in the polynomial.

```math
\sum_{k=0}^n \left\{a_k \sum_{i=1}^m x_i^{j+k} \right\} = \sum_{i=1}^m y_i x_i^{j}
\;\;\text{where}\; j = 0,1,\dots,n
```
