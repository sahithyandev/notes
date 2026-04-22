---
title: Convolution
sidebar:
  order: 6
slug: s3/differential-equations/convolution
prev: true
next: true
dateCreated: 2026-04-22T07:09:10.701Z
lastUpdatedOn: 2026-04-22T07:15:36.797Z
---

A mathematical operation that combines two functions to produce a third function expressing how the shape of one is modified by the other. Denoted by a star symbol $ * $. $ $

```math
(f * g)(t) = \int_{-\infty}^{\infty} f(\tau) \, g(t - \tau) \, d\tau
```

The convolution essentially "slides" one function over another, multiplying and integrating to produce a new function that reflects the combined effect of both.

Widely used in signal processing, probability, and many areas of mathematics and engineering.

## Properties

### Commutative

```math
f * g = g * f
```

## Convolution Theorem

Product of Laplace transforms of two functions is the Laplace transform of their convolution.

Suppose $L\{f\}=F$ and $L\{g\}=G$:

```math
L\{f*g\}=F(s)G(s)
```
