---
title: Counting Outcomes
sidebar:
  order: 2
slug: methods-of-mathematics/probability/counting-outcomes
prev: true
next: true
---

### Combination

A selection of a set of objects, regardless of the selection order.

### Permutation

A linear arrangement of a set of objects, with regard to the order of the arrangement.

### Circular Permutation

A circular arrangement of a set of objects, with regard to the order of the arrangement. Unlike linear arrangements, circular permutations do not have a fixed starting point.

## Rule 1

Suppose there is an experiment consisting of $k$ number of steps. And $i$-th
step having $n_i$ number of outcomes.

```math
\text{Total number of outcomes} = \prod_{i=1}^k {n_i}
```

## Rule 2

Total number of combinations of $n$ objects taken $r$ at a time is:

```math
^nC_r = \frac{n!}{(n-r)!\; r!}
```

## Rule 3

The number of permutations of $n$ objects taken $r$ at a time is:

```math
^nP_r = \frac{n!}{(n-r)!}
```

## Rule 4

The number of circular permutations of $r$ objects taken from a group of $n$
objects:

```math
\frac{^nP_r}{r} = {}^nC_r \times (r-1)!
```

Total number of linear permutations are divided by $r$, the number of objects being arranged, to eliminate equivalent rotations. $ $ 

Alternatively, it can be expressed as the product of the number of combinations, ${}^nC_r$, and the factorial of $(r-1)$, which represents the number of ways to arrange the remaining objects after fixing one as a reference point.

## Rule 5

Suppose a multi-set $M$ contains $n$ items of $k$ different types. There are
$r_i$ number of type $i$ objects. Total number of distinct permutations:

```math
\frac{n!}{\prod_{i=1}^k {r_i!}}
```

## Rule 6

Suppose a multi-set $M$ contains $n$ items of $k$ different types. There are
$r_i$ number of type $i$ objects. Total number of distinct combinations (of all sizes):

```math
\prod_{i=1}^k (r_i + 1)
```

This includes an empty set as well.
