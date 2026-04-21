---
title: C Basics
sidebar:
  order: 3
slug: program-construction/basics/c-basics
prev: true
next: true
---

## Memory management

Memory is allocated either implicitly (variable declaration) or explicitly
(`malloc()`) and deallocated either implicitly (by the compiler) or explicitly
(`free()`)

Memory layout in C is similar to the image below.

<figure>

![Memory layout in C](./images/c-memory-layout.jpg)

</figure>

- text - readonly. stores compiled machine code. fixed size, determined at compile time.
- data - initialized variables. stores global and static variables. readable & writable. fixed size, determined at compile time.
- bss - short for block started by symbol. uninitialized variables. stores global and static variables that are uninitialized or initialized to 0. fixed size, determined at compile time. automatically initialized to 0 by OS.
- heap and stack grows in the opposite directions
- heap can have gaps but stack cannot

## Undefined Behavior

A behavior which is specified as unpredictable in the language specification in
which a program is written.

There are a lot of cases for undefined behavior in C.

- Usage of a deallocated (using `free` or `realloc`) pointer
- The pointer argument to `free` or `realloc` doesn't match a pointer earlier
  returned by `calloc`, `malloc` or `realloc`.
- The pointer argument to `free` or `realloc` which is already deallocated using
  `free` or `realloc`
- A non-null pointer pointing to zero requested size is used to access an object

## String

A string is an array of `char`. They are null terminated using the null
character (or `\0` or `NUL`). The null character is added automatically to the
end of the array by the compiler.
