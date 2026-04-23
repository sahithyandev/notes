---
title: CFG to PDA
sidebar:
  order: 22
slug: s4/theory-of-computing/cfg-to-pda
prev: true
next: true
dateCreated: 2026-04-23T17:39:39.635Z
lastUpdatedOn: 2026-04-23T17:39:39.635Z
---

A langauge is context-free **iff** a PDA recognizes it.

## Top-down approach

Simulates left-most derivation.

Suppose a CFG $G=(V,\Sigma,R,S)$ is given. The corresponding PDA is defined as $M=(Q,\Sigma,\Gamma,q_0,Z_0,A,\delta)$ where:

- $Q=\set{ q_0, q_1, q_2 }$  
  Only 3 states are enough.
- $\Sigma$ (input alphabet) is the same as of $G$
- $\Gamma=V\cup \Sigma \cup \set{ Z_0 }$  
  Stack contains the terminals, the non-terminals and $Z_0$.
- $A=\set{ q_2 }$

And $\delta$ is defined as follows:

| Configuration       | Next State | Stack Top Replacement | Description                                                         |
| ------------------- | ---------- | --------------------- | ------------------------------------------------------------------- |
| $(q_0,\Lambda,Z_0)$ | $q_1$      | $S Z_0$               | Move to $q_1$ and push start symbol $S$ to the stack                |
| $(q_1,\Lambda,Z_0)$ | $q_2$      | $Z_0$                 | Only move to $q_2$ from $q_1$ (not $q_0$) when stack has $Z_0$ only |
| $(q_1,\Lambda,X)$   | $q_1$      | $\alpha$              | $\forall X \in V, X\rightarrow \alpha \in P$                        |
| $(q_1,a,a)$         | $q_1$      | $\Lambda$             | $\forall a \in \Sigma$                                              |

## Bottom-up approach

Simulates right-most derivation in reverse.

Suppose $G = (V, \Sigma, P, S)$. The corresponding PDA $M = (Q, \Sigma, \Gamma, q_0, Z_0, A, \delta)$ where:

- $Q = \set{ q_0, q_1, q_2 }$  
  Only 3 states are enough.
- $\Sigma$ is the same as CFG
- $\Gamma = V \cup \Sigma \cup \set{Z_0}$  
  Stack contains the terminals, the non-terminals and $Z_0$.
- $A = \set{ q_2 }$

And the transition function is defined as:

| Configuration            | Next State | Stack Replacement | Description                                                                     |
| ------------------------ | ---------- | ----------------- | ------------------------------------------------------------------------------- |
| $(q_0,\Lambda,Z_0)$      | $q_1$      | $Z_0$             | Move to working state.                                                          |
| $(q_1,a,X)$              | $q_1$      | $aX$              | Push input symbol $a$ onto stack.                                               |
| $(q_1, \Lambda, \alpha)$ | $q_1$      | $X$               | If $X \to \alpha \in P$. Reverse of production. Main step of bottom-up parsing. |
| $(q_1, \Lambda, S Z_0)$  | $q_2$      | $Z_0$             | Accept when reduced to start symbol.                                            |
