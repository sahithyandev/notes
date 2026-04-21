---
title: Partial Differential Equations
sidebar:
  order: 20
slug: methods-of-mathematics/multivariable-calculus/partial-differential-equations
prev: true
next: false
---

Introduced in [Semester 1](https://s1.sahithyan.dev/mathematics/ode/introduction/#partial-differential-equations).

## Notations

When the case of 2 independent variables is considered, $x$ and $ys are assumed to be the independent variables and $z$
is assumed be the dependent variable. The following notations are used in this section.

```math
p = \frac{\partial z}{\partial x} ; \;\;
q = \frac{\partial z}{\partial y} ; \;\;
r = \frac{\partial^2 z}{\partial x^2} ; \;\;
s = \frac{\partial^2 z}{\partial x \partial y} ; \;\;
t = \frac{\partial^2 z}{\partial y^2} ; \;\;
```

If there are $n$ independent variables, they are considered as $x_1, x_2, \dots, x_n$. In this case the following notations are used:

```math
p_i = \frac{\partial z}{\partial x_i} \;\;;\;\;i=1,2,\dots,n
```

## Types

Suppose $f(x,y,z,p,q) = 0$. $ $

### Linear

When it is linear in $p,q,z$. When it is of form: $ $

```math
P(x,y)p + Q(x,y)q = R(x,y)z + S(x,y) 
```

### Semi-linear

When it is linear in $p,q$ and $p,q$ are functions of $x,y$ only. When it is of form:

```math
P(x,y)p + Q(x,y)q = R(x,y,z)
```

### Quasi-linear

When it is linear in $p$ and $q$. Whe  it is of form:

```math
P(x,y,z)p + Q(x,y,z)q = R(x,y,z)
```

### Non-linear

When it does not satisfy any of the above type.

## Lagrange's Equation

Quasi-linear partial differential equation of order one.

### Solving method

General solution of Lagrange's equation, $\phi(u,v)=0$ is an arbitrary function. And
$u(x,y,z) = c_1$ and $v(x,y,z)=c_2$ are two independent solutions of:

```math
\frac{(dx)}{P(x,y,z)} = \frac{(dy)}{Q(x,y,z)} = \frac{(dz)}{R(x,y,z)}
```

Here $c_1$ and $c_2$ are arbitrary constants. At least one of $u$ or $v$ must contain $z$. $u$ and $v$ are independent if $u=v$ is not a constant.
