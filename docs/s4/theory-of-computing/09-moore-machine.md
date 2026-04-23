---
title: Moore Machine
sidebar:
  order: 9
slug: s4/theory-of-computing/moore-machine
prev: true
next: true
dateCreated: 2026-04-23T17:39:39.633Z
lastUpdatedOn: 2026-04-23T17:39:39.633Z
---

A finite automaton with outputs where output depends only on the current state. A 6-tuple.

Suppose $ M = (Q, \Sigma, \Delta, q_0, \delta, \lambda)$ is a Moore machine, where:

- $Q$ is a finite set of states
- $\Sigma$ is a finite input alphabet
- $\Delta$ is a finite output alphabet
- $q_0 \in Q$ is the initial state
- $\delta : Q \times \Sigma \rightarrow Q$ is the transition function
- $\lambda : Q \rightarrow \Delta$ is the output function   
  Each state has a fixed output value.

Output is attached to states only. Output sequence length depends on the number of visited states.

## Conversion from FA

All FAs have an associated Moore machine.

For a given FA $M = (Q, \Sigma, q_0, A, \delta)$, we can construct a Moore machine $M' = (Q, \Sigma, \Delta, q_0, \delta, \lambda)$ where:
- $\Delta = \set{0, 1}$
- $\lambda(q) = 1$ if $q \in A$, else $\lambda(q) = 0$
