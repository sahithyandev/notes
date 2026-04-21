---
title: Collision Handling
sidebar:
  order: 9
slug: data-structures-and-algorithms/algorithms/collision-handling
prev: true
next: true
---

When a collision occurs in a [hash table](/data-structures-and-algorithms/data-structures/hash-table), it must be handled using one of the available methods.

## Chaining

Each bucket contains a linked list of entries that hash to the same index.
Insertion involves appending to the list, and search involves traversing the
list. Simpler. Consumes extra memory.

When to choose chaining:

- Unknown or highly variable number of elements
- Frequent insertions and deletions
- Simplicity is important
- Memory is not a primary constraint

## Open Addressing

When a collision occurs, the algorithm searches for the next available slot in
the array using a probing sequence. Common probing methods include linear
probing, quadratic probing, and double hashing. Memory efficient.

When to choose open addressing:

- Memory efficiency is crucial
- Cache performance is important
- Load factor can be controlled
- Deletions are infrequent

When open addressing is used, deletion cannot be performed normally. To maintain probe sequences for search, the item to be deleted is marked as "deleted", instead.

### Linear Probing

The algorithm searches for the next available slot in the array by checking the
subsequent slots one by one until an empty slot is found.

### Quadratic Probing

The algorithm searches for the next available slot in the array by checking
slots at intervals that increase quadratically (e.g., 1, 4, 9, 16, ...).

## Double Hashing

The algorithm uses a second hash function to calculate the interval between
probes, reducing the likelihood of clustering and improving performance.

## Comparison

|                         | Chaining                  | Open Addressing           |
| ----------------------- | ------------------------- | ------------------------- |
| Memory Usage            | Extra memory for pointers | More memory efficient     |
| Cache Performance       | Poor (pointer chasing)    | Better (array locality)   |
| Load Factor Sensitivity | Less sensitive            | Very sensitive            |
| Implementation          | Simpler                   | More complex              |
| Deletion                | Simple                    | Requires special handling |

Chaining is more forgiving and easier to implement, while open addressing can be more efficient but requires careful management of the load factor and special handling for deletions.

### Time Complexity

Here $\alpha$ is the load factor.

| Operation | Chaining      | Linear Probing    | Quadratic Probing | Double Hashing    |
| --------- | ------------- | ----------------- | ----------------- | ----------------- |
| Insert    | $O(1)$        | $O(1/(1-\alpha))$ | $O(1/(1-\alpha))$ | $O(1/(1-\alpha))$ |
| Search    | $O(1+\alpha)$ | $O(1/(1-\alpha))$ | $O(1/(1-\alpha))$ | $O(1/(1-\alpha))$ |
| Delete    | $O(1+\alpha)$ | $O(1/(1-\alpha))$ | $O(1/(1-\alpha))$ | $O(1/(1-\alpha))$ |
