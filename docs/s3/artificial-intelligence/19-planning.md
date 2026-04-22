---
title: Planning
sidebar:
  order: 19
slug: s3/artificial-intelligence/planning
prev: true
next: true
dateCreated: 2026-04-22T07:09:10.685Z
lastUpdatedOn: 2026-04-22T07:15:36.789Z
---

The process of finding a sequence of actions that transforms the current state of the world into one where the goal is achieved. Done by deliberative agents. Enables reasoning.

Assumes:
- Deterministic
- Fully observable
- Static
- Discrete

Used for:
- Mobile robots and logistics scheduling
- Virtual agents and workflow management
- Hubble telescope operation planning
- Automated test-case generation in software engineering

### Frame Assumption

When an action happens, only the explicitly stated effects change.

## Planning Problem

Must specify:

- Representation of world states
- The initial state
- A goal description
- A set of possible actions and their effects    
  The solution is a plan (sequence of actions) that achieves the goal.
  

## Requirements

- A formal language to represent states, goals, and actions   
  Must be expressive enough to describe various domains yet simple enough for efficient algorithms.
- An algorithm to search for valid plans
- Logical structure enabling efficient reasoning about actions

## PDDL

Aka. Planning Domain Definition Language. The standard language for classical planning.

### State

Conjunction of ground atomic facts. May be propositional or first-order.

Example:
```math
\text{At}(\text{Plane1}, \text{Sydney}) \land \text{At}(\text{Plane2}, \text{Perth})
```

Cannot use variables or functions. Anything not explicitly stated is false. No aliases for objects.

### Goal

A state satisfies a goal if it includes all atoms of the goal.

Example:
```math
\text{Goal}: \text{At}(\text{Plane1}, \text{Melbourne})
```

### Action

Each action schema contains:
- Preconditions: Required to execute the action.
- Effects: facts added or removed after execution.

Parameters are listed in parentheses. Effects can be separated into add list and delete list.

An action is applicable **iff** its preconditions are satisfied in the current state.


Example:

```math
\begin{equation}
\nonumber
\begin{split}
& \text{Action Fly}(p, \text{from}, \text{to}) \\
& \quad \text{PRECOND}: \text{At}(p,\text{from}) \land \text{Plane}(p) \land \text{Airport}(\text{from}) \land \text{Airport}(\text{to}) \\
& \quad \text{EFFECT}: \neg \text{At}(p,\text{from}) \land \text{At}(p,\text{to})
\end{split}
\end{equation}
```


## STRIPS


Aka. Stanford Research Institute Problem Solver. An early and influential action representation system for planning.

Limited in expressiveness:
- Does not support disjunctions
- Negations in preconditions only
- No quantifiers
- No conditional effects

## ADL

Short for Action Description Language. Syntax similar to STRIPS. Has typed parameters and inequality. Supports richer conditions.

Example:

```math
\begin{equation}
\nonumber
\begin{split}
 
& \text{Action Fly}(p: \text{Plane}, \text{from}:\text{Airport}, \text{to}:\text{Airport}) \\
& \quad \text{PRECOND}: \text{At}(p, \text{from}) \land (\text{from} \neq \text{to}) \\
& \quad\text{EFFECT}: \neg \text{At}(p, \text{from}) \land \text{At}(p, \text{to})
\end{split}
\end{equation}
```

