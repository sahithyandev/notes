---
title: Tree
sidebar:
  order: 2
slug: data-structures-and-algorithms/data-structures/tree
prev: true
next: true
---

A widely used abstract data type that simulates a hierarchical tree structure
with a set of connected nodes.

Used in various applications
such as databases, file systems, and network routing algorithms.

## Terminology

### Root

The topmost node in a tree. It is the only node that has no parent.

### Node

Each element in the tree. A node contains a value or data and may have a parent
and child nodes.

### Edge

The connection between two nodes.

### Child

A node directly connected to another node when moving away from the root.

### Parent

A node directly connected to another node when moving towards the root.

### Leaf

A node that does not have any children.

### Subtree

A tree consisting of a node and its descendants.

### Height

The length of the longest path from the root to a leaf.

### Depth

The length of the path from the root to a node.

## Common Operations

- Insertion: Adding a node to the tree.
- Deletion: Removing a node from the tree.
- Traversal: Visiting all the nodes in some order
  - In-order Traversal: left, root, right
  - Pre-order Traversal: root, left, right
  - Post-order Traversal: left, right, root
  - Level-order Traversal: Visit nodes level by level from top to bottom.
- [Searching](/data-structures-and-algorithms/algorithms/searching/#depth-first-search-dfs): Finding a node in the tree.

## Binary Tree

Each node has at most 2 children: left and right. Used to implement efficient
searching and sorting algorithms.

## Binary Search Tree

A binary tree where the left child contains only nodes with values less than the
parent node, and the right child contains only nodes with values greater than
the parent node.

$n$-th Catalan number gives the total number of unique binary search trees formed from $n$ distinct elements. Denoted by $C_n$.

```math
C_{n} = \frac{1}{n+1} \binom{2n}{n} = \frac{1}{n+1} \cdot \frac{(2n)!}{n!n!}
```

### Insertion Logic

After adding the new node, the tree must remain valid.

- Start at the Root: Begin at the root node.
- Compare Values: Compare the value to be inserted with the value of the current
  node.
- Move Left or Right:
  - If the value is less than the current node's value, move to the left child.
  - If the value is greater than the current node's value, move to the right
    child.
- Insert the Node: When a `null` position is reached, the new node is inserted.

### Deletion Logic

Deletion algorithm depends on the node to be deleted.

- Node with No Children: Simply remove the node.
- Node with One Child: Remove the node and replace it with its child.
- Node with Two Children: Find the in-order successor (smallest node in the
  right subtree), replace the node's value with the successor's value, and then
  delete the successor.
  
## Types

### Balanced Tree

A tree data structure where the height difference between the left and right subtrees of any node is minimal, typically constrained to a specific limit. This ensures that operations like insertion, deletion, and searching can be performed efficiently, maintaining a time complexity close to O(log n). Examples of balanced trees include AVL trees and Red-Black trees.

### AVL Tree

Short for Adelson-Velsky and Landis tree. A self-balancing binary search tree where the difference in heights (also known as the balance factor) of the left and right subtrees of any node is at most one. If this condition is violated during insertion or deletion, rotations (single or double) are performed to restore balance.

Used when frequent lookups are required, as they maintain a strict balance.

### Red-Black Tree

A Red-Black Tree is another type of self-balancing binary search tree that uses an additional property: each node is assigned a color, either red or black. The tree maintains balance through a set of rules:
- The root is always black.
- Red nodes cannot have red children (no two consecutive red nodes).
- Every path from a node to its descendant null pointers must have the same number of black nodes.

These properties ensure that the tree remains approximately balanced, allowing for efficient operations.

Used in applications like implementing associative arrays and priority queues.
