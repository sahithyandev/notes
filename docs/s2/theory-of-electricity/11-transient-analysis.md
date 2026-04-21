---
title: Transient Analysis
sidebar:
  order: 11
slug: theory-of-electricity/transient-analysis
prev: true
next: true
---

In AC circuit theory, time and frequency domains are 2 fundamental ways by which signals can be represented and analyzed.

### Steady state

A state in which all variables (such as magnitudes and phases of currents and voltages) remain constant with time under the given excitation function.

### Transient state

A state in which all variables (such as magnitudes and phases of currents and voltages) change with time under the given excitation function. In an AC circuit, transient state occurs at:
- the immediate moment after the switch is closed or opened
- faults such as sudden short circuit, open circuit

Transient state diminishes over time. Differential equations are used to model the behavior of the circuit during the transient state. AC theory cannot be used here.

## Time Domain

How a signal varies with time is analyzed. This is considered the most intuitive representation as the amplitude of a signal at each point in time is shown. Signals are expressed as a function of time, e.g., $v(t) = V_m \sin(\omega t + \phi)$. Amplitude vs. time is shown. $ $

Time domain analysis is particularly useful when the response of a circuit to sudden changes needs to be understood or when non-periodic signals are being analyzed.

Used in analysis of circuit start-up behavior, step responses, and transient effects.

## Frequency Domain

How much of a signal exists at each frequency is analyzed. Signals are expressed as a function of frequency, typically using Fourier or [Laplace transforms](/theory-of-electricity/laplace-transform/). Amplitude and phase vs. frequency are shown.

By frequency domain analysis, the following aspects can be more easily understood:
- How different frequency components are responded to by circuits
- Resonance behaviors
- Filter characteristics
- System stability

Used in filter design, frequency response analysis, impedance calculations are performed.

## Relationship between domains

These two representations are mathematically related through transforms:
- Fourier transform is used to convert from time domain to frequency domain for periodic and some non-periodic signals
- Laplace transform is considered more general and a wider range of signals, including those with transient components, can be handled by it

:::note

To convert from a differential equation of impedance (or admittance) in time domain to frequency domain, use the substitution:

```math
\frac{\text{d}}{\text{d}t} = j\omega
```

:::

## Solving equations

In transient analysis, the behavior is expressed in differential equations. Solving basic differential equations was discussed in [Semester 1](https://s1.sahithyan.dev/mathematics/ode/higher-order-ode/#solution). The complete solution is the sum of two parts.

### Transient response

Aka. free response. Complementary solution of the differential equation. The equation is solved after setting RHS to $0$. The initial conditions (immediately after switch is closed or opened) must be known. $ $

### Steady-state response

Aka. forced response. Particular solution of the differential equation. All initial conditions are set to $0$. $ $
