---
title: Joint Distribution
sidebar:
  order: 5
slug: methods-of-mathematics/statistics/joint-distribution
prev: true
next: true
---

## Parameters

### Covariance

Measure of the direction of linear relationship between 2 variables. Depends on the scale and unit of the variables.

Discrete version:
```math
\mathrm{Cov}(X, Y) = \sum_{x} \sum_{y} (x - \mu_X)(y - \mu_Y) \cdot P(X = x, Y = y)
```

Continuous version:
```math
\mathrm{Cov}(X, Y) = \int_{-\infty}^\infty \int_{-\infty}^\infty (x - \mu_X)(y - \mu_Y) f(x, y) \, dx \, dy
```

| Sign of covariance | Description                      |
| ------------------ | -------------------------------- |
| Positive           | Variables increase together      |
| Negative           | One increases as other decreases |
| Zero               | No linear relationship           |

### Correlation

Measure of strength and direction of linear relationship between 2 variables. Always in the range $[-1,1]$. $ $

```math
\rho = \frac{\mathrm{Cov}(X, Y)}{\sigma_X \sigma_Y}
```

## Sample Parameters

### Sample Covariance

```math
\mathrm{cov}(X, Y) = \frac{1}{n - 1} \sum_{i=1}^n (x_i - \bar{x})(y_i - \bar{y})
```

### Sample Correlation

```math
r = \frac{\mathrm{cov}(X, Y)}{s_X s_Y}
= \frac{\sum_{i=1}^n (x_i - \bar{x})(y_i - \bar{y})}{\sqrt{\sum_{i=1}^n (x_i - \bar{x})^2} \cdot \sqrt{\sum_{i=1}^n (y_i - \bar{y})^2}}
```
