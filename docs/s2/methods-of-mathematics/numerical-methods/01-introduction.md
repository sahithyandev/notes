---
title: Introduction to Numerical Methods
sidebar:
  label: Introduction
  order: 1
slug: methods-of-mathematics/numerical-methods/introduction
prev: false
next: true
---

## Round-Off Errors

The error that is produced when a calculator or computer is used to perform real
number calculations. Real numbers are typically represented in computers using floating-point form.

## Machine Numbers

Represented in the normalized decimal floating-point form.

```math
\pm\;0.d_{1}d_{2}\ldots d_{k}\times 10^{n}\;\;\text{where}\;\;1\leq d_{1}\leq 9,\ \text{and}\ 0 \leq d_{i}\leq 9
```

Aka. $k$-digit decimal machine numbers. Any positive real number can be written in the above form. $ $

### Floating point form

Denoted as $fl(y)$. Obtained by terminating the mantissa of $y$ at $k$ decimal digits. The termination can be done in 2 ways:
- chopping: chop off the digits $d_{k+1}d_{k+2} \dots$ to produce the
  floating-point form
- rounding: when $d_{k+1} ≥ 5$, add $1$ to $d_k$ to obtain $fl(y)$ and then chop
  off all but the first k digits.

## Measuring Errors

Suppose $*p$ is an approximation of $p$.

### Absolute Error

```math
\lvert\, p - *p\,\rvert
```

### Relative Error

```math
\bigg\lvert{\frac{p - *p}{p}}\bigg\rvert
```

### Successive relative error

When $p$ is unknown and $p*$ is found through iterations, the relative error can
be used as:

```math
\left\lvert \frac{p_n(x) - p_{n-1}(x)}{p_n(x)} \right\rvert
```

Here $p_n(x)$ means the $n$-th approximation of $p$.

## Finite-Digit Arithmetic

Machine arithmetic are done on finite-digits and are not exact. Suppose
$\oplus, \ominus, \otimes, \oslash$ are machine addition, subtraction,
multiplication and division. $ $

```math
x \oplus y = f_l(f_l(x) + f_l(y))
```

```math
x \ominus y = f_l(f_l(x) - f_l(y))
```

```math
x \otimes y = f_l(f_l(x) \times f_l(y))
```

```math
x \oslash y = f_l(f_l(x)/f_l(y))
```

Due to this, the accuracy is lost to some extent. The accuracy can be increased
by rearranging calculations.

## Truncating Error

Occurs because of using approximation in place of an exact mathematical
procedure. For example, the error due to the approximation of $e^x$ for the n-th
term in its Taylor expansion. $ $

:::note

[Taylor series](https://s1.sahithyan.dev/mathematics/real-analysis/taylor-theorem/)
is commonly used to approximate functions. The remainder term is also known as
truncation error.

Suppose a function $f$ must be approximated at $x=x_1$ and it has an associated
Taylor series. It's preferred to have the Taylor series centered around a close
point to $x_1$, to decrease the error.

:::

## Algorithm

An algorithm is a set of well-defined instructions to solve a problem.

### Stable

If a small change in the input causes a small change in the output, the
algorithm is stable.

### Unstable

When a algorithm is not stable.

### Conditionally Stable

When an algorithm is stable only within a certain input range.

## Growth of Error

Suppose $E_0 \gt 0$ denotes an error introduced in a calculation. $E_n$ represents the error after $n$ subsequent operations.

### Linear growth

When $E_n \approx CnE_0 $ and $C$ is a constant independent of $n$.

### Exponential growth

When $E_n \approx C^nE_0 $ for some $C \gt 1$.

## Rate of convergence

A measure of how fast a sequence is converging.

Suppose $\set{\beta_n}$ converges to $0$ and $\set{\alpha_n}$ converges to a
number $\alpha$.

**If** $\exists K \gt 0$ such that, $ $

```math
\lvert \alpha_n - \alpha \rvert \le K\lvert \beta_n \rvert,\;\;\text{for large}\;n
```

**Then** we say that ${\alpha_n}$ converges to $\alpha$ with rate of (or order
of) convergence $O(\beta_n)$. It is written as $\alpha_n = \alpha + O(\beta_n)$.

### For limits

Suppose $\lim_{h \to 0} G(h) = 0$ and $\lim_{h \to 0} F(h) = L$.

**If** $\exists K \gt 0$ such that, $ $

```math
\lvert F(h) - L \rvert \le K \lvert G(h) \rvert,\;\;\text{For small}\;h
```

**Then** $F(h) = L + O(G(h))$. $ $

## Numerical solution of non-linear equations

Non-linear function is a function whose graph is not a straight line.

In many situations, non-linear equations cannot be solved analytically. In that
case, the solutions of the equations must be approached using
iterative methods. The principle of these methods of solving consists in
starting from an arbitrary point, the closest possible point to the solution
sought, and involves arriving at the solution gradually through successive
tests.

The 2 criteria to take into account when choosing a method for solving
non-linear equations are:

- Method convergence (conditions of convergence, speed of convergence etc.).
- The cost of calculating of the method.
