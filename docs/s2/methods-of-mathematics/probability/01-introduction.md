---
title: Introduction to Probability
sidebar:
  label: Introduction
  order: 1
slug: methods-of-mathematics/probability/introduction
prev: false
next: true
---

### Statistical experiment

A process designed and conducted to obtain data
under a controlled or an uncontrolled background. The outcome depends purely on
chance.

## Experimental data

The data gathered from a statistical experiment.

### Sample Space

Set of all possible outcomes of a statistical
experiment. Denoted by $S$. $ $

### Sample Point

An element of the sample space.

### Event

A subset of the sample space.

#### Mutually Exclusive

Two events are said to be mutually exclusive **iff** they have no sample points in
common.

#### Independent

Two events are said to be independent **iff** the occurence of one does not affect
the probability of the occurence of the other.

#### Complement

Complement of the event $A$ (of $S$) is denoted by $\overline{A}$. An event
consisting of all the sample points that are in $S$ and not $A$.

#### Union

Union of two or more events, is the event containing all sample points that
belong to any one of the events.

#### Intersection

Intersection of two or more events, is the event containing all sample points
that belong to all of the events.

### Outcome

A possible result of a statistical experiment.

#### Discrete

Outcomes that can take on only specific, distinct values. For example:
- the number of students in a class
- the result of a dice roll
- the count of defective items in a batch

#### Continuous

Outcomes that can take on any value within a range. For example:
- height
- weight
- time
- temperature measurements.

For all the definitions below, consider $A, B$ as events of a sample space $S$.

## Probability of an event

```math
P(A) = \frac{n(A)}{n(S)}
```

Can be in the range $[0,1]$. $ $

:::note

**If** $A$ and $B$ are mutually exclusive events, **then** $P(A \cap B) = 0$.

:::

## Marginal probability

The probability of an event occurring without any additional information or conditions from other events. Useful when dealing with joint probability distributions and when analyzing how events relate to each other.

## Conditional probability

The probability of an event $A$ occurring, given that another event $B$ has already occurred.

```math
P(A|B) = \frac{P(A \cap B)}{P(B)}
```

Where:
- $P(A|B)$ is the conditional probability of $A$ given $B$
- $P(A \cap B)$ is the joint probability of both $A$ and $B$ occurring
- $P(B)$ is the probability of event $B$ occurring

Probability assessments can be updated when new information becomes available through conditional probability. It is particularly useful in scenarios where events are dependent on one another.

:::note
**If** events $A$ and $B$ are independent, **then** $P(A|B) = P(A)$.
:::
