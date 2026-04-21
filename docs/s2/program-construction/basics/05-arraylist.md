---
title: ArrayList
sidebar:
  order: 5
slug: program-construction/basics/arraylist
prev: true
next: true
---

A resizable array implementation of the `List` interface from the Java
Collections Framework. Allows dynamic resizing and provides methods to
manipulate the stored elements. Supports a generic to hint the type of elements.
Cannot hold primitive types, like int, char, etc. Wrapper classes are needed.

By default, an `ArrayList` has an initial capacity of 10 elements. When the number of elements exceeds this capacity, the `ArrayList` automatically increases its capacity by approximately 50%. Each element has a memory overhead of 24 bytes.

## Complexity

| Operation                        | Time   | Space  |
| -------------------------------- | ------ | ------ |
| Inserting Element in ArrayList   | $O(1)$ | $O(n)$ |
| Removing Element from ArrayList  | $O(n)$ | $O(1)$ |
| Traversing Elements in ArrayList | $O(n)$ | $O(n)$ |
| Replacing Elements in ArrayList  | $O(1)$ | $O(1)$ |
