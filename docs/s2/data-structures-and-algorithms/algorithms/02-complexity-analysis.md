---
title: Complexity Analysis
sidebar:
  order: 2
slug: data-structures-and-algorithms/algorithms/complexity-analysis
prev: true
next: true
---

A way of comparing different algorithms. Algorithms' time to run is hard to
measure exactly and hard to compare with fairness. And also there are too many
uncontrollable variables in measuring the actual time. Because of that, the
algorithms are analyzed asymptotically: a way of measuring the performance of an
algorithm without depending on hardware.

### Cons of complexity analysis

- The algorithm might not reach the limit after which the asymptotic behaviour
  is seen  
  Different algorithms can be used for different input ranges
- The input density and input size might not be uniform  
  Usually assumed to be uniform and is considered good enough. Experimentation
  is required for more precise approximation.
- Not all functions (such as periodic, oscillating functions) can be compared

## Asymptotic notation

A method used to categorize functions or to calculate upper/lower bounds with
respect to the growth rate of functions. In this context, total number of steps
followed by a specific algorithm is expressed in terms of its input size $n$,
then asymptotic analysis can be done. $ $

### Time complexity

Analysis of how the running time of the algorithm grows with various input
sizes.

Instead of measuring the running time of the algorithm for specific inputs, how
the running time increases with the increasing input size.

### Space complexity

Analysis of additional space required for an algorithm to run.

## Asymptotic functions

There are more than one asymptotic notations. All these are sets of functions.

Suppose $f,g$ are 2 functions of $n$. $ $

### Big-O

$f(n) \in O(g(n))$ **iff**
$\exists\, c \gt 0 \land  n_0 \in \mathbb{N}\;\; \text{s.t}$:

```math
\forall n \ge n_0,\; f(n) \le c* g(n)
```

An asymptotic upper bound.

### Big-Omega

$f(n) \in \Omega(g(n))$ **iff**
$\exists\, c \gt 0 \land  n_0 \in \mathbb{N}\;\; \text{s.t}$:

```math
\forall n \ge n_0,\; f(n) \ge c* g(n)
```

An asymptotic lower bound.

### Big-Theta

$f(n) \in \Theta(g(n))$ **iff**
$\exists\, c_1, c_2 \gt 0 \land  n_0 \in \mathbb{N}\;\; \text{s.t}$:

```math
\forall n \ge n_0,\; c_1 * g(n) \le f(n) \le c_2* g(n)
```

An asymptotic equivalence. A tight characterization unlike Big-O or Big-Omega.

### Soft-O

Denoted by $\overline{O}$. Similar to Big-O but the logarithmic terms are
removed in the analysis. Not used as much as the other three. $ $

### Little-o

$f(n) \in o(g(n))$ **iff** $\forall \epsilon \gt 0,\;\exists N\;\text{s.t}$:

```math
\forall n \ge N,\;|f(n)|\le\epsilon|g(n)|
```

Strict upper bound characterization.

Implies Big-O.

```math
f(n) \in o(g(n)) \implies f(n) \in O(g(n))
```

Implies "not Big-Theta".

```math
f(n) \in o(g(n)) \implies f(n) \not\in \Theta(g(n))
```

### Little-omega

$f(n) \in \omega(g(n))$ **iff**
$\forall \epsilon \gt 0,\;\exists N\;\text{s.t}$:

```math
\forall n \ge N,\;|f(n)|\ge\epsilon|g(n)|
```

Strict lower bound characterization.

Implies Big-Omega.

```math
f(n) \in \omega(g(n)) \implies f(n) \in \Omega(g(n))
```

Implies "not Big-Theta".

```math
f(n) \in \omega(g(n)) \implies f(n) \not\in \Theta(g(n))
```

## Limit definitions

| Name         | Definition                                                |
| ------------ | --------------------------------------------------------- |
| Little-o     | $\lim_{n \to \infty}{\frac{f(n)}{g(n)}}=0$                |
| Big-O        | $\lim_{n \to \infty}{\frac{f(n)}{g(n)}} \in [0,\infty)$   |
| Big-Theta    | $\lim_{n \to \infty}{\frac{f(n)}{g(n)}}\in\mathbb{R}^{+}$ |
| Little-omega | $\lim_{n \to \infty}{\frac{f(n)}{g(n)}}\gt 0$             |
| Big-Omega    | $\lim_{n \to \infty}{\frac{f(n)}{g(n)}}=\infty$           |

## Properties of asymptotic functions

### Transitivity

**If** $f(n) = O(g(n))$ and $g(n) = O(h(n))$ **then** $f(n) = O(h(n))$. Applies
to all 5 functions.

### Reflexivity

- $f(n) = O(f(n))$
- $f(n) = \Omega(f(n))$
- $f(n) = \Theta(f(n))$

### Transpose

```math
f(n) = O(g(n))
\iff
g(n) = \Omega(f(n))
```

```math
f(n) = o(g(n))
\iff
g(n) = \omega(f(n))

```

## Relations between asymptotic notations

### Big-O & Big-Omega

```math
f(n) \in O(g(n)) \iff g(n) \in \Omega(f(n))
```

### Big-Theta => Big-O & Big-Omega

```math
f(n) \in \Theta(g(n)) \implies
f(n) \in O(g(n)) \land
f(n) \in \Omega(g(n))
```

### Big-Theta equivalence

```math
f(n) \in \Theta(g(n)) \iff g(n) \in \Theta(f(n))
```

## Real life timing

### Wall-clock time

Time elapsed from start of the process to "now" when measured by a stopwatch.

### User-cpu time

Time spent in user code.

### System-cpu time

Time spent in kernel code.
