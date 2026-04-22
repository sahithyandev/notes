---
title: Partial Differential Equations
sidebar:
  order: 10
slug: s3/differential-equations/partial-differential-equations
prev: true
next: true
dateCreated: 2026-04-22T07:09:10.702Z
lastUpdatedOn: 2026-04-22T07:15:36.797Z
---

A PDE involves partial derivatives of a dependent variable with respect to 2 or more independent variables.

A general PDE in implicit form is $f(x,y,u,u_x,u_y,u_{xx},u_{xy},\ldots) = 0$.

Here:

- $x,y$ - independent variables
- $u(x,y)$ - dependent variable
- $u_x$ - first partial derivative w.r.t. $x$
- $u_y$ - first partial derivative w.r.t. $y$
- $u_{xx}$ - 2nd partial derivative w.r.t. $x$
- $u_{yy}$ - 2nd partial derivative w.r.t. $y$
- $u_{xy}$ - partial derivative of $u_x$ w.r.t. $y$
- $u_{yx}$ - partial derivative of $u_y$ w.r.t. $x$

:::note

Generally $u_{xy} \neq u_{yx}$.

**If** both $u_{xy}$ and $u_{yx}$ are continuous on an open set $S$, **then** $u_{xy} = u_{yx}$ on $S$.

For the rest of the chapter, it is assumed that the function $u(x,y)$ and PDEs are chosen so that both $u_{xy}$ and $u_{yx}$ are continuous.

:::

## Terminology

### Order

Highest derivative appearing in a PDE.

## Types

### Linear

Dependent variable and all derivatives appear linearly. Won't have: $u_x^2$, $\sin(u)$, $u\cdot u_{xx}$.

### Non-linear

When a PDE is not linear.

### Quasi-linear

When highest-order derivative terms appear linearly. but coefficients may depend on lower-order derivatives or variables. A subset of non-linear PDEs.

### Homogeneous

Every term contains $u$ or its derivatives. There are no constants.

Not discussed for non-linear PDEs.

### Non-homogenous

When a PDE is not homogeneous.

## Forms

### Implicit Form

The PDE is written without solving for any specific derivative. Everything is inside one general function.

```math
f(x,y,u,u_x,u_y,u_{xx},u_{xy},\ldots) = 0
```

### Explicit Form

The PDE is solved for the highest-order derivatives.

### Normal Form

The PDE is solved for only one highest-order derivative. Basically explicit form for the specific highest derivative you care about.

Used to solve PDEs by characteristic curves.

## Classification of Second-Order PDEs

Second-order equations are central in heat flow, vibrations and potential theory. Their classification determines what solving technique is appropriate.

### Canonical Form

A second-order linear PDE with 1 dependent variable and 2 independent variables.

```math
A u_{xx} + B u_{xy} + C u_{yy} + Du_x + E u_y + F u + G = 0
```

Here $A$ to $G$ are functions of $x$ or $y$ or both or constants.

Classification depends on the principal part $L(u) = Au_{xx} + Bu_{xy} + Cu_{yy}$. When $A, B, C$ are functions of $x$ and $y$, the classification may differ across different points.

### Discriminant

For a PDE in canonical form, its discriminant is:

```math
D = B^2 - 4AC
```

### Elliptic

When $D \lt 0$.

Examples:
- $u_{xx} + u_{yy} = 0$ (Laplace Equation)

### Hyperbolic

When $D \gt 0$.

Examples:
- $u_{xx} - u_{yy} = 1$

### Parabolic

When $D = 0$.

Examples:
- $u_t = k u_{xx}$ (Heat Equation)
