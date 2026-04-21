---
title: Arithmetic Logic Unit
sidebar:
  order: 13
slug: >-
  computer-organization-and-digital-design/combinational-logic/arithmetic-logic-unit
prev: true
next: false
---

A component inside a CPU. Does arithmetic and logical operations. Combines
various arithmetic and logical operations into a single unit. Performs only one
operation at a time. Takes in 3 inputs: 2 operators and a flag. The flag input
determines the operation. Multiplexers are used to select between different
circuits to perform different operations.

### Overflow

- Happens when result > range of bits
- Detected when:
  - Two positives → negative result
  - Two negatives → positive result
