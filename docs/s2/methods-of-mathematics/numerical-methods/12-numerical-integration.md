---
title: Numerical Integration
sidebar:
  order: 12
slug: methods-of-mathematics/numerical-methods/numerical-integration
prev: true
next: false
---

Based on the strategy of replacing a complicated
function or tabulated data with an approximating function that is easy to integrate.

### Numerical quadrature

The basic method involved in approximating:

```math
\int_a^b f(x)\,\text{d}x
```

### Degree of Accuracy

Aka. precision. The largest positive integer $n$ such that the quadrature formula is exact for $x^k$ for all $k \in \mathbb{Z}\cap [0,n]$.

## Trapezoidal Rule

Equivalent to approximating the trapezoidal area under the straight line connecting $f(a)$ and $f(b)$. Degree of accuracy is $1$.

```math
\int_{x_0}^{x_1} f(x)\,\text{d}x = \frac{h}{2} \left( f(x_0) + f(x_1) \right) - \frac{h^3}{12} f^{(2)}(\xi)
```

Here $h = x_1 - x_0$. $ $

:::note[Proof Hint]

Trapezoidal Rule can be proven by using 1st degree Lagrange interpolating polynomial of $f$. $ $

:::

## Simpson's Rules

A more accurate method of approximating the integral of a function, is to use higher-order polynomials to connect the points.

Degree of accuracy is $3$. $ $

### Simpson's 1/3 Rule

Resulted when a second-order interpolating polynomial with 3 equally-spaced points is used to approximate the integral.

```math
\int_{x_0}^{x_2} f(x)\,\text{d}x = \frac{h}{3} \big( f(x_0) + 4f(x_1) + f(x_2) \big) - \frac{h^5}{90} f^{(4)}(\xi)
```

Here $\xi$ is between $x_0$ and $x_2$ and $h={(x_2-x_0)}/{2}$. Preferred method because, third-order accuracy is attained with 3 points.

### Simpson's 3/8 Rule

Resulted when a third-order interpolating polynomial with 4 equally-spaced points is used to approximate the integral.

```math
\int_{x_0}^{x_3} f(x)\,\text{d}x = \frac{3h}{8} \big( f(x_0) + 3f(x_1) + 3f(x_2) + f(x_3) \big) - \frac{3h^5}{80} f^{(4)}(\xi)
```

Here $\xi$ is between $x_0$ and $x_3$ and $h={(x_3-x_0)}/{3}$.

## Composite Rules

### Composite Trapezoidal Rule

An improved version of the trapezoidal rule. Uses multiple intervals (say $n$) to approximate the integral. $ $

```math
\int_{x_0}^{x_n} f(x)\,\text{d}x = \frac{h}{2} \left( f(x_0) + f(x_n) + 2\sum_{i=1}^{n-1} {f(x_i)} \right) - \frac{b-a}{12} h^2 f^{(2)}(\xi_i)
```

Here $h = (b-a)/n$ and $\xi_i$ is between $x_{i-1}$ and $x_i$ for $i=1,2,3,\dots,n$.

### Composite Simpson's Rule

An improved version of Simpson's 1/3 rule. Uses even number ($n=2k$) of multiple intervals to approximate the integral. $ $

```math
\int_a^b f(x)\,\text{d}x =
\frac{h}{3}
\left[
f(x_0)+f(x_n)+
2\sum_{j=1}^{k - 1}{f(x_{2j})}+
4\sum_{j=1}^{k}{f(x_{2j - 1})}
\right]
-\frac{b-a}{180}h^4 f^{(4)}(\mu)
```

Here $h = (b-a)/n$ and $\mu$ is between $x_0$ and $x_n$.
