---
title: Central Limit Theorem
sidebar:
  order: 9
slug: methods-of-mathematics/statistics/central-limit-theorem
prev: true
next: false
---

## Definition

The probability distribution of a sample statistic will be normal or nearly normal, regardless of the population distribution, given the sample size is
_large enough_.

Generally, sample size of 30 is considered _large enough_.

Suppose $n$ random sample observations are taken from an infinite population, with $E(X) = \mu$ and $Var(X) = \sigma^2$. The sampling distribution of "the mean of $X$" (say $\bar x$) can be specified as:

```math
\bar{x} \sim N\left(\mu, \frac{\sigma^2}{n}\right)
```

## Conditions

- Sample size is large enough: $n \geq 30$.
- Sampling is random and independent.
- Population has finite variance.
