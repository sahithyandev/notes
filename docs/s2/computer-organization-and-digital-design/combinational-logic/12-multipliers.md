---
title: Multipliers
sidebar:
  order: 12
slug: computer-organization-and-digital-design/combinational-logic/multipliers
prev: true
next: true
---

Used to perform multiplication of binary numbers. Essential in various
applications such as digital signal processing, computer graphics, and
scientific computations.

## 2x2 Multiplier

Multiplies two 2-bit binary numbers. The multiplication process involves
generating partial products and then summing them up.

To build a 2x2 multiplier, 4 AND gates and 2 full adders are required.

Here is an example:

```txt
             a1    a0
x            b1    b0
----------------------
       c1  a1b1  a0b0
+    a1b1  a0b0
----------------------
  c2   s2    s1  a0b0
----------------------
```

## 4x4 Multiplier

Multiplies two 4-bit binary numbers.

To build a 4x4 multiplier, 12 full adders and 16 AND gates are required.

Here is an example:

```txt
                              a3     a2     a1     a0
x                             b3     b2     b1     b0
--------------------------------------------------------
                            a3b0   a2b0   a1b0   a0b0
                     a3b1   a2b1   a1b1   a0b1
              a3b2   a2b2   a1b2   a0b2
+      a3b3   a2b3   a1b3   a0b3
--------------------------------------------------------

--------------------------------------------------------

```
