---
title: Metric
sidebar:
  order: 7
slug: s4/linear-algebra/metric
prev: true
next: true
dateCreated: 2026-04-23T17:39:39.626Z
lastUpdatedOn: 2026-04-23T17:39:39.626Z
---

Aka. distance.

For a set $V$, a metric $d$ on $V$ is such that:
- $d: V\times V \rightarrow \mathbb{R}$ is a function
- $\forall x,y \in V,\;d(x,y) \ge 0$
- $\forall x,y \in V,\;d(x,y)=0 \iff x=y$ 
- Commutative: $\forall x,y \in V,\;d(x,y)=d(y,x)$ 
- $\forall x,y,z \in V,\;d(x,z)\le d(x,y)+d(y,z)$ 

The distance defined using the norm is also a metric.

### Metric Space

Any set equipped with a metric.


:::note

On metric spaces, we can do calculus on the vector space, such as limits, cauchy sequences.

:::
