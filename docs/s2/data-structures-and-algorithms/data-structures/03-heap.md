---
title: Heap
sidebar:
  order: 3
slug: data-structures-and-algorithms/data-structures/heap
prev: true
next: true
---

A special type of binary tree with an additional property called _the heap
property_.

Used in:

- [Priority Queues](/data-structures-and-algorithms/data-structures/introduction/#priority-queue)
- [Heap Sort](/data-structures-and-algorithms/algorithms/sorting/#heap-sort)
- Graph Algorithms: Used in algorithms like [Dijkstra's shortest path](/data-structures-and-algorithms/algorithms/dijkstras-algorithm/) and
  [Prim's minimum spanning tree](/data-structures-and-algorithms/algorithms/prims-algorithm/).

2 types:

- Max heap - root node is the largest
- Min heap - root node is the smallest

Here, max heaps are explained. The same reasoning and logic can be adapted for
min heaps.

### Heap property

For any given node $I$, the value of $I$ is greater than or equal to the values
of its children.

## Implementation

### Array based

The relation between the parent node
and its child node(s) is important. Better than linked based implementation in terms of performance. Array based implementation is used in the below operations section.

#### 0-based index

```math
\text{ParentIndex}(\text{child}) = \bigg\lfloor \frac{\text{child} - 1}{2} \bigg\rfloor
```

```math
\text{LeftChildIndex}(\text{parent}) = 2 * \text{parent} + 1
```

```math
\text{RightChildIndex}(\text{parent}) = 2 * \text{parent} + 2
```

#### 1-based index

```math
\text{ParentIndex}(\text{child}) = \bigg\lfloor \frac{\text{child}}{2} \bigg\rfloor
```

```math
\text{LeftChildIndex}(\text{parent}) = 2 * \text{parent}
```

```math
\text{RightChildIndex}(\text{parent}) = 2 * \text{parent} + 1
```

### Linked List based

Less common due to performance considerations. Each node in the linked list represents a node in the heap, with pointers to its left and right children.

```cpp
#include <iostream>
using namespace std;

struct Node {
  int value;
  Node* left;
  Node* right;

  Node(int val) : value(val), left(nullptr), right(nullptr) {}
};

// Example of inserting a node (manual linking required for simplicity)
Node* insert(Node* root, int value) {
  if (!root) return new Node(value);

  if (value > root->value) {
    swap(value, root->value);
  }

  if (!root->left) {
    root->left = insert(root->left, value);
  } else if (!root->right) {
    root->right = insert(root->right, value);
  } else {
    root->left = insert(root->left, value); // Continue to left subtree
  }

  return root;
}

void printHeap(Node* root) {
  if (!root) return;
  cout << root->value << " ";
  printHeap(root->left);
  printHeap(root->right);
}

int main() {
  Node* heap = nullptr;

  heap = insert(heap, 10);
  heap = insert(heap, 20);
  heap = insert(heap, 5);
  heap = insert(heap, 30);

  printHeap(heap);

  return 0;
}
```

In this implementation, the `insert` function maintains the heap property by swapping values as needed. However, managing the structure manually makes this approach less efficient compared to array-based heaps.

## Operations

### Insertion

To insert an element into a max heap, follow these steps:

1. Add the new element at the end of the heap.
2. Compare the added element with its parent; if the added element is greater,
   swap them.
3. Repeat step 2 until the heap property is restored or the element becomes the
   root.

Runs in $O(\log n)$ time. $ $

```cpp
#include <iostream>
#include <vector>

using namespace std;

void heapifyUp(vector<int>& heap, int index) {
  if (index == 0) return; // If the element is at the root, stop

  int parentIndex = (index - 1) / 2;
  if (heap[index] > heap[parentIndex]) {
    swap(heap[index], heap[parentIndex]);
    heapifyUp(heap, parentIndex); // Recursively heapify up
  }
}

void insert(vector<int>& heap, int value) {
  heap.push_back(value); // Add the new element at the end
  heapifyUp(heap, heap.size() - 1); // Restore the heap property
}

int main() {
  vector<int> maxHeap;

  insert(maxHeap, 10);
  insert(maxHeap, 20);
  insert(maxHeap, 5);
  insert(maxHeap, 30);

  for (int i : maxHeap) {
    cout << i << " ";
  }

  return 0;
}
```

The `heapifyUp` function restores the heap property starting from a child node,
and going up. The `insert` function adds a new element to the heap.

### Deletion

To delete the root element from a max heap:

1. Replace the root element with the last element in the heap.
2. Remove the last element.
3. Compare the new root with its children; if the new root is smaller than one
   of its children, swap it with the larger child.
4. Repeat step 3 until the heap property is restored or the new root becomes a
   leaf.

Runs in $O(\log n)$ time. $ $

```cpp
#include <iostream>
#include <vector>

using namespace std;

void heapify(vector<int>& heap, int index) {
  int leftChild = 2 * index + 1;
  int rightChild = 2 * index + 2;
  int largest = index;

  if (leftChild < heap.size() && heap[leftChild] > heap[largest]) {
    largest = leftChild;
  }

  if (rightChild < heap.size() && heap[rightChild] > heap[largest]) {
    largest = rightChild;
  }

  if (largest != index) {
    swap(heap[index], heap[largest]);
    heapify(heap, largest); // Recursively heapify down
  }
}

void deleteRoot(vector<int>& heap) {
  if (heap.size() == 0) return;

  heap[0] = heap.back(); // Replace root with the last element
  heap.pop_back(); // Remove the last element
  heapifyDown(heap, 0); // Restore the heap property
}

int main() {
  vector<int> maxHeap = {30, 20, 10, 5};

  deleteRoot(maxHeap);

  for (int i : maxHeap) {
    cout << i << " ";
  }

  return 0;
}
```

The `heapifyDown` function restores the heap property after deletion by going
down the tree. The `deleteRoot` function removes the root element from the heap.

### Peek

To view the root element. Always $O(1)$ regardless of the implementation. $ $

```cpp
#include <iostream>
#include <vector>

using namespace std;

int peek(const vector<int>& heap) {
  if (heap.empty()) {
    throw runtime_error("Heap is empty");
  }
  return heap[0]; // Return the root element
}

int main() {
  vector<int> maxHeap = {30, 20, 10, 5};

  try {
    cout << "Top element: " << peek(maxHeap) << endl;
  } catch (const runtime_error& e) {
    cout << e.what() << endl;
  }

  return 0;
}
```

## Comparison

| Implementation    | Operation | Best Case   | Average Case | Worst Case  |
| ----------------- | --------- | ----------- | ------------ | ----------- |
| Array             | Insertion | $O(1)$      | $O(\log n)$  | $O(\log n)$ |
| Array             | Deletion  | $O(\log n)$ | $O(\log n)$  | $O(\log n)$ |
| Array/Linked List | Peek      | $O(1)$      | $O(1)$       | $O(1)$      |
| Linked list       | Insertion | $O(1)$      | $O(n)$       | $O(n)$      |
| Linked list       | Deletion  | $O(1)$      | $O(n)$       | $O(n)$      |
