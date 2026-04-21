---
title: Encoders & Decoders
sidebar:
  order: 9
slug: computer-organization-and-digital-design/combinational-logic/encoders-decoders
prev: true
next: true
---

Used to facilitate efficient data transmission by reducing the number of data
lines required. Falls under medium-scale integrated (MSI) circuits group.

## Encoder

Converts $n$ input lines into $m$ output lines where $n = 2^m$.

In simple encoders, in the input lines, maximum one will be active at a time.

![4-to-2 Encoder](./images/4-to-2-encoder.jpg)

### Priority Encoder

Input lines are given a priority. When 2 or more input lines are activated, the
highest priority input will take precedence. An improvement over simple encoder
at the cost of extra logic. Used in interrupt controllers and as positional
encoders.

### Decimal to BCD Encoder

Converts each digit of a decimal number into its 4-bit binary equivalent. For
example, $12$ becomes $0001_2$ and $0010_2$.

### Octal to Binary Encoder

Converts octal digits (each represented by 3 bits) into binary. Example: Octal
$23_8$ becomes binary $010\;011_2$.

### Hexadecimal to Binary Encoder

Converts each hex digit (represented by 4 bits) into binary. Example: $A_{16}$
becomes $1010_2$.

## Decoder

![2-to-4 Decoder](./images/2-to-4-decoder.jpg)

Opposite of encoder. Have $m$ inputs and $n$ outputs where $m = \log_2{n}$.

Decoders are by-default active HIGH. If made using NAND gates, then it will
active LOW.

By default, the decoder require a $n$-input AND gates, which is bad as $n$
increases. The solution is to build higher order decoders using smaller
decoders.

![3-to-8 Decoder using two 2-to-4 decoders](./images/3-to-8-decoder-using-2-to-4-decoders.jpg)

Each output in the decoder is a minterm. Using a set of OR gates, The minterms can be combined to implement any function.
