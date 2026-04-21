---
title: Lookup Tables
sidebar:
  order: 5
slug: computer-organization-and-digital-design/combinational-logic/lookup-tables
prev: true
next: true
---

A technique for implementing combinational logic digital circuits instead of
using AND, OR, NOT gates. For each input combination, the output is precomputed
and stored in memory. Later, the table is used to output the values based on the
applied input combination. Can be cascaded or combined to implement larger and
more complex functions. Aka. LUT.

A 4-input LUT can implement any logic function with 4 inputs by storing 16
outputs.

Faster than gate-based logic.

Multiplexers can be used as LUTs. 

## Usage

- Core building blocks of FGPAs
- Used to store precomputed values of complex mathematical functions
- Used in control units of CPUs to define micro-operations
- Used to reduce number of gates in complex logic
