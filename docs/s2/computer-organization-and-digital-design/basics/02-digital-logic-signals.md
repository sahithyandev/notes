---
title: Digital Logic Signals
slug: computer-organization-and-digital-design/basics/digital-logic-signals
sidebar:
  order: 2
prev: true
next: true
---

### Logic levels

Ranges of voltages are abstracted away into 0 (LOW) and 1 (HIGH).

The ranges have a gap in-between, to avoid errors by fluctuations.

Example: CMOS (LV)

- HIGH - 2V to 3.3V
- LOW - 0V to 0.8V

## Digital waveforms

Voltage levels that are changing back and forth between the digital states.

### Pulse

A sudden change between the digital states that lasts for a specific duration
before returning to the original state.

2 types:

- Positive-going pulse: Sudden change from LOW to HIGH to LOW.
- Negative-going pulse: Sudden change from HIGH to LOW to HIGH.

### Non-ideal pulse

Even though analog signal is abstracted into digital, the analog characteristic
can be observed when switching states. A non-ideal pulse will take a very short
time to switch the states.

![Non-ideal pulse](./images/non-ideal-pulse.jpg)

### Raise and fall time

Ideally a pulse is instantaneous. In non-ideal case, it takes time to transition
between states. Raise and fall times are measured between the 10% and 90%
transitions.

### Pulse width

The time a pulse takes. In non-ideal case, the pulse width is
said to be the time between 50% marks of the transition.

## Waveforms

A series of pulses. They can either be periodic (pulse train) or non-periodic. A
clock is required along with the waveform to convert it into binary.

### Duty cycle

Defined for a periodic waveform. Ratio between pulse width ($t_w$) and the
period ($T$).

```math
\text{Duty cycle} = \frac{t_w}{T} \times 100\%
```

## Gate delay

Aka. propogation delay. The time it takes for a logic gate to produce an output
after receiving an input. Caused due to the physical limitations of the gate's
internal circuitry. Denoted by $t_p$. $ $

Can vary betwen LOW to HIGH ($t_{pLH}$) and HIGH to LOW ($t_{pHL}$).

## Logic family

A collection of different integrated circuit (IC) chips/chip building blocks
that have:

- Similar input, output and internal circuit characteristics
- Methods to implement all necessary logic functions

Chips from the same family can be interconnected to perform any desired logic
function.

Chips from different logic families may or may not be compatible. When they
aren't, special steps must be taken to interconnect those chips/building blocks.

### Electrical behavior

- Logic voltage level
- DC noise margins   
  Highest `LOW` voltage of an output must be always lower than the highest voltage that an output can reliably interpret as `LOW`
- Fan-out  
  Maximum number of inputs that a single output pin can be connected to.
- Fan-in  
  Number of inputs that a single component can support.
- Power consumption
- Speed
- Noise/interference
- Electrostatic discharge
- Three-state outputs

### Examples


<figure style="max-width: 700px; margin: 10px auto;">

![Examples for Logic Families](./images/logic_voltage_stds.jpg)

<figcaption>

Image by
[Wired && Coded;](https://www.jsykora.info/2014/05/logic-voltage-levels/)

</figcaption>
</figure>

- Light colored strips are for input
- Dark colored strips are for output
- $V_\text{oh}$ is the minimal voltage of output HIGH
- $V_\text{ol}$ is the maximal voltage of output LOW
- $V_\text{ih}$ is the minimal voltage of input HIGH
- $V_\text{il}$ is the maximal voltage of input LOW.
- Two gates of voltage standards (1) and (2) are compatible in the 1->2
  direction if $V_\text{oh}$(1) > $V_\text{ih}$(2) and $V_\text{ol}$(1) <
  $V_\text{il}$(2).

## Digital Design

Digital circuits are designed using software. Simulations are ran at logic
level. Then the circuit is built using FGPAs. After many verifications, the
circuit is fabricated as a chip.

:::note[Tips for Digital Design]

- Digital circuits have analog characteristics.
- Good tools do not guarantee good design, but they help a lot by taking the
  pain out of doing things right.
- Always document the designs to keep them understandable.
- Know when and when not to worry about the analog aspects of digital design.
- Associate active levels with signal names and practice bubble-to-bubble logic
  design.
- Understand and use standard functional building blocks.
- Design for minimum cost at the system level, including the engineering effort
  as part of the cost.
- State-machine design is like programming; approach it that way.
- Use programmable logic to simplify designs, reduce cost, and accommodate
  last-minute modifications.
- Avoid asynchronous design. Practice synchronous design until a better
  methodology comes along.
- Pinpoint the unavoidable asynchronous interfaces between different subsystems
  and the outside world, and provide reliable synchronizers.
- Catching a glitch in time prevents much bigger problems.

:::

## Data transfer

Data can be transferred in either serial or parallel. Serial transfer takes more
time while parallel transfer requires more transmission lines.
