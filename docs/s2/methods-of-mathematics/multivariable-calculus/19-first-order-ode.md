---
title: First Order ODE
sidebar:
  order: 19
slug: methods-of-mathematics/multivariable-calculus/first-order-ode
prev: true
next: true
---

[Solving first order ODE](https://s1.sahithyan.dev/mathematics/ode/first-order-ode/) was introduced in 1st semester. This section extends upon it.

## Exact Differential Equation

Suppose $P(x,y)$ and $Q(x,y)$ are continuous functions in a region $R$.

A differential equation of the form $P(x,y)dx + Q(x,y)dy = 0$ is exact **if** $\exists f(x,y)$ such that: 

```math
\frac{\partial f}{\partial x} = P(x,y)\;\;\text{and}\;\; \frac{\partial f}{\partial y} = Q(x,y)
```

Then $f(x,y) = C$ is the general solution. $ $

### Exact Equation

$P(x,y)dx + Q(x,y)dy = 0$ is an exact equation **iff**: $ $

```math
\frac{\partial Q}{\partial x} = \frac{\partial P}{\partial y}
```

## Integrating Factor

If the differential equation $P(x,y)dx + Q(x,y)dy = 0$ is not exact, it might be possible to make it exact by multiplying it with its integrating factor $\mu(x,y)$.

**If** the below function is a function of $x$ only: $ $

```math
h(x) = \frac{1}{Q(x,y)} \left[ P_y(x,y) - Q_x(x,y)  \right]
```

**Then** $u(x,y) = \exp(\int h(x)\,\text{d}x)$. $ $

**If** the below function is a function of $y$ only: $ $

```math
k(y) = \frac{1}{P(x,y)} \left[ Q_x(x,y) - P_y(x,y)  \right]
```

**Then** $u(x,y) = \exp(\int k(y)\,\text{d}y)$. $ $
