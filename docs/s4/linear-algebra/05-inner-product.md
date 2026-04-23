---
title: Inner Product
sidebar:
  order: 5
slug: s4/linear-algebra/inner-product
prev: true
next: true
dateCreated: 2026-04-23T17:39:39.626Z
lastUpdatedOn: 2026-04-23T17:39:39.626Z
---

Suppose $V$ be a vector space over $F$.

Inner product is an operation $\langle x,y\rangle$ satisfying:

- $\langle x,y\rangle: V\times V \rightarrow F$ is a function
- $\langle x + y,z\rangle = \langle x,z\rangle + \langle x,z\rangle$
- $\langle x,y\rangle = \overline{\langle y,x\rangle}$ (complex conjucate)
- $\langle ax,y\rangle = \overline{a}\langle x,y \rangle$
- $\langle x,y\rangle \ge 0$ and $\langle x,x\rangle = 0 \iff x = \underline{0}$

### Properties

- $\langle x,y+z\rangle = \langle x,y\rangle + \langle x,z\rangle$  
  Invert it. Use the plus expansion on first operand. Invert it back.
- $\langle x,ay\rangle = a\langle x,y \rangle$  
  Invert it. Extract $a$. Invert it back.

## Inner Product Space

A vector space equipped with an inner product.
