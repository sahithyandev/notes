---
title: Unit Step Function
sidebar:
  order: 2
slug: s3/differential-equations/unit-step-function
prev: true
next: true
dateCreated: 2026-04-22T07:09:10.701Z
lastUpdatedOn: 2026-04-22T07:15:36.797Z
---

```math
u(t)=\begin{cases}
0, & t<0\\
1, & t\ge 0
\end{cases}
```

## Expressing Piecewise Functions

Consider:

```math
f(t)=
\begin{cases}
f_1(t), & a_1 \le t < a_2\\
f_2(t), & a_2 \le t < a_3\\
\vdots
\end{cases}
```

$f(t)$ can be expressed using unit step functions as:

```math
f(t) = \sum f_i(t)\,\big[u(t-a_i) - u(t-a_{i+1})\big]
```

$[u(t-a_i) - u(t-a_{i+1})]$ is called a _window_. Each window ensures the function is active only inside the correct interval.
