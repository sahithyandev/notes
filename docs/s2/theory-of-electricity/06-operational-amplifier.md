---
title: Operational Amplifier
sidebar:
  order: 6
slug: theory-of-electricity/operational-amplifier
prev: true
next: true
---

A high-gain electronic voltage amplifier with a differential input and, usually,
a single-ended output. An active circuit element. Voltage-controlled voltage
source. Aka. op-amp.

- Has 2 inputs:
  - Inverting input (-)
  - Non-inverting input (+)
- Has 1 output
- 2 supply terminals (usually DC):
  - Positive
  - Negative
- Reference/ground

### Gain

The ratio between the output and the difference between the input voltages.

```math
A = \frac{V_0}{V_d}
```

## Equivalent circuit

![Op-amp equivalent circuit](./images/op-amp-equivalent.jpg)

Here:

- $R_\text{in}$ - Input resistance, very high
- $R_\text{out}$ - Output resistance, very low
- $A$ - Gain, ranges from $10^5$ to $10^7$
- $V_{d}$ - voltage difference between input terminals
- $V_{in}$ - voltage input, ranges between $5V$ and $18V$

## Ideal op-amp

- Infinite input impedance $R_\text{in} = \infty$
- Zero output impedance $R_\text{out} = 0$
- Infinite gain for differential input signal $A = \infty$ ($V_d = 0$)
- Infinite bandwidth $B=\infty$

### Summing-point constraint

When the op-amp is negative feedback, the voltage at the inverting input terminal is equal to the voltage at the
non-inverting input terminal.

## Feedback types

Usually op-amp circuits are designed with feedback. A feedback is a connection
from the output to the input of the op-amp.

### Negative feedback

The output signal is fed back to the inverting input terminal through a
resistor. Gain decreases.

### Positive feedback

The output signal is fed back to the non-inverting input terminal through a
resistor.

## Uses

Can be used to perform a variety of operations on signals, such as:

- Amplification
- Addition
- Subtraction
- Multiplication
- Division
- Integration
- Differentiation

## Types

### Inverting amplifier

Inverts the input signal. Input signal is fed to inverting input through $R_1$.
Non-inverting input is grounded. Negative feedback is used with $R_2$ resistor.

<figure>

![Inverting amplifier](./images/inverting-amplifier.jpg)

<figcaption>

Image from [Spiceman](https://spiceman.net/inverting-amplifier-circuit/)

</figcaption>
</figure>

```math
A_v = \text{Closed-loop voltage gain} = \frac{v_0}{v_\text{in}} = -\frac{R_2}{R_1}
```

### Non-inverting amplifier

![Non-inverting amplifier](./images/non-inverting-amp.jpg)

Input signal is fed to non-inverting input terminal. Inverting input terminal is
grounded through $R_1$ resistor. Negative feedback is used with $R_2$ resistor.
Negative feedback is used with $R_2$ resistor.

```math
A_v = \frac{v_0}{v_\text{in}} = 1 + \frac{R_2}{R_1}
```

Here:

- $A_v$ - Closed-loop voltage gain

### Summing amplifier

![Summing amplifier](./images/summing-amp.jpg)

An extension of the inverting amplifier. Multiple input signals are added
together.

```math
v_0 = -\left(\frac{R_f}{R_1}v_1 + \frac{R_f}{R_2}v_2 + \ldots + \frac{R_f}{R_n}v_n\right)
```

### Differential amplifier

![Differential amplifier](./images/differential-amp.jpg)

Used to amplify the difference between two input signals.

When $\frac{R_4}{R_3} = \frac{R_2}{R_1}$: $ $

```math
v_0 = \frac{R_2}{R_1}(v_1 - v_2)
```

Otherwise, the output must be derived. 

### Integrator

![Integrator](./images/integrator.jpg)

Input is fed to inverting input terminal through a resistor $R$. Non-inverting
input terminal is grounded. Negative feedback through a capacitor. Includes a
reset switch. Output is the integral of the input signal. $ $

```math
v_0 = -\frac{1}{RC}\int_0^t v_\text{in}\text{d}t
```

### Differentiator

![Differentiator](./images/differentiator.jpg)

Input is fed to inverting input terminal through a capacitor $C$. Non-inverting
input terminal is grounded. Negative feedback through a resistor $R$. Output is
the derivative of the input signal.

```math
v_0 = -RC\frac{\text{d}v_\text{in}}{\text{d}t}
```
