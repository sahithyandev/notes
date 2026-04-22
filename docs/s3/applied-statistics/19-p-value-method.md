---
title: P-Value Method
sidebar:
  order: 19
slug: s3/applied-statistics/p-value-method
prev: true
next: true
dateCreated: 2026-04-22T07:09:10.681Z
lastUpdatedOn: 2026-04-22T07:15:36.786Z
---

An alternative to the critical value method.

Suitable test statistic is calculated. The probability of observing a test statistic as extreme as or more extreme than the one calculated from the sample data, assuming $H_0$ is true. If the probability is less than $\alpha$, reject $H_0$.


Reject $H_0$ **if** the p-value is less than $\alpha$.

## For Two-Tailed Tests

When:

- $H_0$: $\mu = \mu_0$
- $H_1$: $\mu \neq \mu_0$

P-value is equal to $2 \times P(Z \gt \left\lvert z \right\rvert)$.

## For Right-Tailed Tests

When:

- $H_0$: $\mu \leq \mu_0$
- $H_1$: $\mu \gt \mu_0$

P-value is equal to $P(Z \gt z)$.

## For Left-Tailed Tests

When:

- $H_0$: $\mu \geq \mu_0$
- $H_1$: $\mu \lt \mu_0$

P-value is equal to $P(Z \lt -z)$.
