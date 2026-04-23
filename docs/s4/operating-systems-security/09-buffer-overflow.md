---
title: Buffer Overflow
sidebar:
  order: 9
slug: s4/operating-systems-security/buffer-overflow
prev: true
next: true
dateCreated: 2026-04-23T17:39:39.629Z
lastUpdatedOn: 2026-04-23T17:39:39.629Z
---

Occurs when a program writes more data into a buffer than the allocated memory space.

- Data exceeds allocated memory
- Adjacent memory regions are overwritten
- Often occurs in languages like **C/C++**

## Shellcode

The malicious machine code injected by attackers through exploits such as buffer overflows.

## Effects of Buffer Overflow

Possible outcomes:

- Overwrite program data
- Overwrite instructions
- Execute attacker code
- Crash the program (Denial of Service)
- Gain system privileges

## Reasons

### Programmer error

```c
char sample[10];
for (i=1; i<=10; i++)
    sample[i] = 'A';
```

This writes one char beyond the allocated buffer. This exact example is referred to as _off-by-one error_.

### Unsafe libraries

Certain standard C functions do not check buffer size before copying data, and are vulnerable to overflow.

Examples:

- `gets()`
- `sprintf()`
- `strcat()`
- `strcpy()`
- `vsprintf()`

## Stack Buffer Overflow

A stack overflow attack overwrites data on the stack, often modifying the **return address**.

1. Function call stores return address in stack.
2. Buffer overflow overwrites this address.
3. Program returns to attacker-controlled code.

- Often executed after overflow
- Typically launches a command shell
- Architecture and OS specific

Example functionality:

- Launch remote shell
- Execute system commands
- Gain system control

## Solutions

Two major defense categories:

### Compile-Time Defenses

Security mechanisms applied during program compilation.

- Use safer programming languages
- Apply secure coding practices
- Replace unsafe libraries
- Stack protection mechanisms

Examples:

- Stack canaries
- StackShield
- Return Address Defender

### Run-Time Defenses

Protection mechanisms applied during program execution.

_Executable Address Space Protection_ marks certain memory regions as non-executable.

_Address Space Layout Randomization_ (aka. _ASLR_) randomizes locations of:

- Stack
- Heap
- Libraries

_Guard pages_ can also be used which are special memory pages that trigger errors if accessed.
