---
title: Double Integrals
sidebar:
  order: 18
slug: methods-of-mathematics/multivariable-calculus/double-integrals
prev: true
next: true
---

Suppose $f$ is defined on $R = [a,b] \times [c,d]$.

The double integral of $f$ over $R$ is defined as:

```math
\iint_R f(x,y) = \lim_{m,n \to \infty} \sum_{i=1}^m \sum_{j=1}^n f(x_{ij}^{*},y_{ij}^*) \Delta x \Delta y
```

if the limit exists.

## Properties

```math
\iint_D (f + g)\,\text{d}A =
\iint_D f\,\text{d}A +
\iint_D g\,\text{d}A
```

```math
\iint_D cf\,\text{d}A =
c\left(\iint_D f\,\text{d}A\right)
```

If $f \ge g$ on all points of $D$:

```math
\iint_D f\,\text{d}A \ge
\iint_D g\,\text{d}A
```

If $D$ is the union of non-overlapping regions $D_1$ and $D_2$:

```math
\iint_D f\,\text{d}A =
\iint_{D_1} f\,\text{d}A +
\iint_{D_2} f\,\text{d}A
```

### Change of variables

**Suppose** that $T$ is a $C^1$ transformation whose Jacobian is nonzero and that it maps a region
$S$ in the $uv$− plane onto a region $R$ in the $xy$−plane. and that $f$ is continuous on $R$ and that $R$ and $S$ are type I or type II planar regions. And also that $T$ is one-to-one, except perhaps on the boundary of $S$. **Then**:

```math
\iint_R f(x,y)\,\text{d}A =
\iint_S f\big(x(u,v), y(u,v)\big) \left|\frac{\partial(x, y)}{\partial(u, v)}\right|\,\text{d}A
```

### Derivative under double integral

Suppose $f$ be a function with continuous second partial derivatives on a rectangular
domain $R$ with vertices $(x_1, y_1),(x_1, y_2),(x_2, y_2)$ and $(x_2, y_1)$, where $x_1 < x_2$ and
$y_1 < y_2$.

```math
\iint_R f_{xy} \,\text{d}A = f(x_1, y_1) - f(x_2, y_1) + f(x_2, y_2) - f(x_1, y_2)
```

## Fubini's Theorem

**If** $f$ is continuous on $R = [a,b] \times [c,d]$, then:

```math
\iint_R f(x,y)\,\text{d}A =
\int_a^b \int_c^d f(x,y)\;\text{d}y\,\text{d}x =
\int_c^d \int_a^b f(x,y)\;\text{d}x\,\text{d}y
```

More generally, this is true if we assume that f is bounded on R, f is discontinuous only on a finite number of
smooth curves, and the iterated integrals exist.

:::note[Separable function]

**If** $f$ can be factored as $g(x)h(y)$ **then**:

```math
\iint_R f(x,y)\,\text{d}A =\int_a^b g(x)\,\text{d}x \int_c^d h(y)\,\text{d}y
```

:::

## Non-recatangular regions

$f$ is continuous and $D$ lies between two continuous functions of $x$.

Suppose $D = [a,b] \times [g_1(x), g_2(x)]$. $ $

```math
\iint_D f(x,y)\,\text{d}A =\int_a^b \int_{g_1(x)}^{g_2(x)} f(x,y)\;\text{d}y\,\text{d}x
```

Similarily it can be extended when two continuous functions of $y$ are given. $ $

## In Polar Coordinates

$f$ is continuous and $D$ lies between two continuous functions of $r$.

Suppose $D = [a,b] \times [g_1(r), g_2(r)]$. $ $

```math
\iint_D f(x,y)\,\text{d}A =\int_a^b \int_{g_1(r)}^{g_2(r)} f(r,\theta)\;\text{d}r\,\text{d}\theta
```

### Common Shapes

All the common shapes in polar coordinates are explained below. They are defined in $\cos$. The same version can be adapted for $\sin$.

#### Archimedes' Spiral

```math
r=\theta
```

Gradually spirals outwards from $(0,0)$ to $(0, 2\pi)$.

#### Circle

```math
r=a\cos\theta
```

Center point is $(a/2,0)$. Radius is $a$.

#### Cardioid

$a\neq 0$. $ $

```math
r=a+b\cos\theta
```

Goes through $(b+a,0)$ and $(b-a,0)$.

| Shape              | When             |
| ------------------ | ---------------- |
| Cardioid           | $a=b$            |
| One-loop Limacon   | $b \lt a \lt 2b$ |
| Inner-loop Limacon | $a \lt b$         |

#### Lemniscate

Suppose $a\neq 0$. $ $

```math
r^2 = a^2 \cos(2\theta)
```

Resembles the infinity symbol. Center point is $(0,0)$. Width $2a$. Height $\frac{b}{\sqrt{2}}$.

#### Rose

```math
r = a \cos (n\theta)
```

| n    | Number of petals |
| ---- | ---------------- |
| odd  | $n$              |
| even | $2n$             |

All the above-mentioned functions are visualized on [Common Polar Functions - Geogebra](https://www.geogebra.org/graphing/x4ykj7hk).

### Definition in Polar Coordinates

```math
\iint_R f(x,y)\,\text{d}A_{xy}=
\iint_R f(r \cos\theta, r \sin\theta)r \,\text{d}A_{r\theta}=
\int_{\theta=\alpha}^\beta \int_{r=a}^{b} f(r\cos\theta,r\sin\theta)\;\text{d}r\,\text{d}\theta
```

:::note

Volume of a polar rectangle is given by:

```math
V = \lim_{m,n\to \infty}
\sum_{i=1}^m 
\sum_{j=1}^n
f(r^*_ij \cos\theta^*_{ij}, r^*_{ij} \sin \theta^*_{ij})
r^*_{ij}
\Delta r \Delta \theta
```

:::

$f$ is continuous on a polar region $D$ which lies in $[\alpha,\beta]\times[h_1(\theta),h_2(\theta)]$.

```math
\iint_D f(x,y)\,\text{d}A =\int_a^b \int_{g_1(x)}^{g_2(x)} f(x,y)\;\text{d}y\,\text{d}x
```
