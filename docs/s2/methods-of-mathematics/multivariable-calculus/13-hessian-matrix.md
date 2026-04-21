---
title: Hessian Matrix
sidebar:
  order: 13
slug: methods-of-mathematics/multivariable-calculus/hessian-matrix
prev: true
next: true
---

Suppose $f: \mathbb{R}^n \to \mathbb{R}$ is a twice partially differentiable function. The Hessian matrix of $f$ is the matrix of second partial derivatives.

```math
H(f) = D^2 f = \begin{pmatrix}
\frac{\partial^2 f}{\partial x_1^2} &
\frac{\partial^2 f}{\partial x_2 \partial x_1} &
\cdots &
\frac{\partial^2 f}{\partial x_n \partial x_1} \\

\frac{\partial^2 f}{\partial x_1 \partial x_2} &
\frac{\partial^2 f}{\partial x_2^2} &
\cdots &
\frac{\partial^2 f}{\partial x_n \partial x_2} \\

\vdots &
\vdots &
\ddots &
\vdots \\

\frac{\partial^2 f}{\partial x_1 \partial x_n} &
\frac{\partial^2 f}{\partial x_2 \partial x_n} &
\cdots &
\frac{\partial^2 f}{\partial x_n^2}
\end{pmatrix}
```


At a point $x \in \mathbb{R}^n$ is the $n \times n$ matrix of second partial derivatives of $f$ at $x$. Denoted by $H(f)(x)$.
