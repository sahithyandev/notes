---
title: Buffers
sidebar:
  order: 11
slug: computer-organization-and-digital-design/combinational-logic/buffers
prev: true
next: true
---

A buffer allows current flow only in 1 direction.

## Single input buffer

Takes in 1 input $A$ and outputs 1 output $Q$, where $Q=A$. Can be implemented
using 2 NOT gates.

Used to:

- Isolate logic gates from each other
- Drive or switch higher than normal loads from a logic gate output.
- High fan-out capacity

## Tri state buffer

A type of digital buffer that has 3 stable states.

- High (1)
- Low (0)
- High-Impedance (Hi-Z) - output is disconnected from the circuit

Has an enable pin. Provides the option to electronically isolate the output of
the buffer.

### Uses

- Used in bus-based systems where multiple devices are connected to the same
  bus. Only one device drives the bus at a given time, while others are in Hi-Z
  state. Decoders are used to keep only one tri state buffer active while the
  other devices are in their Hi-Z state.

- Can be used in multiplexers

### Variations

4 variations:

- Active High tri-state buffer
- Active High inverted tri-state buffer
- Active Low tri-state buffer
- Active Low inverted tri-state buffer

Active high means, the buffer is active when ENABLE signal is 1. Active low
means, the buffer is active when ENABLE signal is 0.

Normal variant means the input and output are the same. Inverted variant means
the output is inverted input.
