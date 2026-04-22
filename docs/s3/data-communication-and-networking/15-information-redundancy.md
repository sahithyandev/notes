---
title: Information Redundancy
sidebar:
  order: 15
slug: s3/data-communication-and-networking/information-redundancy
prev: true
next: true
dateCreated: 2026-04-22T07:09:10.692Z
lastUpdatedOn: 2026-04-22T07:15:36.793Z
---


Extra, redundant bits are added to the transmitted data so that the receiving end can detect errors and maybe correct them as well.

## Code

A systematic way of representing data using specific patterns of bits.

Usually, redundant bits are included with the original data. To enable the detection, and sometimes correction, of errors that may occur during transmission.

### Separability

When A code has separate fields for the data and the code bits.

When a code is separable, the decoding is easier.

## Parity

Simplest separable code scheme. Includes $d$ data bits and $1$ parity bit. Parity bit is added so that the total number of 1's in the code ($d+1$ bits) is even or odd.

### 2D Parity

Extended version of parity bit for a matrix of bits. Parity bits are added for each row and each column. Can find a unique erroneous bit.

2D parity is commonly used in memory systems and communication protocols where simple error detection and correction are needed.

## Hamming Distance

Between 2 code words, the number of differing bits in matching positions.

## Hamming Code
Developed based on hamming distance concept. Assigns multiple parity bits to cover each bit of
data. Many hamming code schemes exist. For simplicity, (7,4) single error correcting (SEC) Hamming Code will be discussed here.

Suppose a hamming code has $d$ data bits and $r$ parity bits. The following equation must be satisfied:

```math
d + r + 1 \leq 2^r
```

Because $r$ parity bits can be used to denote $2^r$ states. Each bit position in the word requires a state, and another additional one to denote no errors.

Parity bits are placed at positions $2^i$ for $i = 0, 1, 2$.

### (7,4) SEC Hamming Code

Uses 7 bit code (4 data bits + 3 parity bits). Can correct single bit errors.

## CRC

Short for Cyclic Redundancy Checksum. A non-separable code. A divisor polynomial (of $c$ bits) is used. The message is considered to be a polynomial. Binary division is done for message (after padding with $c-1$ zeros), with the divisor. Remainder is appended to the message.
