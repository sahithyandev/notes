---
title: Microcontroller Programming
sidebar:
  order: 7
slug: s4/iot/microcontroller-programming
prev: true
next: true
dateCreated: 2026-04-23T17:39:39.625Z
lastUpdatedOn: 2026-04-23T17:39:39.625Z
---

To program a microcontroller, a basic development setup is required, which includes:
- Microcontroller development board
- Computer with an IDE
- Programming cable or adapter
- Power supply
- Input/output devices

Programs are typically written in high-level languages such as C or C++, compiled into machine code, and uploaded to the microcontroller.

## In-Circuit Serial Programming

Aka. ICSP. Allows program code to be written directly into the microcontroller while it is mounted in the circuit. Uses a serial connection to a host computer. Writes object code into program memory.

Does not require removing the chip from the system. Simplifies development and firmware updates during testing.

## In-Circuit Debugging

Aka. ICD. Allows developers to observe and control program execution inside the microcontroller.

## Over-the-Air Programming

Aka. OTA. Enables firmware updates through wireless communication. Uses Wi-Fi or other wireless links. Implemented using bootstrap software. Limited debugging capabilities.

## Arduino IDE

The software environment used to write, compile, and upload programs to Arduino boards. The programs are written in a simplified version of C++ and can be easily uploaded to the board via USB.

Works cross-platform (Windows, Linux, macOS). Includes serial monitor for debugging.

The IDE converts Arduino code into machine instructions and uploads it to the board via USB.

### Arduino Program Structure

#### Setup Function

The `setup()` function runs once when the program starts.

Used to:

- Configure pin modes
- Initialize peripherals
- Set initial conditions

#### Loop Function

The `loop()` function runs continuously after `setup()`.

Used to:

- Read sensor inputs
- Control logic
- Operate actuators
