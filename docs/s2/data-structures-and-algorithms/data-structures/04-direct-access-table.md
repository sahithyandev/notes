---
title: Direct Access Table
sidebar:
  order: 4
slug: data-structures-and-algorithms/data-structures/direct-access-table
prev: true
next: true
---

Items are stored in an array and can be accessed directly using their indices. Access time complexity is $O(1)$. The index for an item is derived from the item itself. $ $

DATs can only be used when:
- items can be uniquely identified and can be mapped to array indices
- memory space is not a major constraint
- the key range is reasonable compared to amount of data

Limitations of DATs:

- Can be wasteful of memory if key range is large but sparse
- Not suitable for dynamic resizing
- Does not maintain any ordering of elements

Common use cases include:

- Symbol tables in compilers
- Character encoding tables
- Small lookup dictionaries
- Cache implementations
