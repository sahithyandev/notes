---
title: State Machines
sidebar:
  order: 8
slug: computer-organization-and-digital-design/sequential-logic/state-machines
prev: true
next: false
---

Aka. finite state machines (FSMs). Used to model systems that move through a
predetermined sequence of states based on inputs and current state.

### Components

- A finite set of states
- A set of inputs
- A set of outputs
- A state transition function
- An output function
- An initial state

A basic state machine implementation requires:

- State registers to store the current state
- Combinational logic for:
  - Next state logic (state transition function)
  - Output logic
- Clock signal for synchronization

## State Diagram

State machines are commonly represented using state diagrams.

- Circles represent states
- Arrows show transitions between states
- Labels on arrows show input conditions
- Labels in circles (Moore) or on arrows (Mealy) show outputs

## State Machine Design Process

1. Define states and transitions
2. Create state diagram
3. Choose state encoding
4. Design combinational logic
5. Implement using flip-flops and gates

When implementing state machines:

- Choose appropriate state encoding (binary, one-hot, etc.)
- Minimize number of states
- Handle unknown states
- Consider timing requirements
- Plan for testability
