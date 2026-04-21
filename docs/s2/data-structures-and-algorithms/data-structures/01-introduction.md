---
title: Introduction to Data Structures
sidebar:
  label: Introduction
  order: 1
slug: data-structures-and-algorithms/data-structures/introduction
prev: false
next: true
---

Revise [S1](https://s1.sahithyan.dev) for
[data structures](https://s1.sahithyan.dev/programming-fundamentals/b-book/data-types/).
Defines how data is stored in the computer.

## Array

A fixed-size linear collection of elements. The elements are placed next to each
other in continuous memory.

## Linked List

A linear collection of elements. The elements are placed in non-continuous
memory and the order is preserved using "links".

### Singly Linked List

Each element stores the pointer to the next element. Last element points to
null.

### Doubly Linked List

Each element stores the pointer to both the previous and the next element. First
element's previous element and last element's next element are null.

## Stack

Works as LIFO.

## Queue

Works as FIFO.

### Priority Queue

A queue where elements are ordered by priority. Elements with higher priority are
dequeued before elements with lower priority.

```cpp
#include <iostream>
#include <vector>

class PriorityQueue {
public:
    void push(int value) {
        pq.push_back(value);
        siftUp(pq.size() - 1);
    }

    void pop() {
        if (!pq.empty()) {
            std::swap(pq[0], pq.back());
            pq.pop_back();
            if (!pq.empty()) {
                siftDown(0);
            }
        } else {
            std::cout << "Queue is empty!" << std::endl;
        }
    }

    int top() {
        if (!pq.empty()) {
            return pq[0];
        } else {
            std::cout << "Queue is empty!" << std::endl;
            return -1; // Return an invalid value to indicate an empty queue
        }
    }

    bool empty() {
        return pq.empty();
    }

private:
    std::vector<int> pq;

    void siftUp(int index) {
        while (index > 0) {
            int parent = (index - 1) / 2;
            if (pq[index] > pq[parent]) {
                std::swap(pq[index], pq[parent]);
                index = parent;
            } else {
                break;
            }
        }
    }

    void siftDown(int index) {
        int size = pq.size();
        while (index < size) {
            int leftChild = 2 * index + 1;
            int rightChild = 2 * index + 2;
            int largest = index;

            if (leftChild < size && pq[leftChild] > pq[largest]) {
                largest = leftChild;
            }
            if (rightChild < size && pq[rightChild] > pq[largest]) {
                largest = rightChild;
            }
            if (largest != index) {
                std::swap(pq[index], pq[largest]);
                index = largest;
            } else {
                break;
            }
        }
    }
};

int main() {
    PriorityQueue pq;

    pq.push(10);
    pq.push(20);
    pq.push(15);

    std::cout << "Top element: " << pq.top() << std::endl; // Output: 20

    pq.pop();
    std::cout << "Top element after pop: " << pq.top() << std::endl; // Output: 15

    return 0;
}
```
