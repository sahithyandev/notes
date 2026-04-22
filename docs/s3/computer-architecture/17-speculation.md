---
title: Speculation
sidebar:
  order: 17
slug: s3/computer-architecture/speculation
prev: true
next: true
dateCreated: 2026-04-22T07:09:10.689Z
lastUpdatedOn: 2026-04-22T07:15:36.791Z
---

Execute instructions along predicted path. Commit only if prediction correct. Otherwise throw away ROB entries. Requires branch prediction. Handled by hardware.

More speculation provides better performance but has downsides:

- Higher misprediction penalty
- Higher energy usage
- More cache/TLB misses

Degrades energy efficiency if predictions are frequently wrong (relative to no speculation). Might also cause cache pollution.

### Reorder Buffer

Aka. ROB. Holds results until they are ready to be committed. Prevents state update until commit.

Stores:

- Instruction type
- Destination register
- Value
- Ready bit

## Steps

### Issue

Allocate a Reservation Station entry and a Reorder Buffer entry for the instruction. Read any source operands that are already available; if not available, store the tags of the producing instructions. Dispatch step in hardware-based speculation.

### Execute

The instruction in the RS begins execution as soon as all operand values are ready. Enables out-of-order execution.

### Write Result

When the functional unit finishes, the result and ROB tag are broadcasted using CDB. ROB entry will be updated to be ready. Any RS entries waiting for that tag capture the value.

### Commit

When the instruction reaches the head of the ROB and its ready:

- The CPU updates the architectural register file or memory.
- The ROB entry is freed.

If the committing instruction is a mispredicted branch, speculated entries are discarded. The pipeline is flushed and execution restarts from the correct path.

:::note

Modern processors use speculation, dynamic scheduling, and multiple issue architectures for maximum ILP.

:::
