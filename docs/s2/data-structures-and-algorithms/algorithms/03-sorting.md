---
title: Sorting
sidebar:
  order: 3
slug: data-structures-and-algorithms/algorithms/sorting
prev: true
next: true
---

### Properties of sorting

- Comparison / Non Comparison - In non-comparison based sorting, elements are sorted from their intrinsic properties instead.
- In-place/Outplace – Means if extra memory is used while sorting. In-place algorithms have $O(1)$ space complexity.
- Online/Offline – A sorting is considered online if it can
  accept new data while the procedure is ongoing
- Stable/Unstable technique – A sorting is stable if the order of elements with the same value is preserved while sorting.

## Common sorting algorithms

All sorting algorithms explained below are comparison-based sorting algorithms.

### Bubble sort

Biggest or smallest elements are _bubbled_ to the end or start by swapping each
consecutive pair.

### Insertion sort

Works by building a sorted portion of the array one element at a time.

Start with the second element: Assume the first element is already sorted. Compare the second element with the first, shifting it into the correct position if needed. Move to the next element: Compare it with the sorted portion, shifting larger elements to the right and inserting it into its correct position. Repeat this process for each element until all are sorted.

### Merge sort

The array to be sorted is sorted into two sub arrays, with the length $n/2$. The
two sub-arrays are sorted recursively and then merged. $ $

### Quicksort

A divide-and-conquer algorithm. A pivot element is selected. The array is partitioned into 2 sub-arrays:

- elements less than the pivot
- elements greater than the pivot

The sub-arrays are then sorted recursively.

Faster than merge sort. Worst case ($O(n^2)$) occurs when the partition scheme is bad and the list is
almost sorted. $ $

### Heap sort

Uses a [binary heap](/data-structures-and-algorithms/data-structures/heap/) data structure. Operates in two main phases:

1. Heap Construction: The input array is transformed into a max heap, where the largest element is at the root of the heap.
2. Sorting: The largest element (root of the heap) is swapped with the last element of the array. The heap size is reduced, and the heap property is restored by re-heapifying the remaining elements. This process is repeated until all elements are sorted.

Slower than quick sort.

### Tim sort

Created by Tim Peters. A highly optimized version of merge sort. Used in
Python's `List.sort()` and `sorted()` and Java's `Collection.sort()`.

### Powersort

Built on top of Tim sort. Optimizes the merge phase of tim sort.

### Introsort

Begins with quick sort. In large lists, switches to heap sort. The switch
happens when the recursion depth of quick sort exceeds a level proportional to $\log n$. Switches to insertion sort, once the partition size
is small enough. Used in C++'s `std::sort()`. $ $

### Dual-Pivot Quick sort

Two pivots are selected in each end of the array. Left pivot must be smaller
than the right pivot. The dataset is partitioned into 3 parts.

- Less than left pivot
- Greater than or equal to left pivot and less than right pivot
- Greater than right pivot

The partitions are recursively sorted. Used in Java's `Array.sort()`.

## Comparison

The table below includes information about various sorting algorithms. The table
can be scrolled horizontally.

<section class="scrollable-table">

| Property       | Online | Stable | Best Time    | Average Time   | Worst Time     | Memory      |
| -------------- | ------ | ------ | ------------ | -------------- | -------------- | ----------- |
| Bubble sort    | No     | Yes    | $O(n^2)$     | $O(n^2)$       | $O(n^2)$       | $O(1)$      |
| Selection sort | No     | No     | $O(n^2)$     | $O(n^2)$       | $O(n^2)$       | $O(1)$      |
| Insertion sort | Yes    | Yes    | $O(n)$       | $O(n^2)$       | $O(n^2)$       | $O(1)$      |
| Shell sort     | No     | No     | $O(n\log n)$ | $O(n\log^2 n)$ | $O(n\log^2 n)$ | $O(1)$      |
| Merge sort     | No     | Yes    | $O(n\log n)$ | $O(n\log n)$   | $O(n\log n)$   | $O(n)$      |
| Quick sort     | Yes    | No     | $O(n\log n)$ | $O(n\log n)$   | $O(n^2)$       | $O(\log n)$ |
| Heap sort      | No     | No     | $O(n\log n)$ | $O(n\log n)$   | $O(n\log n)$   | $O(1)$      |
| Tim sort       | Yes    | Yes    | $O(n\log n)$ | $O(n\log n)$   | $O(n\log n)$   | $O(n)$      |
| Power sort     | Yes    | Yes    | $O(n\log n)$ | $O(n\log n)$   | $O(n\log n)$   | $O(n)$      |
| Intro sort     | No     | No     | $O(n\log n)$ | $O(n\log n)$   | $O(n\log n)$   | $O(\log n)$ |

</section>

:::note

Theoritically, comparison based sorting cannot be faster than $O(n\log n)$. Non-comparison sorting cannot be faster than $O(n)$.

:::
