---
title: Introduction to Computer Architecture
sidebar:
  order: 1
  label: Introduction
slug: s3/computer-architecture/introduction
prev: false
next: true
dateCreated: 2026-04-22T07:09:10.686Z
lastUpdatedOn: 2026-04-22T07:15:36.790Z
---

Computer architecture is the design and organization of a computer system. It involves the conceptual structure and functional behavior of a computer system at a level that can be used to understand how the computer works.

## CPU

Can be categorized into 2 based on cycles per instructions (CPI).

### Single Cycle CPU

Each instruction executes completely in 1 clock cycle. Slowest instruction defines the clock cycle's duration. Simpler instructions causes waste of time, as they finish earlier. Not scalable as introducing more or complex instructions causes longer clock cycles.

### Multi Cycle CPU

Different instructions take different number of clock cycles to execute. Instructions are split into multiple stages, each stage taking one clock cycle.

Slowest step of all the instructions defines the clock cycle's duration. Wasted time due to simple instruction waiting is less compared to single cycle CPU.

Allows for more complex instructions to be executed in parallel.

## Microprocessor vs Microcontroller

A microprocessor is a CPU on a single chip. Has a larger instruction set. Has more registers.

A microcontroller is a small _computer_ on a single chip. Includes a CPU, ROM, SRAM and other peripherals. Self-contained. Consumes less power. Has small memory.

## Computer-System Architecture

Refers to the structural design of how a computer’s major components (CPU(s), memory, I/O devices) are organized and interact.

### Single-Processor System

Single CPU. Only one instruction stream runs at any instant. Uses [multiprogramming](/operating-systems/introduction#multiprogramming) and [preemptive scheduling](/operating-systems/cpu-scheduling/#preemptive). Most common design.

### Multiprocessor System

Multiple physical CPUs sharing memory and I/O. All processors work under one OS image.

Increases throughput and reliability. One CPU can fail without stopping the system.

#### Symmetric Multiprocessing

All processors has the same responsibilities and power; share the same memory and I/O resources. Scalable. Common in modern OS design.

#### Asymmetric Multiprocessing

Different types of processors, designed for specific tasks are used. Improves performance. Not as much scalable.

### Multicore System

Multiple cores inside a single chip. A core is an independent execution engine. Has its own ALU, pipelines, registers, and can run one instruction stream at a time. Cores share some resources such as caches, buses.

Gives parallelism without multiple physical chips. Faster. Less power consumption.

### Multithreaded Multicore System

Multicore system where a core contains multiple _hardware threads_ (aka. logical processors). A virtual execution slot inside a core. Shares core’s execution units but keep separate register sets. Switches to another thread when a memory stall occurs. Not to be confused with [OS-level thread](/operating-systems/thread).

### NUMA System

NUMA stands for Non-Uniform Memory Access. A multiprocessor layout where memory is split into local regions per core. OS must be NUMA-aware to place threads and data close together.

Memory access cost depends on which CPU accesses it. Access to local memory is fast; access to remote memory is slower.

### Clustered System

Multiple separate computers connected by a high-speed network and managed to act as a single service. Used for high availability (failover) or high performance (parallel computation). Each node runs its own OS, but clustering software coordinates them.

Multiple systems working together for high availability or high performance.
