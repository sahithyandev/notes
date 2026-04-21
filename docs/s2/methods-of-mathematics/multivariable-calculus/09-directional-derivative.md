---
title: Directional Derivative
sidebar:
  order: 9
slug: methods-of-mathematics/multivariable-calculus/directional-derivative
prev: true
next: true
---

Rate of change of a multivariable function in the direction of the unit vector
$\boldsymbol{u}=(a,b)$. $ $

Directional derivative of $f$ in the direction $\boldsymbol{u}$ is:

```math
D_{\boldsymbol{u}} f(x_0,y_0) =
\lim_{h\to 0}
\frac{\Delta z}{h} =
\lim_{h\to 0}
\frac{f(x_0+ha, y_0+hb) - f(x_0,y_0)}{h}
```

**If** $f_x$ and $f_y$ are continuous at $(x,y)$, **then** $f$ has a directional
derivative in any direction $\boldsymbol{u}=(a,b)$.

```math
D_{\boldsymbol{u}} f(x,y) = af_x(x,y) + bf_y(x,y)
```

Also the directional derivative can be written as:

```math
D_{\boldsymbol{u}} f(x_0,y_0) = \Big\langle f_x(x_0,y_0),f_y(x_0,y_0)\Big\rangle \cdot \boldsymbol{u}
```

## Gradient

Denoted by $\nabla f$. Can be extended for functions with more inputs.
$ $

```math
\nabla f(x_0,y_0) =
 \Big\langle f_x(x_0,y_0),f_y(x_0,y_0) \Big\rangle
 =
\frac{\partial f}{\partial x}\boldsymbol{i}
+\frac{\partial f}{\partial y}\boldsymbol{j}
```

The $\nabla$ is the "del operator". $ $

```math
\nabla
\equiv
\frac{\partial }{\partial x}\boldsymbol{i}
+\frac{\partial }{\partial y}\boldsymbol{j}
```

### Critical point

Aka stationary point. A point where the gradient is zero or where one of the partial derivatives is undefined.

## Maxmimum of Directional Derivative

Maximum value of the directional derivative $D_\boldsymbol{u} f$ is
$\lvert \nabla f \rvert$ and occurs when the gradient vector and
$\boldsymbol{u}$ has the same direction.
