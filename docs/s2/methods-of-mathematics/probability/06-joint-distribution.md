---
title: Joint Distribution
sidebar:
  order: 6
slug: methods-of-mathematics/probability/joint-distribution
prev: true
next: true
---

Specifies the probability of observing a combination of values for two or more random variables. Characterizes the relationship between multiple random variables, including their dependencies and correlations.

## Definition

For two random variables $X$ and $Y$, the joint probability distribution gives the probability that $X$ and $Y$ simultaneously take on specific values. This can be expressed as:

- For discrete random variables: $P(X = x, Y = y)$ or $P_{X,Y}(x, y)$
- For continuous random variables: $f_{X,Y}(x, y)$

For a joint probability distribution $P(A \cap B)$, $P(A)$ and $P(B)$ are the marginal probabilities.

### Covariance

Denoted by $\text{Cov}(X,Y)$ or $\sigma_{XY}$. Measures the linear relationship between two random variables.

```math
\mathrm{Cov}(X, Y) = \sum_{x} \sum_{y} (x - \mu_X)(y - \mu_Y) \, P(X = x, Y = y)
```

- Positive covariance: Indicates that higher than mean values of one variable tend to be
paired with higher than mean values of other variable.
- Negative covariance: Indicates that higher than mean values of one variable tend to be
paired with lower than mean values of other variable.
- If the two random variables are independent then the covariance will
be zero.

Properties:
- $\text{Cov}(X,Y) = E\Big[\big(X-E(X)\big)\big(Y-E(Y)\big)\Big]$
- $\text{Cov}(X,Y) = E(XY) - E(X)E(Y)$
- $\text{Cov}(X,a) = 0$
- $\text{Cov}(X,X) = \text{Var}(X)$
- $\text{Cov}(aX,bY) = ab\text{Cov}(X,Y)$
- $\text{Cov}(X+Y,Z) = \text{Cov}(X,Z) + \text{Cov}(Y,Z)$

### Correlation

```math
\text{Corr}(X,Y) =
\rho_{XY} =
\frac{\text{Cov}(X,Y)}{\sqrt{\text{Var}(X)\text{Var}(Y)}}
```

$\rho_{XY}$ is the Pearson correlation coefficient. $ $

### Sample correlation coefficient

Denoted by $r \in [-1,1]$. $ $

```math
r = \frac{\sum (x_i y_i) - n \bar{x} \bar{y}}{\sqrt{\left( \sum x_i^2 - n \bar{x}^2 \right) \left( \sum y_i^2 - n \bar{y}^2 \right)}}
```

## Properties

### Non-negativity

- Discrete case: $\forall x,y\;\;P(X = x, Y = y) \geq 0$
- Continuous case: $\forall x,y\;\;f_{X,Y}(x, y) \geq 0$

### Total probability equals 1

- Discrete case: $\sum_x \sum_y P(X = x, Y = y) = 1$
- Continuous case: $\int_{-\infty}^{\infty}\int_{-\infty}^{\infty} f_{X,Y}(x, y) \, dy \, dx = 1$

### Marginal distributions
The distribution of an individual variable can be derived from the joint distribution:
  - Discrete case: $P(X = x) = \sum_y P(X = x, Y = y)$
  - Continuous case: $f_X(x) = \int_{-\infty}^{\infty} f_{X,Y}(x, y) \, dy$

### Conditional distributions

The distribution of one variable given a specific value of the other:
  - Discrete case: $P(X = x | Y = y) = \frac{P(X = x, Y = y)}{P(Y = y)}$
  - Continuous case: $f_{X|Y}(x|y) = \frac{f_{X,Y}(x, y)}{f_Y(y)}$
   
### Independence

Random variables $X$ and $Y$ are independent **iff**:
  - Discrete case: $\forall x,y\;\; P(X = x, Y = y) = P(X = x) \cdot P(Y = y)$
  - Continuous case: $\forall x,y\;\; f_{X,Y}(x, y) = f_X(x) \cdot f_Y(y)$

## Representation

Joint distributions can be represented in various ways:
- For discrete variables: probability mass tables or matrices
- For continuous variables: joint density functions or contour plots
- Copulas: functions that describe the dependence structure between variables

## Types

### For Discrete Variables

For joint probability mass function, if $x,y$ are independent, $P(x,y)=P(x)P(y)$.

Cumulative probability: 
```math
P(X \le x, Y \le y) = \sum_{x}\sum_{y} P(x,y)
```

For marginal probability of $X = a$, $\sum_y P(a,y)$.

### For Continuous Variables

Suppose $f$ is the joint probability density function. The joint probability for any region $A$ lying in x-y plane is:

```math
f\big[(X,Y) \in A \big] = \int \int_A f(x,y)\; \text{d}x\text{d}y
```

The cumulative distribution function,

```math
F(a,b) = P(X \le a, Y \le b) = \int_{-\infty}^{b} \int_{-\infty}^{a} f(x,y)\; \text{d}x\text{d}y
```

For marginal probability density function of $X$, $ $

```math
g(x) = \int_{-\infty}^{\infty} f(x,y) \text{d}y
```
