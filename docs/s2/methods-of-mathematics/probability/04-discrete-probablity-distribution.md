---
title: Discrete Probability Distribution
sidebar:
  order: 4
slug: methods-of-mathematics/probability/discrete-probablity-distribution
prev: true
next: true
---

### Probability Mass Function

Denoted by $P$. Gives the probability that a discrete random variable $X$ is exactly equal to some value $x$.

```math
\sum_{x} P(x) = 1
```

## Parameters

### Mean

```math
E(X) = \mu = \sum_{i} x_i \cdot P(X = x_i)
```

Here:
- $x_i$ represents each possible value of $X$
- $P(X = x_i)$ is the probability of observing that value

### Variance

```math
\text{Var}(X) = \sigma^2 = \sum_{i} (x_i - \mu)^2 \cdot P(X = x_i)
```

An equivalent computational formula is:

```math
\text{Var}(X) = \sum_{i} x_i^2 \cdot P(X = x_i) - \mu^2
```

### Cumulative Distribution Function

```math
F(x) = \sum_{t \leq x} P(X = t)
```

```math
F(x) = F(\lfloor x \rfloor)\;\;\text{for } x \in \mathbb{Z}^{c}
```

## Example

Consider a discrete random variable $X$ with the following probability distribution: $ $

| X | P(X) |
|---|------|
| 1 | 0.2  |
| 2 | 0.3  |
| 3 | 0.4  |
| 4 | 0.1  |

The mean would be: $E(X) = 1 \cdot 0.2 + 2 \cdot 0.3 + 3 \cdot 0.4 + 4 \cdot 0.1 = 2.4$. $ $

The variance would be: $\text{Var}(X) = (1-2.4)^2 \cdot 0.2 + (2-2.4)^2 \cdot 0.3 + (3-2.4)^2 \cdot 0.4 + (4-2.4)^2 \cdot 0.1 = 0.84$. $ $

## Types

### Uniform distribution

A type of discrete probability distribution where all outcomes are equally likely. If a random variable $X$ can take $n$ distinct values, each value has a probability of $P(X = x) = \frac{1}{n}$.

### Bernoulli distribution

A type of discrete probability distribution where there are only two possible outcomes, often referred to as "success" and "failure". If a random variable $X$ can take values 0 or 1, with $P(X = 1) = p$ and $P(X = 0) = 1 - p$, then $X$ follows a Bernoulli distribution.

PMF of Bernoulli distribution:

```math
P(x) = p^x (1-p)^{1-x} \;\;;\; x = 0\;\text{or}\;1
```

Here:
- $p$ is the probability of success

### Binomial distribution

When an experiment consists of $n$ independent repeated Bernoulli trials, the experiment is said to be a binomial experiment. The number of successes ($X$) follows a binomial distribution. And has a PMF:

```math
P(X) = \binom{n}{x} p^x (1-p)^{n-x}\;\;;\; x = 0, 1, \ldots, n
```

Here:
- $n$ is the number of trials.
- $\theta$ is the probability of success.

Assumptions made in binomial distribution:
- Each trial is independent.
- Each trial has only two possible outcomes.
- The probability of success is constant across trials.
- The number of trials is fixed.

For a large sample of a binomial distribution:

```math
\mu = np
\;\;
\land
\;\;
\sigma = \sqrt{np(1-p)}
```

### Poisson distribution

If $X$ is the number of independent successes occur
within a fixed time interval, then $X$ is said to follow a
Poisson distribution. And has a PMF:

```math
P(x) = \frac{e^{-\lambda} \lambda^x}{x!}\;\;;\; x=0,1,2,\ldots
```

Here:
- $\lambda$ - average number of successes occurred within the
fixed time interval

```math
\text{E}(X) = \lambda = \text{Var}(X)
```

**If** $X_i \sim \text{Poisson}(\lambda_i)$ where $i = 1, 2, \ldots, n$, and $X_i$ is independent **then**:

```math
\sum_{i=1}^n X_i
\sim
\text{Poisson}\bigg(
\sum_{i=1}^n \lambda_i
\bigg)
```
