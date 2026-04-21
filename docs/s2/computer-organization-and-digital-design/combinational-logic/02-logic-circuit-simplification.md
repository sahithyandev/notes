---
title: Logic Circuit Simplification
sidebar:
  order: 2
slug: >-
  computer-organization-and-digital-design/combinational-logic/logic-circuit-simplification
prev: true
next: true
---

Digital logic circuits can be simplified using boolean algebra.

## Boolean algebra

### Axioms

- $a + 0 = a$
- $a + 1 = 1$
- $a + a = a$
- $a + \overline{a} = 1$
- $a \cdot \overline{a} = 0$
- $\overline{\overline{a}} = a$
- Absorption: $a + ab = a$
- Absorption #2: $a + \overline{a}b = a + b$
- $(a + b)(a + c) = a + bc$
- $a+b=b+a$
- $a\cdot(b+c)=a\cdot b + a\cdot c$
- Uniting thoerem: $a \cdot b + a \cdot \overline{b} = a$
- $(a+b) \cdot (\bar a + c) = a \cdot c + \bar a \cdot b$

### Duality

#### Dual

For a boolean expression, its "dual" is defined as the boolean expression where:

- all the $\cdot$ are replaced with $+$
- all the $+$ are replaced with $\cdot$
- all the $0$ are replaced with $1$
- all the $1$ are replaced with $0$
- all variables left intact

When a theorem is proven, its dual is also proven.

### de Moragan's theorem

A procedure for complementing boolean functions.

- all the $\cdot$ are replaced with $+$
- all the $+$ are replaced with $\cdot$
- all the $0$ are replaced with $1$
- all the $1$ are replaced with $0$
- all variables are replaced with their complements
