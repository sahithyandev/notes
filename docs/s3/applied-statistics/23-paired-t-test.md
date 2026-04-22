---
title: Paired t-Test
sidebar:
  order: 23
slug: s3/applied-statistics/paired-t-test
prev: true
next: true
dateCreated: 2026-04-22T07:09:10.682Z
lastUpdatedOn: 2026-04-22T07:15:36.786Z
---

Used when two related measurements are taken on the same sample population. Evaluates whether the mean difference between the paired observations is significantly different.

Let each pair have values $(X_1, X_2)$. Suppose $d_i = X_{1i} - X_{2i}$.

```math
\bar{d} = \frac{1}{n} \sum_{i=1}^{n} d_i
\quad \text{and} \quad
s_d = \sqrt{\frac{\sum (d_i - \bar{d})^2}{n - 1}}
```

### Hypotheses Setup

```math
H_0 : \mu_d = d_0
\,\,
\text{(no mean difference)}
```

```math
H_1 : \mu_d < d_0 \text{ or } \mu_d > d_0 \text{ or } \mu_d \ne d_0
```

## Test Statistic

Under $H_0$ with $\nu = n - 1$:

```math
t = \frac{\bar{d} - d_0}{s_d / \sqrt{n}} \sim t_\nu
```
