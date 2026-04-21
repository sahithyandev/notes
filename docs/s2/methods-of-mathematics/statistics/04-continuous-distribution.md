---
title: Continuous Distribution
sidebar:
  order: 4
slug: methods-of-mathematics/statistics/continuous-distribution
prev: true
next: true
---

A model used to describe data that can take any value within a range, often with decimal precision.

## Population parameters

### Mean

```math
\mu = \int_{-\infty}^{\infty} x f(x) \, dx
```

### Variance

```math
\sigma^2 = \int_{-\infty}^{\infty} (x - \mu)^2 f(x) \, dx
```

### Covariance

```math
\mathrm{Cov}(X, Y) = \int_{-\infty}^\infty \int_{-\infty}^\infty (x - \mu_X)(y - \mu_Y) f(x,y) \, \text{d}x \, \text{d}y
```

### Skewness

```math
\gamma_1 = \frac{1}{\sigma^3} \int_{-\infty}^\infty (x - \mu)^3 f(x) \, dx
```

## Sample statistics

The collected data points from a continuous distribution are finite and discrete samples, which makes it discrete. [Sample parameters of a discrete distribution](/methods-of-mathematics/statistics/discrete-distribution/#sample-parameters) is used here.
