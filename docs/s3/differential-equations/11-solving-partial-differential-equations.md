---
title: Solving Partial Differential Equations
sidebar:
  order: 11
  label: Solving PDEs
slug: s3/differential-equations/solving-partial-differential-equations
prev: true
next: true
dateCreated: 2026-04-22T07:09:10.702Z
lastUpdatedOn: 2026-04-22T07:15:36.797Z
---

A PDE of order $n$ has at most $n$ arbitrary functions in its general solution. The general solution is written as linear combination of the $n$ functions.

### Boundary Condition

An additional requirement imposed on the solution of a partial differential equation. Defines a condition fo the boundary of the domain in which the PDE is posed.

Suppose a PDE is defined on a region $D$ with boundary $\partial D$. A boundary condition prescribes a relation of the form:

```math
B\big(x, u(x), \nabla u(x)\big) = 0, \qquad x \in \partial D
```

### Initial Condition

A constraint that specifies the value of the solution at the initial time on the entire spatial domain for a time-dependent PDE.

## Direct Integration

Used when variables can be integrated directly with respect to one variable.

## Separation of Variables

This method assumes a product solution $u = X(x)Y(y)$. A PDE is converted into two ODEs.

Used in Laplace, heat, and wave equations.

### Two Dimensional Heat Flow

Assumptions when formulating a mathematical model:

- Thermal conductivity of the metal is uniform.
- The plate is sufficiently thin (no heat flow in z-axis).
- The temperature distribution is in a steady state.  
  If not, eigenvalues and eigenfunctions are used to model transient states. And they are not covered in this module.

The model in Cartesian coordinates:

```math
\frac{\partial^2 T}{\partial x^2} + \frac{\partial^2 T}{\partial y^2} = 0
```

The final solution in Cartesian coordinates:

```math
T(x,y)=\sum_{n=1}^\infty A_n \sin\left(\frac{n\pi x}{a}\right)
\sinh\left(\frac{n\pi y}{a}\right).
```

With $BC\theta(x,b)=100$, Fourier sine series gives constants.

The model in polar coordinates:

```math
r^2 \frac{\partial^2 T}{\partial r^2} + r\frac{\partial T}{\partial r} + \frac{\partial^2 T}{\partial \theta^2} = 0
```

Here:

- $T$ - temperature
- $x,y$ - spatial coordinates
- $r, \theta$ - polar coordinates

Temperatures of the edges of the plate are the boundary conditions.

### One Dimensional Heat Flow

Laws of heat flows:

- The amount of heat in a body is proportional to its mass and temperature.
- The rate of heat flow through a plane surface is proportional to the area and the rate of change of temperature with respect to the perpendicular distance.

```math
\frac{\partial^2 T}{\partial x^2}=\frac1k\frac{\partial T}{\partial t}
```

Here $k \gt 0$.

Boundary conditions:

- $T(0,t)=0$
- $T(l,t)=0$
- $T(x,0)=f(x)$

General solution:

```math
T(x,t)=\sum_{r=1}^\infty
B_r \sin\left(\frac{r\pi x}{l}\right)
\exp \left(\frac{r^2\pi^2 k t}{l^2} \right)
```

```math
B_r=\frac{2}{l}\int_0^l f(x)\sin\left(\frac{r\pi x}{l}\right)\,\text{d}x
```

### Heat 

### One-Dimensional Wave Equation

```math
\frac{\partial^2 y}{\partial t^2}=c^2\frac{\partial^2 y}{\partial x^2}
```

Boundary conditions:

- $y(0,t)=0$
- $y(L,t)=0$
- $y(x,0)=f(x)$
- $y_t(x,0)=0$

```math
y(x,t)=\sum_{n=1}^\infty A_n
\sin\left(\frac{n\pi x}{L}\right)
\cos\left(\frac{n\pi c t}{L}\right)
```

```math
A_n=\frac{2}{L}\int_0^L f(x)\sin\left(\frac{n\pi x}{L}\right)\,dx
```
