---
title: Laws
sidebar:
  order: 3
slug: methods-of-mathematics/probability/laws
prev: true
next: true
---

## Addition Law

```math
P(A \cup B) = P(A) + P(B) - P(A \cap B)
```

## Bayes' Theorem

Suppose $A$ and $B$ are two events.

```math
P(B|A) = \frac{P(A|B) \times P(B)}{P(A)}
```

Can only be applied when:

- The sample space is partitioned into a set of mutually exclusive events:
  $\set{A_1,A_2,\dots,A_n}$.
- $\exists B \subset S \text{ s.t. } P(B) \gt 0$
- $P(A_k|B)$ is to be calculated
- At least one of the two sets of possibilities should be given:
  - $\forall A_k\;\;P(A_k \cap B)$
  - $\forall A_k\;\;P(A_k)$ and $ P(B|A_k)$

## Multiplication theorem

```math
P(A \cap B)=P(B|A) \times P(A) 
```

```math
P(A \cap B \cap C)=P(C\; | \;(A \cap B))\times P(A\cap B)
```

## Law of total probability

Relates marginal probablities to conditiional probablities.

Suppose the sample space is partitioned into a countably infinite set of
mutually exclusive events: $\set{A_1,A_2,\dots}$. Then, for an event $B$:

```math
P(B) = \sum_{i=1} {P(B\;|\;A_i)\times P(A_i)}
```

## Joint Probability

Probability of 2 or more events occuring simultaneously.

:::note

```math
\text{Conditional probability} = \frac{\text{Joint probability of A and B}}{\text{Marginal probability of B}}
```

:::

For discrete random variables, the marginal probability can be calculated by summing over the joint probability distribution:

```math
P(X = x) = \sum_y P(X = x, Y = y)
```

For continuous random variables:

```math
P_X(x) = \int_{-\infty}^{\infty} P_{X,Y}(x,y)\,\text{d}y
```
