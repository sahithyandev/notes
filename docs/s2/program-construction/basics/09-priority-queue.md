---
title: Priority Queue
sidebar:
  order: 9
slug: program-construction/basics/priority-queue
prev: true
next: true
---

A special type of queue where elements are processed based on their priority
rather than their insertion order. Implements a priority heap data structure
where elements are ordered according to their natural ordering or a custom
comparator.

Used in:
- Task scheduling by priority
- Event handling systems
- [Dijkstra's shortest path algorithm](http://localhost:4321/data-structures-and-algorithms/algorithms/dijkstras-algorithm/)
- Huffman coding compression
- Network traffic prioritization

## Key characteristics

- Elements are stored in a priority heap - a complete binary tree
- The head (first element) is always the smallest element based on natural
  ordering
- When elements are removed, the next smallest element becomes the head
- Elements must be comparable (implement Comparable) or use a Comparator
- Does not allow null elements
- Not thread-safe (use PriorityBlockingQueue for concurrent access)

Basic Example:

```java
PriorityQueue<Integer> pQueue = new PriorityQueue<>();

// Adding elements
pQueue.add(10);
pQueue.add(5);
pQueue.add(15);

// Will print in order: 5, 10, 15
while(!pQueue.isEmpty()) {
    System.out.println(pQueue.poll());
}
```

## Common Methods

- `add(E element)` - Inserts element
- `offer(E element)` - Adds element (preferred method)
- `peek()` - Returns but does not remove head element
- `poll()` - Returns and removes head element
- `remove(Object obj)` - Removes specific element
- `clear()` - Removes all elements
- `size()` - Returns number of elements

### Difference Between `add` and `offer`

Both `add` and `offer` methods are used to insert elements into the priority queue.

- `add(E element)`:
  - Throws an `IllegalStateException` if the queue has a fixed capacity and is full.
  - Suitable for cases where you are certain the queue can accommodate the new element.

- `offer(E element)`:
  - Returns `true` if the element was successfully added, or `false` if the queue is full (in case of a bounded queue).
  - Preferred for scenarios where you want to handle capacity constraints gracefully without exceptions.

## Example

```java
// Custom comparator for reverse order
PriorityQueue<Integer> pQueue = new PriorityQueue<>((a, b) -> b - a);

pQueue.offer(10);
pQueue.offer(5);
pQueue.offer(15);

// Will print in order: 15, 10, 5
while(!pQueue.isEmpty()) {
    System.out.println(pQueue.poll());
}
```

## Complexity

| Operation | Time        | Space  |
| --------- | ----------- | ------ |
| Insertion | $O(\log n)$ | $O(1)$ |
| Removal   | $O(\log n)$ | $O(1)$ |
| Peek      | $O(1)$      | $O(1)$ |
| Contains  | $O(n)$      | $O(1)$ |
| Size      | $O(1)$      | $O(1)$ |
