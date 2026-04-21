---
title: Fourier Series
sidebar:
  order: 14
slug: theory-of-electricity/fourier-series
prev: true
next: true
---

Used for periodic non-sinusoidal waveforms. Suppose the periodic time is $T$. The waveform can be represented as a sum of sine wave. The sine waves have integer multiple of the original frequency $f_0 = 2\pi / T$. $ $

```math
f(t) = \frac{a_0}{2} + \sum_{n=1}^{\infty} \big[ a_n \cos\left(f_0 nt\right) + b_n \sin\left(f_0 nt\right) \big]
```

## Useful trigonometric integrals

```math
\int_{\tau}^{\tau + T} \cos(f_0 nt)\, \text{d}t =
\int_{\tau}^{\tau + T} \sin(f_0 nt)\, \text{d}t = 0
```

```math
\int_{\tau}^{\tau + T} \sin(f_0 nt) \cos(f_0 mt) \, \text{d}t = 0
```

```math
\int_{\tau}^{\tau + T} \sin(f_0 nt) \sin(f_0 mt) \, \text{d}t = \begin{cases}
\frac{T}{2} & \text{if } n = m \\
0 & \text{otherwise}
\end{cases}
```

```math
\int_{\tau}^{\tau + T} \cos(f_0 nt) \cos(f_0 mt) \, \text{d}t = \begin{cases}
\frac{T}{2} & \text{if } n = m \\
0 & \text{otherwise}
\end{cases}
```

## Unknown coefficients

$\forall n \geq 0$. $ $

```math
a_n = \frac{2}{T} \int_{\tau}^{\tau + T} f(t)\cos(nf_0t) \, \text{d}t
```

```math
b_n = \frac{2}{T} \int_{\tau}^{\tau + T} f(t)\sin(nf_0t)\, \text{d}t
```

$\frac{a_0}{2}$ is the DC offset. $ $

## Symmetry

For any waveform, subtracting the DC offset results in a symmetrical waveform.

### Even Symmetry

When a wave is symmetric about the vertical axis.
```math
f(t) = f(-t)
```

The fourier series of an even waveform contains only cosine terms.

```math
a_n = \frac{4}{T} \int_{\tau}^{\tau + T/2} f(t)\cos(nf_0t) \, \text{d}t
\;\;\text{and}\;\;
b_n = 0
```

### Odd Symmetry

When a wave is symmetric about the origin.
```math
f(t) = -f(-t)
```

The fourier series of an odd waveform contains only sine terms.

```math
a_n = 0
\;\;\text{and}\;\;
b_n = \frac{4}{T} \int_{\tau}^{\tau + T/2} f(t)\sin(nf_0t) \, \text{d}t
```

### Half-Wave Symmetry

When a wave repeats itself with a reversal of sign after half a period.
```math
f(t) = -f(t + \frac{T}{2})
= -f(t - \frac{T}{2})
```

The coefficients can be found by:

```math
a_n =
\begin{cases}
\frac{4}{T} \int_{\tau}^{\tau + T/2} f(t)\cos(nf_0t) \, \text{d}t & \text{if } n \text{ is odd} \\
0 & \text{if } n \text{ is even}
\end{cases}
```

```math
b_n =
\begin{cases}
\frac{4}{T} \int_{\tau}^{\tau + T/2} f(t)\sin(nf_0t) \, \text{d}t & \text{if } n \text{ is odd} \\
0 & \text{if } n \text{ is even}
\end{cases}
```

:::note

For odd and half-wave symmetry, the Fourier series does not contain a DC offset. Thus, $a_0=0$. $ $ 

:::

Half-wave symmetry can co-exist with odd symmetry or even symmetry. In that case:

```math
a_n =
\begin{cases}
\frac{8}{T} \int_{\tau}^{\tau + T/4} f(t)\cos(nf_0t) \, \text{d}t & \text{if } n \text{ is odd} \\
0 & \text{if } n \text{ is even}
\end{cases}
```

```math
b_n =
\begin{cases}
\frac{8}{T} \int_{\tau}^{\tau + T/4} f(t)\sin(nf_0t) \, \text{d}t & \text{if } n \text{ is odd} \\
0 & \text{if } n \text{ is even}
\end{cases}
```


## Frequency spectrum

Plot of harmonic number vs frequency.

### Harmonic number

$n$th harmonic number denotes the amplitude or strength of the $n$th harmonic. Denoted as $h_n$.

```math
|h_n| = \sqrt{a_n^2 + b_n^2}
\;\;\text{and}\;\;
\text{phase angle} = \tan^{-1}\left(\frac{b_n}{a_n}\right)
```

## RMS

```math
y_{\text{rms}}^2 = a_0^2 + \sum_{i=0}^\infty \Big[ a_{i,\text{rms}}^2 + b_{i,\text{rms}}^2 \Big]
```

## Total Harmonic Distortion

A measurement of the distortion present in the waveform compared to the original waveform.

```math
y_{\text{THD}} = \frac{1}{h_1} \sqrt{\sum_{i=2}^\infty h_i^2} 
```

Here $h_i$ is the rms of $i$th harmonic. DC offset is ignored. Usually given as a percentage.

## Complex form

```math
f(t) =\sum_{n=-\infty}^{\infty} C_n e^{jnf_0t}
```

Here $C_n$ can be found by: $ $

```math
C_n = \frac{A_n - jB_n}{2} =\frac{1}{T} \int_{\tau}^{\tau + T} f(t)e^{-jnf_0 t}\,\text{d}t
```
