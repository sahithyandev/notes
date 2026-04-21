---
title: Statecharts
sidebar:
  order: 16
slug: program-construction/basics/statecharts
prev: true
next: false
---

## Finite State Machine

A mathematical model of computation. An abstract FSM can be in one of the finite number of states at a given point of time.
- State: A status of the system.
- Transition: A change from one state to another. Based on input events.

## Statechart Diagram

Described temporal evolution of an object of a given class in reponse to interactions with other objects.

### Event

One-way communication between 2 objects. Atomic (non-interruptible), asynchronous. May cause a transition.


### State

Depicted as a rounded rectangle with upto 3 sections. Might be 
- name - optional
- state variables
- triggered operations
- entry event: Occurs when entering the state
- exit event: Occurs when exiting the state

### Operation

An atomic action invoked by a transition.

### Activity

An ongoing operation that takes place while object is in a given state.
