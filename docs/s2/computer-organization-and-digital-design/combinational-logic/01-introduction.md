---
title: Introduction to Combinational Logic
sidebar:
  label: Introduction
  order: 1
slug: computer-organization-and-digital-design/combinational-logic/introduction
prev: false
next: true
---

### Literal

A variable or the complement of a variable.

### Sum term

A single literal or a logical sum of two or more literals

### Product term

A single literal or a logical product of two or more literals

### Normal term

A product or sum term where no variable appears more than once.

### Minterm

An $n$-variable minterm is a normal product term with $n$ literals.

### Maxterm

An $n$-variable maxterm is a normal sum term with $n$ literals.

## Representation

### Truth table

A table of all inputs and the associated output. Unique. Expensive. Verbose.

### Karnaugh Map

A diagram which can be used to reduce a truth table of inputs and output to a
boolean expression. Aka. K-map.

- Sketch an empty with (1 vs 1 or 1 vs 2, or 2 vs 2 ...)
  - If the variables in a row or column is more than 2, they must be arranged in
    [gray code](/computer-organization-and-digital-design/basics/number-systems/#gray-codes).
- Populate the map with given values
- Group the 1s according to K-map rules
  - Each group must be rectangular
  - Each group must be as large as possible
  - Each group's area must have an area of a power of 2 (1, 2, 4, 8...)
  - Two groups can overlap

Then the boolean expression can be derived.

The issue with boolean expressions are they are not unique to a circuit.
Different boolean expressions lead to different gate realizations. Because of
that, a canonical form is used. They are called two-level canonical forms. There
are 2:

- Sum of Products
- Product of Sums

### Sum of Products

Aka. disjunctive normal form or minterm expansion.

- Pick all the 1s
- Construct literals using the inputs, AND operator, so that they result in a 1.
- Sum all those literals

#### Shorthand of SOP

If the order of the variables in the truth table is agreed upon, the SOP
notation can be shorten.

- Order of the variables is fixed
- Each row is enumerated (by converting to decimal) and denoted by "minterm #4"
  or "m4"
- The sum can be written as:
  - sum of products: $m3 + m4 + m6 + m7$
  - using summation notation: $\sum{m(3,4,6,7)}$

### Product of Sums

Aka. conjucative normal form or maxterm expansion.

- Pick all the 0s
- Construct literals using the inputs, OR operator, so that they result in a 0.
- Join all those literals using AND operator

#### Shorthand of POS

If the order of the variables in the truth table is agreed upon, the POS
notation can be shorten.

- Order of the variables is fixed
- Each row is enumerated (by converting to decimal) and denoted by "maxterm #4"
  or "M4"
- The product can be written as:
  - product of sums: $M3 \cdot M4 \cdot M6 \cdot M7$
  - using production notation: $\prod{M(3,4,6,7)}$

:::note

SOP or POS is used depending on the output behaviour. If most of the output is
1, POS might be more suitable and if it's 0, SOP might be more suitable.

:::

## Don't care conditions

When only one of the bits are changed between 2 rows of a truth table, the rows
can be merged into one with the altering bit changed to "x". Can be applied to
inputs and outputs. A compact truth table is resulted by doing so.

When drawing a K-map for a compact truth table, the "x" have to be considered.

## Forms

### Canonical form

Each term contains all variables in either normal or complement form. SoP and
PoS expressions are in canonical form.

Boolean functions expressed in canonical forms are cost-effective to be
implemented.

### Standard form

Simplified SoP and PoS expressions. Each term may contain a subset of variables,
in normal or complement form.

### Non-standard form

Any other boolean expressions. For example: $(A+B)\cdot C + \overline{B}$. $ $
