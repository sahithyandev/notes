---
title: Series of ODE
sidebar:
  order: 12
slug: s3/differential-equations/series-of-ode
prev: true
next: true
dateCreated: 2026-04-22T07:09:10.702Z
lastUpdatedOn: 2026-04-22T07:15:36.797Z
---

Consider:

```math
P_0(x)y'' + P_1(x)y' + P_2(x)y = 0
```

Here $P_0, P_1, P_2$ are analytic functions of $x$.

These equations rarely have elementary solutions; power series gives a general workable form.
Special functions (Bessel, Legendre, Laguerre, Hermite, Chebyshev) arise naturally.

## Terminology

### Ordinary Point

$x=a$ is ordinary **if** $P_0(a) \neq 0$.

### Singular Point

When $x=a$ is not ordinary. When $P_0(a)=0$.

### Regular Singular Point

A singular point $x=a$ is regular when the ODE is rewritten as:

```math
y'' + \frac{Q_1(x)}{x-a} y' + \frac{Q_2(x)}{(x-a)^2} y = 0
```

And $Q_1(x), Q_2(x)$ are analytic at $x=a$.

### Irregular Singular Point

A singular point that not is not regular.

## Series Solutions

A second-order ODE has two independent series solutions $y = a y_1 + b y_2$ where $a,b$ are constants.

### Solution About Ordinary Points

Suppose $x=a$ is an ordinary point. The solution is of the form:

```math
y = \sum_{n=0}^{\infty} a_n (x-a)^n
```

Procedure:

1. Compute $y',y''$
2. Substitute in ODE
3. Collect powers of $x$
4. Set coefficient of each $x^n$ to zero  
   → gives recurrence relation
5. Use recurrence to express all $a_n$ in terms of $a_0, a_1$

### Solution About Singular Points

Suppose $x=a$ is a regular singular point. The solution is of the form:

```math
y = (x-a)^m \sum_{n=0}^{\infty} a_n (x-a)^n
```

Here $a_0 \neq 0$.

:::note

Solution for irregular singular points is more complex and not covered here.

:::

## Frobenius Method

Used to find series solutions about regular singular point $x=a$.

```math
y = (x-a)^m \sum_{n=0}^{\infty} a_n (x-a)^n
```

Procedure:

1. Compute derivatives $y', y''$
2. Substitute in ODE
3. Set coefficient of the lowest power term to $0$  
   Which gives an indicial equation. The equatiion is quadratic in $m$.
4. Solve for $m_1, m_2$
5. Based on nature of roots, construct solutions

### Case 1

Distinct roots, not differing by integer.

Two independent Frobenius series:

```math
y = c_1 y_{m_1} + c_2 y_{m_2}
```

### Case 2

Equal roots.

One Frobenius solution; second solution involves

```math
y = c_1 (y_1)_{m_1} + c_2 \left(\frac{\partial y}{\partial m}\right)_{m_1}
```

### Case 3

Roots differ by integer. Larger root (corresponding to $m_2$) always gives a valid solution. Smaller root may or may not.

#### Subcase 3a

**If** the recurrence relation produces finite coefficients when $m=m_1$, **then** another Frobenius solution exists.

```math
y = c_1 (y_1)_{m_2} + c_2(y_2)_{m_1}
```

#### Subcase 3b
If recurrence breaks, the complete solution is:

```math
y = c_1 \left( \frac{\partial y}{\partial m}\right)_{m_1} + c_2 y \left( y \right)_{m_2}
```

Here $c_1$, $c_2$ are constants.

## Bessel’s Equation

The equation of the form:

```math
x^2 y'' + x y' + (x^2 - n^2) y = 0
```

### Bessel Functions

Solutions of Bessel's equation.

The solutions are Bessel functions of order $n$:

```math
J_n(x) = \sum_{k=0}^{\infty} \frac{(-1)^k}{k! (n+k)!} \left( \frac{x}{2} \right)^{n + 2k}
```
