---
title: Introduction to Sequential Logic
sidebar:
  label: Introduction
  order: 1
slug: computer-organization-and-digital-design/sequential-logic/introduction
prev: false
next: true
---

Output is determined by the current state and the input. The output is fed back
to the input to determine the next output.

## Clock

Generates a series of pulses at regular intervals. Used to synchronize the
operation of digital circuits.

### Clock signal

A square wave with a 50%
[duty cycle](/computer-organization-and-digital-design/basics/digital-logic-signals/#duty-cycle).
The signal is high for half the period and low for the other half.

## Triggering methods

Determines when the output changes according to the clock signal.

### Positive edge-triggered

Output changes on the rising edge of the clock signal.

### Negative edge-triggered

Output changes on the falling edge of the clock signal.

### Level Triggering

Output changes when the clock signal is high (or low).

## Characteristics

### Characteristic table

A table of memory, current input and output. Similar to a truth table.

### Excitation table

A table used to determine the required inputs for a sequential circuit element
to transition from its current state to a desired next state. Provides a mapping
between the current state, next state, and the necessary inputs. Essential for
designing and analyzing sequential circuits.

## Latch & Flip-flop

A memory element that can store a bit.

### Latch

Level triggered. Independent of a clock. Asynchronous. Can change state while enabled.

### Flip-flop

Edge triggered. Dependent on a clock. Synchronous. Can change state only at rising edge of clock.

## Types of sequential circuits

### Asynchronous

Works without a clock. Built using latches.

### Synchronous

Works based on a clock. Built using flip flops.
