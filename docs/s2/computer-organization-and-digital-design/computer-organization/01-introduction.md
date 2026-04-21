---
title: Introduction to Computer Organization
sidebar:
  label: Introduction
  order: 1
slug: computer-organization-and-digital-design/computer-organization/introduction
prev: false
next: true
---

Computer organization defines the internal details of operational units, their interconnection, & control. Defined by the internal registers, timing and control structures, and the set of instructions.

### High level view 

Consists of 4 components.
- CPU - executes instructions
- Memory - store program and data
- I/O - receive inputs and produce outputs
- Bus - interconnects everything as a data medium

## CPU

Consists of
- ALU
- Control Unit

## Bus

A communication channel that connects different components of a computer system. Provides a way for these components to exchange data and control signals.

### Address Bus

Carries memory addresses from CPU to memory.

### Data Bus

Carries data between CPU and memory. Bidirectional.

### Control Bus

Carries control signals from CPU to memory.

## Register

Capable of storing a set of bits. Built using flip flops. Has a set of data input and output lines.

General purpose registers are used for temporary storage of data and instructions during program execution. Special purpose registers are used for specific tasks such as program counter, stack pointer, and status register.

### Parallel-in Parallel-out Register

All bits of data can be loaded/read simultaneously through parallel lines. Commonly used in applications requiring rapid data access and manipulation, such as in CPU design and digital signal processing.

<figure style="max-width: 800px; margin: 10px auto;">

![4-bit Parallel-in Parallel-out Register](./images/pipo-register.png)

<figcaption>

Image from [NBCAFE](https://www.electronicsengineering.nbcafe.in/parallel-in-parallel-out-shift-register/)

</figcaption>
</figure>

Clock signal is required.

### Serial-in Serial-out Register

Data bits are loaded and read one bit at a time in a sequential manner. Data is shifted through the register 1 bit position at a time with each clock pulse. Commonly used in applications where data transmission bandwidth is limited, such as in serial communication interfaces and data conversion between parallel and serial formats.

<figure style="max-width: 800px; margin: 10px auto;">

![4-bit Serial-in Serial-out Register](./images/siso-register.png)

<figcaption>

Image from [NBCAFE](https://www.electronicsengineering.nbcafe.in/serial-serial-shift-register-siso/)

</figcaption>
</figure>

### Special Purpose Registers

| Register                      | Description                                                                         |
| ----------------------------- | ----------------------------------------------------------------------------------- |
| Program Counter (PC)          | Holds the memory address of the next instruction to be executed                     |
| Instruction Register (IR)     | Holds the current instruction being executed                                        |
| Memory Address Register (MAR) | Holds the address of the memory location to be accessed                             |
| Memory Data Register (MDR)    | Holds the data being read from or written to memory                                 |
| Accumulator (ACC)             | Stores intermediate arithmetic and logic results                                    |
| Status / Flag Register        | Contains flags that indicate the status of operations (zero, carry, overflow, etc.) |
| Stack Pointer (SP)            | Points to the top of the stack in memory                                            |
| Index Register                | Used for addressing techniques such as indexed addressing                           |

### Flag Register

Individual bits indicate status of ALU operations.

<figure style="max-width: 800px; margin: 10px auto;">

![Flag register](./images/flagregister.png)

<figcaption>

Image from [Plantation Productions](https://www.plantation-productions.com/Webster/www.artofasm.com/Linux/HTML/RealArithmetic.html)

</figcaption>
</figure>
