---
title: Discrete Distribution
sidebar:
  order: 3
slug: methods-of-mathematics/statistics/discrete-distribution
prev: true
next: true
---

For all the definition below:
- $N$ is the population size.
- $n$ is the sample size.

## Parameters

### Mean

Average of the all values in the entire population. Usually unknown. Denoted by $\mu$. $ $

```math
\mu = \frac{1}{N} \sum_{i=1}^N x_i
```

### Variance

Measure of the spread of the observed values. Denoted by $\sigma^2$. $ $

```math
\sigma^2 = \frac{1}{N} \sum_{i=1}^N (x_i - \mu)^2
```

### Standard Deviation

Square root of the variance. Denoted by $\sigma$. $ $

### Skewness

```math
\gamma_1 = \frac{\mathbb{E}[(X - \mu)^3]}{\sigma^3}
```

### Kurtosis

```math
K=\frac{\mathbb{E}\left[ (X-\mu)^4 \right]}{\sigma^4}
```

## Sample Parameters

### Sample mean

Average of the observed values. Denoted by $\bar{x}$. $ $

```math
\bar{x} = \frac{1}{n} \sum_{i=1}^n x_i
```

### Sample variance

Denoted by $s^2$. $ $

```math
s^2 = \frac{1}{n-1} \sum_{i=1}^n (x_i - \bar{x})^2
```

Here sample mean $\bar{x}$ is used instead of $\mu$, which underestimates the variance. $n-1$ is used instead of $n$ to correct this bias, which is called Bessel's correction. This correction makes it an unbiased estimator.

### Sample covariance

```math
\mathrm{cov}(X, Y) = \frac{1}{n-1} \sum_{i=1}^n (x_i - \bar{x})(y_i - \bar{y})
```

### Sample skewness
```math
g_1 = \frac{n}{(n-1)(n-2)} \sum_{i=1}^n \left(\frac{x_i - \bar{x}}{s}\right)^3
```
