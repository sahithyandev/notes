---
title: Breadth First Search
sidebar:
  order: 6
slug: data-structures-and-algorithms/algorithms/breadth-first-search
prev: true
next: true
---

Aka. level order searching. Another algorithm for traversing or searching tree or graph data structures. It starts at the root node and explores all neighbors at the present depth before moving on to nodes at the next depth level. Queue is usually used to store the discovered nodes.

## In [Trees](/data-structures-and-algorithms/data-structures/tree)

A queue is used. Starting from the root node, the algorithm processes each node level by level. It enqueues the root, then repeatedly dequeues a node, processes it, and enqueues its children. Repeat until the queue is empty.

```cpp
#include "iostream"
#include <queue>

using namespace std;

struct Node {
    int value;
    Node* left;
    Node* right;
};

void bfsInTree(Node* root) {
    queue<Node*> q;
    q.push(root);
    while (!q.empty()) {
        Node* top = q.front();
        q.pop();

        if (top->left != NULL) {
            q.push(top->left);
        }
        if (top->right != NULL) {
            q.push(top->right);
        }
        cout << top->value << " ";
    }
}
```

## In [Graphs](/data-structures-and-algorithms/data-structures/graph)

All neighbours to the current nodes are processed before moving on to nodes at the next depth level. A queue is used for storing the discovered nodes. Visits nodes level by level. Results in a single root tree.

The steps:

1. Select a node to start traversal.
2. Use a queue to store the _discovered_ nodes.
3. Use an array to store the _visited_ nodes.
4. Push the node to the queue.
5. Dequeue from queue. Mark it visited.
6. Push all unvisited adjacent nodes to the queue.
7. Repeat steps 4-6 until queue is empty.

Can be used to find the shortest path in an unweighted graph. Uses slightly more memory than DFS. Used in cycle detection.

Complexities:
- Time: $O(V + E)$
- Space: $O(V)$

```cpp
#include <iostream>
#include <vector>
#include <queue>
using namespace std;

void bfs(int startNode, const vector<vector<int>>& graph) {
    vector<bool> visited(graph.size(), false);
    queue<int> q;

    q.push(startNode);
    visited[startNode] = true;

    while (!q.empty()) {
        int current = q.front();
        q.pop();
        cout << current << " ";

        for (int neighbor : graph[current]) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                q.push(neighbor);
            }
        }
    }
}

int main() {
    vector<vector<int>> graph = {
        {1, 2},    // Node 0
        {0, 3, 4}, // Node 1
        {0, 4},    // Node 2
        {1},       // Node 3
        {1, 2}     // Node 4
    };

    cout << "BFS Traversal: ";
    bfs(0, graph);
    return 0;
}
```
