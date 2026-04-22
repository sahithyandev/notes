---
title: Sampling Distribution of Proportion
sidebar:
  order: 12
slug: s3/applied-statistics/sampling-distribution-of-proportion
prev: true
next: true
dateCreated: 2026-04-22T07:09:10.681Z
lastUpdatedOn: 2026-04-22T07:15:36.785Z
---

Assume a population of size $N$ with a known proportion of successes $p$.

By drawing all possible samples of size $n$ and calculating their sample proportions $\overline{p}_i$, the sampling distribution of the success proportion can be computed.


:::note

Distribution of proportions can be modelled using a binomial distribution. 

:::

### Mean

Average of all sample proportions $\overline{p}_i$, denoted as $\overline{p}$, is $p$.

### Standard Error

```math
\sigma_p = \sqrt{\frac{p(1-p)}{n}}
```

## Approx. to Normal Distribution

**If** the below conditions are met:
- The sample size is large enough.
- The population proportion is known.

**Then**:
```math
\overline{p} \sim N \left(p,\frac{p(1-q)}{n} \right)
```
