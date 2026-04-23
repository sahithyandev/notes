---
title: Turing Machine
sidebar:
  order: 28
slug: s4/theory-of-computing/turing-machine
prev: true
next: false
dateCreated: 2026-04-23T17:39:39.635Z
lastUpdatedOn: 2026-04-23T17:39:39.635Z
---

Most powerful abstract model of computation. Can simulate any real computer (ignoring efficiency). Modelled by Alan Turing.

A 5-tuple $T = (Q, \Sigma, \Gamma, q_0, \delta)$.

Where:

- $Q$ = finite set of states
- $\Sigma \supset \set{ h_a, h_r }$ = input alphabet
- $\Gamma \supset \set{ \Lambda }$ = tape alphabet
- $q_0$ = start state
- $δ: Q \times \Sigma \rightarrow Q \times \Gamma \times \set{L,R,S}$ = transition function

## Components

### Tape

Consists of infinite cells. One dimensional. Works as memory.

### Cell

A component inside the tape. Can be read from or written to.

### Symbol

Element that can be written on a cell. $\Lambda$ means empty.

### Tape Head

Points to a cell. Reads from or writes to a cell. Can move left or right or stay at the current cell.

### CPU

Has internal state (from an finite set of states). Decides whether to move the tape head, in which direction to move, whether to write on the cell, what to write on the cell. Decisions based on current symbol and current state.

## State

State of the machine (or the CPU). Includes 2 halting states:

- $h_a$: Accept
- $h_r$ → Reject

## Transition Function

```math
\delta(q, X) = (r, Y, D)
```

It means, from state $q$, reading $X$:

- Write $Y$
- Move to state $r$
- Move head $D \in {L, R, S}$

## Configuration

Represents the current status. $(q, x\underline{a}y) \in Q \times \Gamma^*$. Current symbol under tape head is underlined.

For input string $x$, the machine starts at $(q_0, \Delta x)$.

### Configuration Changes

Turing machine changes from 1 configuration to another in each step. Can either move in:

- Single step  
  $(q, x\underline{a}y) \vdash_T (r, z\underline{b}w)$
- Multiple steps  
  $(q, x\underline{a}y) \vdash_T^* (r, z\underline{b}w)$

## Halting

Turing machine halts when it reaches either of the halting states. May run forever without halting.

## Acceptance

A string $x$ is accepted **iff** the machine reaches accepting state i.e. $(q_0, \Delta x) \vdash_T^* (h_a, yaz)$.

## Examples

### Regular Language

```math
L = (a|b)^*aba(a|b)^*
```

TM behaves like FA. Moves right only. Does not modify the tape.

### Ends with "aba"

```math
L = {x \mid x \text{ ends with } aba}
```

Must read entire input before accepting.

### Palindromes

```math
L = {x \mid x = x^R}
```

Match first and last symbols. Replace them and repeat. Deterministic.

## Functions

TM can compute functions of the form $f: \Sigma^* \rightarrow \Gamma^*$.

TM computes $f(x)$ **iff** $(q_0, \Delta x) \vdash_T^* (h_a, \Delta f(x))$.

### Partial Functions

When the function is undefined for certain inputs.

TM will produce output only for valid inputs. Loop indefinitely otherwise.

### Characteristic Function

For a language $L$:

```math
f(x) =
\begin{cases}
1 & \text{if } x \in L \\
0 & \text{otherwise}
\end{cases}
```

## Related Concepts

### Turing Completeness

A system can simulate any TM.

### Turing Test

Tests if a machine behaves like a human.
