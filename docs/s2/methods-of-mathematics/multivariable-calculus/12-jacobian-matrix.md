---
title: Jacobian Matrix
sidebar:
  order: 12
slug: methods-of-mathematics/multivariable-calculus/jacobian-matrix
prev: true
next: true
---

A generalization of the derivative for vector-valued functions.

Jacobian matrix for $f: \mathbb{R}^n \to \mathbb{R}^m$ is defined as: $ $

```math
\mathbf{J}_p f(\mathbf{x}) =
\begin{pmatrix}
\frac{\partial f_1}{\partial x_1} & \frac{\partial f_1}{\partial x_2} & \cdots & \frac{\partial f_1}{\partial x_n} \\
\frac{\partial f_2}{\partial x_1} & \frac{\partial f_2}{\partial x_2} & \cdots & \frac{\partial f_2}{\partial x_n} \\
\vdots & \vdots & \ddots & \vdots \\
\frac{\partial f_m}{\partial x_1} & \frac{\partial f_m}{\partial x_2} & \cdots & \frac{\partial f_m}{\partial x_n}
\end{pmatrix}
```

## Jacobian of a transformation

Jacobian of the transformation $T: x=x(u,v),\;y=(u,v)$ is: $ $

```math
\frac{\partial(x, y)}{\partial(u, v)} =
\det
\begin{bmatrix}
\frac{\partial x}{\partial u} & \frac{\partial x}{\partial v} \\
\frac{\partial y}{\partial u} & \frac{\partial y}{\partial v}
\end{bmatrix} =
\frac{\partial x}{\partial u} \frac{\partial y}{\partial v} - \frac{\partial x}{\partial v} \frac{\partial y}{\partial u}
```

## Approximation

First order approximation of $f(x)$ around $x_0$ can be obtained by the Jacobian matrix.

```math
A(\boldsymbol{\underline{x}}) =
f (\boldsymbol{\underline{x_0}} ) + \mathbf{J}_p^T f(\boldsymbol{\underline{x_0}} )(\underline{\boldsymbol{x}} − \underline{\boldsymbol{x_0}} )
```
