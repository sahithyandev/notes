---
title: Partial Derivative
sidebar:
  order: 5
slug: methods-of-mathematics/multivariable-calculus/partial-derivative
prev: true
next: true
---

Suppose $f: (x,y) \rightarrow \mathbb{R}$. $f_x$ is the partial derivative of
$f$ with respect to $x$. $y$ is considered a constant in this case. Also denoted
by $\frac{\partial{f}}{\partial{x}}$, $f_x(x,y)$. The definition can be extended
for functions with more than 2 variables.

Partial derivative of $f(x,y)$ with respect to $x$ at the point $(a,b)$ is:

```math
f_x(a,b) = \lim_{h \to 0} \frac{f(a+h,b) - f(a,b)}{h}
```

Provided that the above limit exists. $f(x,b)$ must be continous at $x=a$ in
order for this partial derivative to exist.

## Higher partial derivatives

The second-order partial derivates of $f(x,y)$ are: $ $

```math
\frac{\partial^2 f}{\partial x^2} = \frac{\partial}{\partial x} \left( \frac{\partial f}{\partial x} \right) = f_{xx}
```

```math
\frac{\partial^2 f}{\partial y^2} = \frac{\partial}{\partial y} \left( \frac{\partial f}{\partial y} \right) = f_{yy}
```

```math
\frac{\partial^2 f}{\partial x \partial y} = \frac{\partial}{\partial x} \left( \frac{\partial f}{\partial y} \right) = f_{yx}
```

```math
\frac{\partial^2 f}{\partial y \partial x} = \frac{\partial}{\partial y} \left( \frac{\partial f}{\partial x} \right) = f_{xy}
```
