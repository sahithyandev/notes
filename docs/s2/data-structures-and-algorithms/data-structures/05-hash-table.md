---
title: Hash Table
sidebar:
  order: 5
slug: data-structures-and-algorithms/data-structures/hash-table
prev: true
next: true
---

A data structure that implements an associative array, a structure that can map
keys to values. It uses a hash function to compute an index into an array of
buckets or slots, from which the desired value can be found.

Widely used in various applications such as databases, caches, and sets due to
their efficiency in handling large datasets.

### Advantages

- Fast Lookups: Average-case time complexity for lookups, insertions, and
  deletions is $O(1)$.
- Efficient: Can handle large amounts of data efficiently.

### Disadvantages

- Collisions: Can degrade performance if not handled properly.
- Memory Usage: May require more memory compared to other data structures.

## Hash function

A function that maps a given key into an index in the array. The efficiency
of a hash table depends on the quality of the hash function and the method used
to handle collisions.

It's best if the hash function outputs uniformly distributed values, which reduces the likelihood of collisions.

## Designing hash functions

A good hash function distributes keys uniformly across the array, minimizing collisions. And it should be one-to-one.

### Division Method

The hashed value is the remainder of the key divided by the size of the array.

```math
H(k) = k \mod m
```

Usually, $m$ is chosen as a prime, not close to power of 2.

### Multiplication Method

The hashed value is the fractional part of the product of the key and a constant.

```math
H(k) = \lfloor m(kA \mod 1) \rfloor\;\; \text{where}\; 0\lt A \lt 1
```

Usually, $m$ is a power of 2, but can be any value.

### Folding Method

The hashed value is the sum of the digits of the key.

### Universal Hashing

A method that uses a family of hash functions to reduce the likelihood of
collisions.

The hash function is chosen randomly from a carefully designed family of hash functions.

## Buckets

Array slots where the values are stored.

### Load Factor

The ratio of the number of elements in the hash table to the number of buckets.

```math
\text{Load Factor} = \frac{\text{Number of Elements}}{\text{Number of Buckets}}
```

Must be kept reasonable for optimal performance. Probably between 0.5 and 0.75.

- Low Load (α < 0.5): Excellent performance
- Medium Load (0.5 ≤ α < 0.8): Good performance
- High Load (α ≥ 0.8): Performance degrades significantly

## Collisions

Situations where two keys hash to the same index. These are typically handled
using techniques like chaining or open addressing. [Collision handling](/data-structures-and-algorithms/algorithms/collision-handling/) is  explained separately.

## Operations

Before any operation, the hash function is applied to the key to find the index. The implementation details of the operations would depend on the chosen collision handling technique.

- Insertion
- Deletion
- Search
