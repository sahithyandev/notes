---
title: Pipelining
sidebar:
  order: 10
slug: s3/computer-architecture/pipelining
prev: true
next: true
dateCreated: 2026-04-22T07:09:10.687Z
lastUpdatedOn: 2026-04-22T07:15:36.790Z
---

A technique to improve CPU performance. Execution of multiple instructions are overlapped the execution of multiple instructions, instead of processing each instruction sequentially from start to finish.

The CPU divides instruction execution into several stages. Each stage is handled by a different part of the processor, allowing multiple instructions to be in different stages of execution at the same time.

Increases instruction throughput. Slightly increases the execution time of each instruction due to increased overhead (caused by pipeline register delays, clock skew). Introduces challenges (hazards) which must be managed to maintain correct program execution.


## Terminology

### Clock skew

The difference in arrival time on the clock signal at different parts of the circuit.

Caused by unequal wire lengths, capacitance, and propagation delays. Causes pipeline errors.

### Pipe

The sequence of stages through which instructions pass during execution in a pipelined processor.

Instructions move from one stage to the next in a streamlined fashion. The pipe enables multiple instructions to be processed simultaneously, with each instruction at a different stage, thereby increasing overall throughput and efficiency.

### Pipe stage

Aka. pipe segment. A specific part of the pipeline that performs a particular function.

### Depth of pipeline

The number of stages in the pipeline.

### Balanced pipeline

A pipeline setup where all stages have the same duration.

### Throughput

Average number of instructions coming out of the pipe per unit time. 

### Processor cycle

Time required between moving an instruction one step down the pipeline.
Depends on slowest stage.

Clock cycle cannot be smaller than the sum of clock skew and latch overhead.

### Time per instruction

Denoted by TPI.

```math
\text{TPI}_{\text{pipelined}} =
\frac{\text{TPI}_{\text{unpipelined}}}{\text{N}}
```

Here $N$ is the number of pipeline stages.

### Speedup

```math
\text{Speedup} =
\frac{\text{TPI}_{\text{unpipelined}}}{\text{TPI}_{\text{pipelined}}}
```

For a balanced pipeline:

```math
\text{Speedup} = \text{Number of pipeline stages}
```

### Pipeline register

A register placed between two stages of a CPU pipeline.
  
## Pipeline Stall

When an instruction need delaying during a hazard. One stalled instruction causes all instructions after it to stall. Instructions issued earlier than the stalled one must continue to clear the stall. No new instructions fetched during stall. Causes performance degradation.

### Branch Penalty

Number of wasted clock cycles wasted due to a branch instruction.

When pipeline is stalled because of a branch instruction. The CPU has to either:
- Wait until the branch decision is resolved before fetching the next instruction.
- Predict the branch outcome and fetch the next instruction based on the prediction.

If the prediction is correct, the pipeline proceeds without any issues. If it's incorrect, the incorrect instruction must be flushed. The pipeline has to start again with the correct instruction. This wastes several clock cycles.

In either cases, the number of lost cycles is called the branch penalty.
