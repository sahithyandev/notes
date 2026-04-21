---
title: Continuous Probability Distribution
sidebar:
  order: 5
slug: methods-of-mathematics/probability/continuous-probablity-distribution
prev: true
next: true
---

Describes a continuous random variable.

### Probability Density Function

Denoted by $f$. Does not give the probability at an exact point (which is always 0 for continuous variables). Instead, gives the relative likelihood of the random variable taking on a value in a small interval around a point. $ $

The probability of an event is the integral of the PDF over the region corresponding to the event:

```math
P(a \leq X \leq b) = \int_{a}^{b} f(x) dx
```

Probability of all the values combined, is 1:

```math
\int_{-\infty}^{\infty} f(x)\; \text{d}x = 1
```

:::note
**If** $X$ follows a standard normal distribution, **then** its PDF is: $ $

```math
f(x) = \frac{1}{\sqrt{2\pi}}\exp\bigg(-\frac{x^2}{2}\bigg)
```

:::

### Mean

The integral is taken over the entire domain of the random variable

```math
E(X) = \mu = \int_{-\infty}^{\infty} x \cdot f(x) \, dx
```

Here $f(x)$ is the probability density function. $ $

### Variance

```math
\text{Var}(X) = \sigma^2 = \int_{-\infty}^{\infty} (x - \mu)^2 \cdot f(x) \, dx
```

An equivalent computational formula is:

```math
\text{Var}(X) = \int_{-\infty}^{\infty} x^2 \cdot f(x) \, dx - \mu^2
```

### Covariance

```math
\text{Cov}(X,Y) = E(XY) - E(X)E(Y)
```

### Cumulative Distribution Function

```math
F(x) = \int_{-\infty}^{x} f(t) dt
```

## Example

Consider a continuous random variable $X$ that follows a uniform distribution over the interval [0, 4], with probability density function: $ $

```math
f(x) = \begin{cases}
0.25 & \text{for } 0 \leq x \leq 4 \\
0 & \text{otherwise}
\end{cases}
```

The mean would be: $E(X) = \int_{0}^{4} x \cdot \frac{1}{4} \, dx = \frac{1}{4} \cdot \frac{x^2}{2} \bigg|_{0}^{4} = \frac{1}{4} \cdot \frac{16}{2} = 2$. $ $

The variance would be: $\text{Var}(X) = \int_{0}^{4} (x-2)^2 \cdot \frac{1}{4} \, dx = \frac{1}{4} \cdot \frac{16}{12} = \frac{4}{3} \approx 1.33$. $ $

## Types

### Uniform Distribution

A type of continuous probability distribution where all outcomes are equally likely within a specified range. Has the PDF:

```math
f(x) = \begin{cases}
\frac{1}{b-a} & \text{for } a \leq x \leq b \\
0 & \text{otherwise}
\end{cases}
```

The mean, variance and CDF are:

```math
E(X) = \mu = \frac{a + b}{2}
```

```math
\text{Var}(X) = \sigma^2 = \frac{(b-a)^2}{12}
```

```math
F(x) = \begin{cases}
0 & \text{for } x < a \\
\frac{x-a}{b-a} & \text{for } a \leq x \leq b \\
1 & \text{for } x > b
\end{cases}
```

### Normal distribution

Describes data that clusters around a mean value, forming a symmetric bell-shaped curve. Denoted by $N(\mu, \sigma^2)$. Has PDF: $ $

```math
f(x) = \frac{1}{\sigma \sqrt{2\pi}} \exp{\left(-\frac{(x-\mu)^2}{2\sigma^2}\right)}
```

Follows [the empirical rule](/methods-of-mathematics/probability-and-statistics/empirical-rule/).

It’s often used to model real-world phenomena like heights, test scores, or measurement errors, where most values are near the mean, and fewer occur as you move away from it.

:::note

**If** $Y \sim N(\mu, \sigma^2)$ **then** $Y^2 \sim N(\mu^2 + \sigma^2, \sigma^2)$

:::

### Standard normal distribution

A special case of the normal distribution where $\mu=0$ and $\sigma= 1$. Denoted by $N(0, 1)$. Has PDF:

```math
f(x) = \frac{1}{\sqrt{2\pi}} \exp{\left(-\frac{x^2}{2}\right)}
```

:::note

Z-score equation is used to standardize a normal distribution.

```math
Z = \frac{X - \mu}{\sigma}
```

:::

### Chi-square Distribution

Distribution of the sum of the squares of $k$ independent standard normal random variables, where $k$ is the degrees of freedom. Has the PDF:

```math
f(x; k) = \frac{1}{2^{k/2} \Gamma(k/2)} x^{k/2 - 1} e^{-x/2}, \quad x > 0
```

Here:
- $k$ is the degrees of freedom
- $\Gamma$ is the [gamma function](https://s1.sahithyan.dev/mathematics/riemann-integration/gamma-function/)

Used in tests like the Chi-square goodness-of-fit test and tests for independence in contingency tables.

### Student's t-distribution

A more conservative form of the standard normal distribution. Has heavier tails than the standard normal distribution.
Denoted by $X \sim t(v)$. Here the parameter $v$ is the degrees of freedom, and is often $v=n-1$. Gets close to standard normal distribution as $v \to \infty$. Centered at zero.

For a Student's t-distribution, with $v \gt 2$: $ $

```math
\text{Var}(X) = \frac{v}{v-2}
```

Used when:
- Sample size is small: $n < 30$
- Population standard deviation is unknown

:::note

```math
t= \frac{\bar x - \mu}{s / \sqrt{n}} \sim t(n-1)
```

:::

### Noncentral t-distribution

A generalization of the Student's t-distribution. Denoted as $X \sim t(v,\delta)$. Centered at $\delta$.
