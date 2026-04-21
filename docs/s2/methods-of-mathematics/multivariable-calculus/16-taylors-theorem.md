---
title: Taylor's Theorem
sidebar:
  order: 16
slug: methods-of-mathematics/multivariable-calculus/taylors-theorem
prev: true
next: true
---

Analogous to the [one-dimensional Taylor's theorem](https://s1.sahithyan.dev/mathematics/real-analysis/taylor-theorem/).

Suppose $f: \mathbb{R}^2 \to \mathbb{R}$. **If** all partial derivatives of order $n$ are continuous in a closed region and all the partial derivatives of order $n+1$ exist in the open region **then**:

```math
f(x_0 + h, y_0 + k) = f(x_0, y_0) +
\sum_{i=1}^{n} \frac{1}{i!} \left( h \frac{\partial}{\partial x} + k \frac{\partial}{\partial y} \right)^i f \Bigg|_{(x_0, y_0)} +
R_n
```

Here
```math
R_n = \frac{1}{(n+1)!} \left( h \frac{\partial}{\partial x} + k \frac{\partial}{\partial y} \right)^{n+1} f \Bigg|_{(x_0+h, y_0+k)}
```

And $\theta \in (0,1)$. And the below expression is expanded using binomial theorem. $ $

```math
\left( h \frac{\partial}{\partial x} + k \frac{\partial}{\partial y} \right)^n
```

## Taylor Series

```math
f(x, y) = \sum_{n=0}^{\infty} \left\{ \frac{1}{n!} \sum_{k=0}^{n} \binom{n}{k} \frac{\partial^n f}{\partial x^{n-k} \partial y^k} \bigg|_{(x_0, y_0)} (x - x_0)^{n-k} (y - y_0)^k \right\}
```

## Linear & quadratic approximations

Linear approximation for a function $f$ can be made using the first-order Taylor series expansion: $ $

```math
f(x_0 + h, y_0 + k) \approx f(x_0, y_0) + h\frac{\partial f}{\partial x} \bigg|_{(x_0, y_0)} + k\frac{\partial f}{\partial y} \bigg|_{(x_0, y_0)}
```

Quadratic approximation for a function $f$ can be made using the second-order Taylor series expansion: $ $

```math
f(x_0 + h, y_0 + k)
\approx f(x_0, y_0) +
h\frac{\partial f}{\partial x} \bigg|_{(x_0, y_0)} +
k \frac{\partial f}{\partial y} \bigg|_{(x_0, y_0)} +
\frac{1}{2} \left(h^2 \frac{\partial^2 f}{\partial x^2} \bigg|_{(x_0, y_0)} + 2hk \frac{\partial^2 f}{\partial x \partial y} \bigg|_{(x_0, y_0)} + k^2 \frac{\partial^2 f}{\partial y^2} \bigg|_{(x_0, y_0)} \right)
```
