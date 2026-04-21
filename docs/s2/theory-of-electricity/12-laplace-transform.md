---
title: Laplace Transform
sidebar:
  order: 12
slug: theory-of-electricity/laplace-transform
prev: true
next: true
---

A mathematical operation that transforms a function of time $f(t)$, into a function of a complex variable, denoted as $F(s)$. Mathematically, the Laplace Transform of a function $f(t)$ is defined as:

```math
F(s) = \mathcal{L}\{f(t)\} = \int_{0}^{\infty} e^{-st} f(t) \, \text{d}t
```

Here:

- $t$ represents time
- $s = \sigma + j\omega$, where $\sigma, \omega \in \mathbb{R}$
- $e^{-st}$ is the exponential decay factor that weights the function $f(t)$.

Can only be applied to casual functions. Converts a differential equation (time domain) into a linear complex algebraic equation (frequency domain). After Laplace transformation is applied, the resulting functions are capitalized by convention.

### Casual function

A function of time $f(t)$ satisfying: $ $

```math
f(t) = 0 \quad \text{for} \quad t < 0
```

### Inverse Laplace transform

If $\mathcal{L}\{f(t)\} = F(s)$, then the inverse Laplace Transform is given by: $ $

```math
f(t) = \mathcal{L}^{-1}\{F(s)\} = \frac{1}{2\pi j} \int_{\sigma - j\infty}^{\sigma + j\infty} e^{st} F(s) \, \text{d}s
```

## Special functions

### Unit step function

```math
u(t) =
\begin{cases}
0,  &  t<0 \\
1, & t>0
\end{cases}
```

Laplace transform of the unit step function is:

```math
\mathcal{L}\{u(t)\} = \frac{1}{s}
```

### Unit impulse function

```math
\delta(t) =
\begin{cases}
0,  &  t\neq 0 \\
\infty, & t=0
\end{cases}
```

Laplace transform of the unit impulse function is:

```math
\mathcal{L}\{\delta(t)\} = 1
```

Area under the curve is $1$. $ $

```math
\int_{-\infty}^{\infty} \delta(t)\, \text{d}t = 1
```

And it has a special property:

```math
\int_{-\infty}^{\infty} f(t-k)\,\delta(t)\, \text{d}t = f(k)
```

### Unit ramp function

```math
r(t) =
\begin{cases}
0,  &  t<0 \\
t, & t>0
\end{cases}
```

Laplace transform of the unit ramp function is:

```math
\mathcal{L}\{r(t)\} = \frac{1}{s^2}
```

## Circuit transformation

Both AC and DC voltage sources are transformed according to the Laplace transform table. Resistors are included as is.

An inductor $L$ is converted to $Ls$. To cater for initial current, a voltage source $L i(0^+)$ is added aiding the voltage.

A capacitor $C$ is converted to $\frac{1}{Cs}$. To cater for initial voltage, a voltage source $\frac{v(0^+)}{s}$ is added opposing the voltage.

## Properties

Suppose $f(t)$ has a Laplace transform $F(s)$ for the below definitions.

### Linearity

$a$ and $b$ are constants.

```math
\mathcal{L}\{a f(t) + b g(t)\} = a \mathcal{L}\{f(t)\} + b \mathcal{L}\{g(t)\}
```

### Differentiation

```math
\mathcal{L}\{f'(t)\} = sF(s) - f(0^+)
```

```math
\mathcal{L}\{f''(t)\} = s^2F(s) - sf(0^+) - f'(0^+)
```

```math
\mathcal{L}\{f^{(n)}(t)\} = s^nF(s) - \sum_{k=1}^{n-1} {s^{k} f(0^+)} - \sum_{k=1}^{n-1} f^{(k)}(0^+)
```

### Integration

```math
\mathcal{L}\left\{\int_{0}^{t} f(t) \, \text{d}t\right\} = \frac{F(s)}{s}
```

### Time Scaling

```math
\mathcal{L}\left\{f\left(\frac{t}{a}\right)\right\} = aF\left(as\right)
```

### Frequency Scaling

```math
\mathcal{L}^{-1}\left\{F\left(\frac{s}{a}\right)\right\} = af\left(at\right)
```

### Multiplication by t

```math
\mathcal{L}\left\{t^n f(t)\right\} = (-1)^n \frac{\text{d}^n F(s)}{\text{d}s^n}
```

### Time shift

```math
\mathcal{L}\left\{f(t - T)\right\} = e^{-sT}F(s)
```

### Frequency shift

```math
\mathcal{L}^{-1}\{F(s+a)\} = e^{-at}f(t)
```

## Theorems

### Initial Value Theorem

```math
f(0^+) = 
\lim_{t \to 0+} f(t)
=
\lim_{s \to \infty} sF(s)
```

### Final Value Theorem

```math
f(\infty) =
\lim_{t \to \infty} f(t)=
\lim_{s \to 0} sF(s)
```

## Laplace transform table

<section class="big-equations">

| Function Name      | Function                              | Laplace Transform                      |
| ------------------ | ------------------------------------- | -------------------------------------- |
| Unit Impulse       | $\delta(t)$                           | $1$                                    |
| Unit Step          | $u(t)$                                | $\frac{1}{s}$                          |
| Polynomial         | $t^n$                                 | $\frac{n!}{s^{n+1}}$                   |
| Exponential        | $e^{-at}$                             | $\frac{1}{(s + a)}$                    |
| Sine Wave          | $\sin \omega t$                       | $\frac{\omega}{(s^2 + \omega^2)}$      |
| Cosine Wave        | $\cos \omega t$                       | $\frac{s}{(s^2 + \omega^2)}$           |
| Damped Sine Wave   | $e^{-at} \sin \omega t$               | $\frac{\omega}{(s + a)^2 + \omega^2}$  |
| Damped Cosine Wave | $e^{-at} \cos \omega t$               | $\frac{(s + a)}{(s + a)^2 + \omega^2}$ |
| Sinh Wave          | $\sinh at$                            | $\frac{a}{(s^2 - a^2)}$                |
| Cosh Wave          | $\cosh at$                            | $\frac{s}{(s^2 - a^2)}$                |
| Damped Sinh Wave   | $e^{-bt} \sinh at$                    | $\frac{a}{(s + b)^2 - a^2}$          |
| Damped Cosh Wave   | $e^{-bt} \cosh at$                    | $\frac{s + b}{(s + b)^2 - a^2}$      |
| When $a \neq b$    | $\frac{e^{-at} - e^{-bt}}{b - a}$     | $\frac{1}{(s + a)(s + b)}$             |
| When $a \neq b$    | $\frac{a.e^{-at} - b.e^{-bt}}{a - b}$ | $\frac{s}{(s + a)(s + b)}$             |

</section>

:::note

The above table will be given in final examination. And don't need to be memorized.

:::
