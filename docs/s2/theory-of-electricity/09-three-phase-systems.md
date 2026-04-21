---
title: Three Phase Systems
sidebar:
  order: 9
slug: theory-of-electricity/three-phase-systems
prev: true
next: true
---

### Phasor representation

Suppose $V = V_m \sin{(\omega t + \alpha)}$ is a phasor. $ $

```math
\dot{V} = j\omega \cdot V
```

```math
\int V = \frac{1}{j\omega} \cdot V
```

### Star & Delta

In star connection:

```math
V_\text{line} = \sqrt{3} V_\text{phase} \angle 30^\circ \;\; \text{and} \;\; I_\text{line} = I_\text{phase}
```

In delta connection:

```math
V_\text{line} = V_\text{phase} \;\; \text{and} \;\; I_\text{line} = \sqrt{3} V_\text{phase} \angle 30^\circ
```

## Definitions

### Attenuation & Phase Shift

Suppose a linear, passive network has the input and output as:

```math
E_\text{in} = E_m \sin{(\omega t)}\;\; \text{and} \;\;E_\text{out} = A E_m \sin{(\omega t + \alpha)}
```

Here $A$ is the attenuation or magnification factor and $\alpha$ is the phase shift.

## Power

Power on a 1-phase circuit can be easily found using 1-phase power formula:

```math
P_\text{ph} = V_\text{ph} \cdot I^*_\text{ph} = P_\text{active} + j P_\text{reactive}
```

Here $I^*_\text{ph}$ is the complex conjugate of the current phasor. $ $

## Standard terminology

Examples:
- A 3-ph, 415 V, 50 Hz, 100 kVA transformer
- A 3-ph, 33 kV, 50 Hz, 1 MVA, 3-wire transmission line
- A 3-ph, $\delta$-connected, 415 V, 3.2 kW, 0.85 pf motor

Here:
- Voltage specified is always line voltage
- Active power or apparent power is always the total 3-ph quantity
- If apparent power is given, maximum current capacity of the device can be determined
- 4-wire system has the neutral wire connected between the star-points of supply and load.
- For motors, the power specified is the output mechanical power. The operating power factor of the motor is specified at its rated power.

```math
\text{Efficiency} = \frac{\text{Output Power}}{\text{Input Electrical Power}}
```

## Symmetrical Components

A technique used to handle unbalanced voltages or current sources. Any unbalanced system of three-phase circuits can be decomposed into three symmetrical components:

- Positive sequence ($\mathbf{a}$)   
  Has same phase sequence as the original 3-phase system
- Negative sequence ($\mathbf{b}$)    
  Has reverse phase sequence as the original 3-phase system
- Zero sequence ($\mathbf{c}$)   
  Has equal magnitude and phase angle in all 3-phases

```math
\begin{bmatrix}
  A \\
  B \\
  C \\
\end{bmatrix}
=
\begin{bmatrix}
  A_0 \\
  B_0 \\
  C_0 \\
\end{bmatrix}
+
\begin{bmatrix}
  A_1 \\
  B_1 \\
  C_1 \\
\end{bmatrix}
+
\begin{bmatrix}
  A_2 \\
  B_2 \\
  C_2 \\
\end{bmatrix}
```

The above equation can be simplified as below. Here $\alpha = 1.0\; \angle\; 120^\circ$. $ $

```math
\begin{bmatrix}
  A \\
  B \\
  C \\
\end{bmatrix}
=
\begin{bmatrix}
  1 & 1 & 1 \\
  1 & \alpha^2 & \alpha \\
  1 & \alpha & \alpha^2 \\
\end{bmatrix}
\begin{bmatrix}
  A_0 \\
  B_0 \\
  C_0 \\
\end{bmatrix}
```

### Symmetrical component matrix

```math
[\Lambda]=
\begin{bmatrix}
  1 & 1 & 1 \\
  1 & \alpha^2 & \alpha \\
  1 & \alpha & \alpha^2 \\
\end{bmatrix}
```

```math
[\Lambda]^{-1}=
\frac{1}{3}
\begin{bmatrix}
  1 & 1 & 1 \\
  1 & \alpha & \alpha^2 \\
  1 & \alpha^2 & \alpha \\
\end{bmatrix}
= \frac{1}{3} \cdot [\Lambda]^{*}
```

### Power

```math
S =
3V_\text{A,0} I^*_\text{A,0}+
3V_\text{A,1} I^*_\text{A,1}+
3V_\text{A,2} I^*_\text{A,2}+
```
```math
S = 3
\begin{bmatrix}
V_\text{A,0} & V_\text{A,1} & V_\text{A,2} \\
\end{bmatrix}
\begin{bmatrix}
I^*_\text{A,0} \\
I^*_\text{A,1} \\
I^*_\text{A,2} \\
\end{bmatrix}
```

```math
S = 3 [V_\text{Sy}]^{T} [I_\text{Sy}]^*
```

### Impedances

Phase impedance matrix $[Z_p]$ is defined as: $ $

```math
[Z_p] = 
\begin{bmatrix}
  Z_s & Z_m & Z_m \\
  Z_m & Z_s & Z_m \\
  Z_m & Z_m & Z_s \\
\end{bmatrix}
```

Here:
- $Z_m$ is the impedance caused by mutual coupling between phases.
- $Z_s$ is the impedance in a single phase.

Sequence impedance matrix $[Z_s]$ is defined as: $ $

```math
[Z_s] = [\Lambda]^{-1} Z_p [\Lambda]
```
