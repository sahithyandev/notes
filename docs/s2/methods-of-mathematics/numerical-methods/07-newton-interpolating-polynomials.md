---
title: Newton's Interpolating Polynomials
sidebar:
  order: 7
slug: methods-of-mathematics/numerical-methods/newton-interpolating-polynomials
prev: true
next: true
---

Suppose that $P_n (x)$ is the $n$-th interpolating polynomial that agrees with the function $f$ at
the distinct numbers $x_0, x_1,\dots,x_n$. $P_n$ has the form:

```math
P_n (x) = a_0 + a_1(x − x_0) + a_2(x − x_0)(x − x_1) + \dots + a_n(x − x_0)\dots(x-x_{n-1})
```

for appropriate constants $a_0, a_1,\dots,a_n$. The constants can be found by setting $x$ to the known data points $x_0,x_1,\dots,x_n$.

## Divided-difference notation

Divided differences are defined with respect to a set of distinct numbers.


### Zeroth divided difference

```math
f[x_i] = f (x_i)
```

### First divided difference

```math
f[x_i,x_{i+1}] = \frac{f(x_{i+1}) - f(x_i)}{x_{i+1} - x_i}
```

### Second divided difference

```math
f[x_i,x_{i+1},x_{i+2}] =
\frac{f[x_{i+1} , x_{i+2}] − f [x_i,x_{i+1}]}{x_{i+2} − x_i}
```

### k-th divided difference

```math
f[x_i,x_{i+1},x_{i+2},\dots,x_{i+k}] =
\frac{f[x_{i+1},x_{i+2},\dots,x_{i+k}]−f [x_i,x_{i+1},x_{i+2},\dots,x_{i+k−1}]}
{x_{i+k} − x_i}
```

:::note

```math
a_k = f[x_0,x_1,\dots,x_k]
```

:::

Now $P_n(x)$ can be rewritten in a form called Newton’s Divided Difference: $ $

```math
P_n(x)=f[x_0] +
\sum_{k=1}^n
f[x_0,x_1,\dots,x_k](x−x_0)(x−x_1)\dots(x − x_{k−1})
```
