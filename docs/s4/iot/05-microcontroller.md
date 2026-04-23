---
title: Microcontroller
sidebar:
  order: 5
slug: s4/iot/microcontroller
prev: true
next: true
dateCreated: 2026-04-23T17:39:39.624Z
lastUpdatedOn: 2026-04-23T17:39:39.624Z
---

Aka. MCU. A compact integrated circuit designed to control embedded systems.

Includes:

- CPU
- Memory
- I/O interfaces
- Timers and peripherals

Often implemented as a System-on-Chip (SoC)

Microcontrollers are widely used in IoT devices because they:

- consume very little power
- require few external components
- provide built-in I/O capabilities.

## Microcontroller Architecture

### Hardware Model

Describes the physical structure and electrical characteristics of the microcontroller, which includes:.

- Power supply requirements
- Clock system
- Bus architecture
- Memory types
- Bus timing
- Pin configuration

### Programmer’s Model

Represents the microcontroller from the software developer’s perspective, which includes:

- Instruction set architecture
- Memory organization
- Register model
- ALU capabilities
- Interrupt handling
- Peripheral device access
- Resource management

## Components

### Microprocessor Unit

Aka. MPU. The central processing unit inside the microcontroller that executes instructions and controls system operations. Uses a specialized or scaled-down processor design. Often based on architectures like 8051, 8048, or 68HC11. Executes instructions and coordinates peripherals.

### Memory Subsystems

IoT systems use Howard architecture to improve instruction execution efficiency.

#### Program Memory

Stores the executable instructions of the microcontroller program. Usually implemented as flash memory. Often read-only during program execution. May be read-protected for intellectual property protection.

#### Data Memory

Stores variables and temporary program data. Often implemented as RAM. Sometimes structured as a register file for faster access.

### Peripheral Modules

Peripheral modules extend the functionality of the microcontroller by enabling interaction with external devices.

Examples:
- Timers and counters
- Analog-to-digital converters
- Communication interfaces
- Digital I/O ports

Peripherals act as interfaces between the processor bus and the external environment.

### Communication Interfaces

Communication interfaces enable data exchange with external systems or networks.

Examples:
- UART
- SPI
- I²C
- Network interfaces

### Supervisory Modules

Supervisory modules monitor system health and ensure correct processor operation.

#### Watchdog Timer

A watchdog timer resets the system if software becomes stuck in an infinite loop.

- Requires periodic reset by software
- If timeout occurs → system reset

#### Burnout Detection

Burnout detection monitors supply voltage and resets the microcontroller if power instability is detected.

#### Startup Delay

Delays processor execution after power-up until the system stabilizes.

#### Oscillator Delay

Ensures the system clock stabilizes before instruction execution begins.

## Examples

| Microcontroller | Clock Speed  | ROM         | RAM   | I/O Pins |
| --------------- | ------------ | ----------- | ----- | -------- |
| PIC             | up to 20 MHz | up to 16 KB |       | 33       |
| Intel 8051      |              | 4 KB        | 128 B | 32       |
| AVR             | 8 MHz        | 32 KB       | 32 KB |          |
| ATmega328P      | 20 MHz       | 32 KB       | 2 KB  | 23       |

PIC and AVR support many peripherals. AVR supports analog input/output. Intel 8051 is an older architecture with limited resources which uses 8-bit instruction set. ARM is a newer architecture with more powerful features and better performance, but it is more complex and consumes more power than PIC and AVR.
