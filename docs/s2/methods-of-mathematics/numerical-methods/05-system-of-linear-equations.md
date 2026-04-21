---
title: System of Linear Equations
sidebar:
  order: 5
slug: methods-of-mathematics/numerical-methods/system-of-linear-equations
prev: true
next: true
---

A linear equation is an equation that may be put in the form:

```math
a_{11}x_1 + a_{12}x_2 + a_{13}x_3 + \cdots + a_{1n}x_n = b_1
```

where $x_1, x_2, x_3, \cdots, x_n$ are variables, $a$’s are coefficients, and $b_1$ is constant.

A system of linear equations (or linear system) is a collection of linear equations involving the same set of variables.

A general system of $n$ linear equations with $n$ unknowns can be written as:

```math
\begin{aligned}
a_{11}x_1 + a_{12}x_2 + a_{13}x_3 + \cdots + a_{1n}x_n &= b_1 \\
a_{21}x_1 + a_{22}x_2 + a_{23}x_3 + \cdots + a_{2n}x_n &= b_2 \\
a_{31}x_1 + a_{32}x_2 + a_{33}x_3 + \cdots + a_{3n}x_n &= b_3 \\
\vdots \\
a_{n1}x_1 + a_{n2}x_2 + a_{n3}x_3 + \cdots + a_{nn}x_n &= b_n
\end{aligned}
```

It can also be written in matrix form:

```math
A \vec{X} = \vec{B}
```
where $A$ is called the coefficient matrix, $\vec{X}$ is a variable or unknown matrix, and $\vec{B}$ is a constant matrix.

```math
\begin{pmatrix}
  a_{11} & a_{12} & a_{13} & \cdots & a_{1n} \\
  a_{21} & a_{22} & a_{23} & \cdots & a_{2n} \\
  a_{31} & a_{32} & a_{33} & \cdots & a_{3n} \\
  \vdots & \vdots & \vdots & \ddots & \vdots \\
  a_{n1} & a_{n2} & a_{n3} & \cdots & a_{nn}
\end{pmatrix}
\begin{pmatrix}
  x_1 \\
  x_2 \\
  x_3 \\
  \vdots \\
  x_n
\end{pmatrix}
=
\begin{pmatrix}
b_1 \\
b_2 \\
b_3 \\
\vdots \\
b_n
\end{pmatrix}
```

## Iterative Techniques

The solution is guessed and then iteratively improved.

### Jacobi Method

A slow method for solving systems of linear equations iteratively. An initial guess is made for the solution vector $\vec{X}^{(0)}$. Then iteratively, subsequent approximations are made using the equation: ($x_i$ is made subject in $i$-th equation). $ $

```math
x_i = \left(\sum_{j=1, j \neq i}^{n}  -\frac{a_{ij}x_j}{a_{ii}} \right) + \frac{b_i}{a_{ii}}, \quad i = 1, 2, \ldots, n
```

For each $k \geq 1$, generate the components $x_i^{(k)}$ of $\vec{X}^{(k)}$ using the components of previous iteration $\vec{X}^{(k-1)}$ for each $i = 1, 2, \ldots, n$ using:
```math
x_i^{(k)} = \frac{1}{a_{ii}} \left[ -\sum_{j=1, j \neq i}^{n} a_{ij}x_j^{(k-1)} + b_i \right]
```

Cannot be used for singular matrix.

:::note[Diagonally dominant matrix]

$A_{n\times n}$ is diagonally dominant **when** $\forall i \in \{1, 2, \ldots, n\}$:

```math
\lvert a_{ii} \rvert \ge \sum_{j=1,j\neq i}^{n} \lvert a_{ij} \rvert
```

$A_{n\times n}$ is strictly diagonally dominant **when** $\forall i \in \{1, 2, \ldots, n\}$:
```math
\lvert a_{ii} \rvert \gt \sum_{j=1,j\neq i}^{n} \lvert a_{ij} \rvert
```

:::

Relative error is given by:
```math
\text{Relative error} = 
\frac
{\lVert \vec{X}^{(k)} \rVert - \lVert \vec{X}^{(k - 1)} \rVert}
{\lVert \vec{X}^{(k)} \rVert}
```

Here any convenient [matrix norms](https://s1.sahithyan.dev/mathematics/matrices/matrix-norms/) can be used. Usually infinity norm is used.

```math
l_\infty = 
\max
\bigg\{
    \sum_{j=1}^{n}
    {\lvert a_{ij} \rvert}
    \;;\;
    i \in [1,n]
\bigg\}
```

:::note
The equation $A \vec{X} + \vec{B}$ can be converted to the form $\vec{X} = T\vec{X} + \vec{C}$.

```math
T = D^{-1}(L + U)
\land 
C = D^{-1} \vec{B}
```

Here:
- $D$ is a diagonal matrix whose entries are of $A$.
- $-L$ is the strictly lower-triangular part of $A$.
- $-U$ is the strictly upper-triangular part of $A$.

:::

### Gauss-Seidel Method

An improvement over the Jacobi method. Major difference from Jacobi method is instead of using values from the previous iteration, here newest approximations for $x_i$ are used. $ $

When computing $x_i^{(k)}$, the components $x_1^{(k)}, \ldots, x_{i-1}^{(k)}$ would have already been computed. They will be used to compute the $x_i^{(k)}$ as follows for each $i = 1, 2, \ldots, n$.

```math
x_i^{(k)} = \frac{1}{a_{ii}} \left[ b_i -\sum_{j=1}^{i-1} a_{ij}x_j^{(k)} - \sum_{j=i+1}^{n} a_{ij}x_j^{(k-1)} \right]
```

:::note

The equation $A \vec{X} + \vec{B}$ can be converted to the form: $\vec{X} = T\vec{X} + \vec{C}$.

```math
\vec{X} = (D - L)^{-1} U\vec{X} + (D - L)^{-1}\vec{B}
\quad k = 1, 2, 3, \ldots
```

For $D-L$ to be non-singular, $\forall i \in \{1,2,\dots,n\}\;\; a_{ii} \neq 0$.

Here:
- $D$ is a diagonal matrix whose entries are of $A$.
- $-L$ is the strictly lower-triangular part of $A$.
- $-U$ is the strictly upper-triangular part of $A$.

:::

## Convergence of iterative methods

### Theorem 1

Suppose $\vec{X}^{(0)} \in R^n$. And $\vec{X}^{(k)} = T \vec{X}^{(k-1)} + \vec{C}, \quad \text{for each } k \geq 1$.

The sequence ${\vec{X}^{(k)}}_{k=0}^\infty$ converges to the unique solution of $\vec{X} = T\vec{X} + \vec{C}$ **iff** $\rho(T) < 1$. Here $\rho$ denotes the [spectral radius](https://s1.sahithyan.dev/mathematics/matrices/eigenvalues-eigenvectors/#spectral-radius).

**If** $||T|| < 1$ for any natural matrix norm and $\vec{C}$ is a given vector, **then** for any $\vec{X}^{(0)} \in R^n$, the sequence converges to a vector $\vec{X} \in R^n$, with $\vec{X} = T\vec{X} + \vec{C}$, and the following error bounds hold:

```math
\lVert\vec{X} - \vec{X}^{(k)}\lVert \leq \lVert T\lVert^k \;\cdot\; \lVert\vec{X} - \vec{X}^{(0)}\lVert
```

```math
\lVert\vec{X} - \vec{X}^{(k)}\rVert \leq \frac{\lVert T\rVert^k}{1 - \lVert T\rVert} \lVert\vec{X}^{(1)} - \vec{X}^{(0)}\rVert
```

### Theorem 2

**If** $A$ is strictly diagonally dominant, **then** for any choice of $X^{(0)}$, both Jacobi and Gauss-Seidel methods gives sequences ${\vec{X}^{(k)}}_{k=0}^\infty$ that converge to the unique solution of $A\vec{X} = \vec{B}$.
