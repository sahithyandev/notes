---
title: Differentiability
sidebar:
  order: 6
slug: methods-of-mathematics/multivariable-calculus/differentiability
prev: true
next: true
---

### Equation of tangent line

Suppose $f$ is a single-variable function, and $f$ is differentiable at $x_0$.
The equation of the tangent line to $f$ at $x_0$ is:

```math
y - f(x_0) = f'(x_0)(x - x_0)
```

For 2-variable functions, they will have a tangent plane. For functions with more than 2 variables, they
have a tangent space.

## Differentiable

Suppose $z=f(x,y)$ where $f:D\rightarrow \mathbb{R}$; $D\subset \mathbb{R}^2$
and $(a,b)\in D$.

**If** $f_x(a,b)$ and $f_y(a,b)$ exists and $\Delta{z}$ can be expressed in the
below form, **then** $f$ is differentiable at $(a,b)$.

```math
\Delta z = \Delta x f_x(a,b) + \Delta y f_y(a,b) + \epsilon_1\Delta x + \epsilon_2 \Delta y
```

where $\epsilon_1$ and $\epsilon_2$ approach $0$ as $(\Delta x, \Delta y)$
approach $(0,0)$. OR

$f$ is differentiable at $(a,b)$ **iff** the limit exists:

```math
\lim_{(x,y)\to(a,b)} \frac{f(x,y)-f(a,b)-f_x(a,b)\Delta x -f_y(a,b)\Delta y }{\sqrt{(x-a)^2+(y-b)^2}}
```

$f$ is said to be differentiable **iff** it is differentiable at every point in
its domain. $ $

**If** either $f_{x}$ or $f_y$ is non-existent at a point, **then** $f$ is not
differentiable at that point.

**If** $f_x$ and $f_y$ are continuous throughout at an open region $D$, **then**
$f$ is differentiable at every point of $D$.

The differentiability can also be proven by proving:

```math
\lim_{\Delta \rho \to 0} \frac{\Delta z - \text{d}z}{\Delta \rho} = 0
\;\;\;
\text{where}
\;\;\;
\Delta \rho = \sqrt{{\Delta x}^2 + {\Delta y}^2}
```

### Implies Continuity

```math
f \text{ is differentiable} \implies f \text{ is continous}
```

## Derivative

Suppose $z=f(x,y)$ where $f$ is a differentiable function of $x$ and $y$.

```math
\text{d}z
 = \frac{\partial z}{\partial x}\,\text{d}x + \frac{\partial z}{\partial y}\,\text{d}y
=\Delta x f_x(a,b) + \Delta y f_y(a,b)
```

$\text{d}z$ is called the total differential of $f$.

## Chain Rule

Let $x(t),y(t)$ be single-variable, differentiable functions and $f(x,y)$ be a
2-variable differentiable function having continuous first order partial
derivatives.

$f\big(x(t),y(t)\big)$ is differentiable. $ $

```math
\frac{\text{d}f}{\text{d}t} = \frac{\partial f}{\partial x}\frac{\text{d}x}{\text{d}t}
+ \frac{\partial f}{\partial y}\frac{\text{d}y}{\text{d}t}
```

Can be extended for functions of more than 2 variables.
