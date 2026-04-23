---
title: Vector Space
sidebar:
  order: 2
slug: s4/linear-algebra/vector-space
prev: true
next: true
dateCreated: 2026-04-23T17:39:39.626Z
lastUpdatedOn: 2026-04-23T17:39:39.626Z
---

$(V,*,\circ)\;\text{over}\;(F,+,\cdot)$ is a vector space, **iff** it satisfies:

- $(V,*)$ is an abelian group
- $(F,+,\cdot)$ is a field
- $\forall a \in F, \forall x \in V, a \circ x \in V$
- $\forall a \in F, \forall x,y \in V, a \circ (x * y) = (a \circ x) * (a \circ y)$
- $\forall a,b \in F, \forall x \in V, (a+b) \circ x = (a \circ x) * (b \circ x)$
- $\forall a,b \in F, \forall x \in V, (a\cdot b) \circ x = a \circ (b \circ x)$

In the above definition:
- $F$ is the set of _scalars_
- $V$ is the set of _vectors_
- $+$ is number addition
- $\cdot$ is number multiplication
- $*: V \times V \to V$ is vector addition
- $\circ: F \times V \to V$ is scalar multiplication

### Alternate Notation

When no confusion arises, instead of 4 different symbols:
- $+$ for both vector addition and scalar addition
- $\cdot$ for both scalar multiplication and field multiplication

And:
- Zero vector is denoted as $\underline{0}$
- $(V,*,\circ)\;\text{over}\;(F,+,\cdot)$ is simply denoted as $V$ over $F$.


## Properties

Suppose $(V,*,\circ)\;\text{over}\;(F,+,\cdot)$ is a vector space.

### Zero vector exists

Denoted as $e$.

```math
\exists e \in V \text{ such that } \forall x \in V,\; x \circ 0 = e
```

:::note[Proof Hint]

- Start with $x = 1 \circ x$
- Rewrite $1$ as $1+0$
- Distribute $\circ$ over brackets
- Use $\overline{x}$

:::


```math
\forall a \in F,\; a \circ e = e
```

:::note[Proof Hint]

- Start with $a\cdot x = a\cdot(x*e)$ (vector addition with zero vector) 
- Distribute $\cdot$ over brackets
- Use $(\overline{a\circ x})$

:::


```math
\forall a \in F, \forall x \in V;\; a \circ x = e \implies a = 0\;\text{or}\;x=e
```

### Negative x is the additive inverse

```math
\overline{x} = (-1) \circ x
```

:::note[Proof Hint]

- Start with $x * ((-1) \circ x)$
- Distribute $*$ over brackets

:::
