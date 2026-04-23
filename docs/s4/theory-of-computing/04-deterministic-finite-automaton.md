---
title: Deterministic Finite Automaton
sidebar:
  order: 4
  label: DFA
slug: s4/theory-of-computing/deterministic-finite-automaton
prev: true
next: true
dateCreated: 2026-04-23T17:39:39.632Z
lastUpdatedOn: 2026-04-23T17:39:39.632Z
---

Aka. DFA. Has a single starting state.

## Transition Function

Denoted by $\delta: Q \times \Sigma \rightarrow Q$. It maps a state and an input symbol to the next state.

### Extended Transition Function

Denoted by $\delta^*$. Handles strings instead of each symbol. $\delta^*(q, x)$ is the state reached after reading string $x$ starting from state $q$.

Rules:

- $\delta^*(q, \lambda) = q$
- $\delta^*(q, ya) = \delta (\delta^*(q, y), a)$

## Acceptance by a DFA

Let $M = (Q, \Sigma, q_0, A, \delta)$.

A string $x \in \Sigma^*$ is accepted **iff** $\delta^*(q_0, x) ∈ A$.

## Complement

Complement of a complete DFA $M = (Q, \Sigma, q_0, A, \delta)$ is $\overline{M} = (Q, \Sigma, q_0, Q \setminus A, \delta)$.

For incomplete DFAs, if  a dead/sink state $d$ and define $\delta(q, a) = d$ for all undefined transitions. Then we can apply the complement operation as above.
