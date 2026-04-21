---
title: Surfaces
sidebar:
  order: 2
slug: methods-of-mathematics/multivariable-calculus/surfaces
prev: true
next: true
---

Graph of the set of all points such that $(x,y,f(x,y)) \in \mathbb{R}^3$ where
$f:\mathbb{R}^2 \rightarrow \mathbb{R}$. Can be plotted on a 3D space.

### Half-space

One side of a plane.

### Linear function

Function of the below form.

```math
f(x,y) = ax + by + c
```

Plot of a linear function is a plane surfaces.

### Level curves

Aka. contours. Suppose $f: \mathbb{R}^{2} \rightarrow \mathbb{R}$. The level curves of $f$ are
the graphs $f(x,y)=k$ where $k$ is a constant. Aka. level sets.

## Common shapes of functions

I have created a visualization of all these common shapes in [Geogebra](https://www.geogebra.org/calculator/nhxratj5). Use that as an aid when learning about these shapes.

### Parabolic cylinder

A parabola shifted along a straight line. In the form:

```math
z=x^2
```

Only 2 variables are related.

### Ellipsoid

A surface in which all of its traces are ellipses.

```math
\frac{x^2}{a^2} + \frac{y^2}{b^2} + \frac{z^2}{c^2} = 1
```

Goes through $(a,0,0),(-a,0,0),(0,b,0)$ and so on. Becomes a sphere when
$a=b=c$.

### Cone

```math
\frac{z^2}{c^2} = \frac{x^2}{a^2} + \frac{y^2}{b^2}
```

Horizontal traces are ellipses. Vertical traces in $x=k$ or $y=k$ are:

- Hyperbolas if $k\neq 0$
- Pair of lines if $k=0$

### Elliptic paraboloid

```math
\frac{z}{c} = \frac{x^2}{a^2} + \frac{y^2}{b^2}
```

Horizontal traces are ellipses. Vertical traces are parabolas. The variable
raised to first power ($z$ in the example), indicates the axis of the
paraboloid. $ $

### Hyperboloic Paraboloid

```math
\frac{z}{c} = \frac{x^2}{a^2} - \frac{y^2}{b^2}
```

Horizontal traces are hyperbolas. Vertical traces are parabolas.

### Hyperboloid of One Sheet

```math
\frac{x^2}{a^2} + \frac{y^2}{b^2} - \frac{z^2}{c^2} = 1
```

Horizontal traces are ellipses. Vertical traces are hyperbolas. Variable with
the negative coefficient denotes the axis of symmetry.

### Hyperboloid of Two Sheets

```math
\frac{x^2}{a^2} + \frac{y^2}{b^2} - \frac{z^2}{c^2} = -1
```

Horizontal traces are ellipses for $z=k$ where $k \not\in [-c,c]$. Vertical
traces are hyperbolas. Variable with the positive coefficient denotes the axis
of symmetry.

:::note

Equations of the below form:

```math
\frac{x^2}{a^2} + \frac{y^2}{b^2} - \frac{z^2}{c^2} = k
```

Yields:

- Cone when $k=0$
- Hyperboloid of 1 sheet when $k\gt 0$
- Hyperboloid of 2 sheets when $k\lt 0$

:::
