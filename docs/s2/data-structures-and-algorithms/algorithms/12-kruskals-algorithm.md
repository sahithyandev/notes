---
title: Kruskal's Algorithm
sidebar:
  order: 12
slug: data-structures-and-algorithms/algorithms/kruskals-algorithm
prev: true
next: true
---

A [greedy algorithm](/data-structures-and-algorithms/algorithms/introduction#greedy-algorithm) to find [MST](/data-structures-and-algorithms/data-structures/minimum-spanning-tree/) of a [graph](/data-structures-and-algorithms/data-structures/graph/). Sorts all edges by increasing weights and adds them one by one to the MST, ensuring that no cycles are formed.

### Steps

1. Sort Edges: All edges are sorted by their weights in ascending order.
2. Initialize [Union-Find](/data-structures-and-algorithms/data-structures/union-find/): To manage the connected components of the graph.
3. Iterate through edges: For each edge in the sorted list:
   - Check if the edge connects two different components using the Union-Find structure.
   - If it does, add the edge to the MST and merge the two components.
   - If it forms a cycle, skip the edge.
4. Stop When MST is Complete: The algorithm stops when the MST contains exactly $V - 1$ edges

## Implementation

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

// Structure to represent an edge in the graph
struct Edge {
    int src, dest, weight;
};

// Comparator function to sort edges by weight in non-decreasing order
bool compareEdges(const Edge &a, const Edge &b) {
    return a.weight < b.weight;
}

// Union-Find data structure to detect cycles
class UnionFind {
    vector<int> parent, rank;

public:
    UnionFind(int n) : parent(n), rank(n, 0) {
        for (int i = 0; i < n; ++i) {
            parent[i] = i;
        }
    }

    int find(int u) {
        if (u != parent[u]) {
            parent[u] = find(parent[u]); // Path compression
        }
        return parent[u];
    }

    bool unionSets(int u, int v) {
        int rootU = find(u);
        int rootV = find(v);

        if (rootU == rootV) {
            return false; // Cycle detected
        }

        // Union by rank
        if (rank[rootU] > rank[rootV]) {
            parent[rootV] = rootU;
        } else if (rank[rootU] < rank[rootV]) {
            parent[rootU] = rootV;
        } else {
            parent[rootV] = rootU;
            rank[rootU]++;
        }

        return true;
    }
};

// Function to implement Kruskal's Algorithm to find the MST
void kruskalMST(int V, vector<Edge> &edges) {
    // Step 1: Sort all edges in non-decreasing order of their weight
    sort(edges.begin(), edges.end(), compareEdges);

    UnionFind uf(V);
    vector<Edge> result; // To store the edges included in the MST

    // Iterate through all sorted edges
    for (const auto &edge : edges) {
        // Check if adding this edge forms a cycle
        if (uf.unionSets(edge.src, edge.dest)) {
            result.push_back(edge); // Include the edge in the MST
        }

        // Stop if we already have V-1 edges in the MST
        if (result.size() == V - 1) {
            break;
        }
    }

    // Print the edges in the constructed MST
    cout << "Following are the edges in the constructed MST\n";
    for (const auto &edge : result) {
        cout << edge.src << " -- " << edge.dest << " == " << edge.weight << "\n";
    }
}

int main() {
    int V = 6;
    vector<Edge> edges = {
        {0, 1, 1}, {1, 2, 2}, {0, 4, 3}, {0, 3, 4},
        {1, 4, 5}, {2, 5, 6}, {3, 4, 7}, {4, 5, 8}
    };

    kruskalMST(V, edges);

    return 0;
}
```

## Example

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" width="600" height="400" class="mx-auto">
  <style>
    .vertex {
      fill: lightblue;
      stroke: black;
      stroke-width: 1px;
    }
    .edge {
      stroke: currentColor;
      stroke-width: 2px;
    }
    .label {
      font-size: 12px;
      font-weight: bold;
    }
    .weight {
      font-size: .7rem;
      fill: currentColor;
      font-weight: bold;
    }
  </style>

  <!-- Edges -->
  <line x1="50" y1="50" x2="150" y2="50" class="edge" />
  <text x="100" y="45" class="weight" text-anchor="middle">1</text>

  <line x1="150" y1="50" x2="250" y2="50" class="edge" />
  <text x="200" y="45" class="weight" text-anchor="middle">2</text>

  <line x1="50" y1="50" x2="50" y2="150" class="edge" />
  <text x="40" y="100" class="weight" text-anchor="middle">4</text>

  <line x1="50" y1="50" x2="150" y2="150" class="edge" />
  <text x="90" y="108" class="weight" text-anchor="middle">3</text>

  <line x1="150" y1="50" x2="150" y2="150" class="edge" />
  <text x="160" y="100" class="weight" text-anchor="middle">5</text>

  <line x1="250" y1="50" x2="250" y2="150" class="edge" />
  <text x="260" y="100" class="weight" text-anchor="middle">6</text>

  <line x1="50" y1="150" x2="150" y2="150" class="edge" />
  <text x="100" y="145" class="weight" text-anchor="middle">7</text>

  <line x1="150" y1="150" x2="250" y2="150" class="edge" />
  <text x="200" y="145" class="weight" text-anchor="middle">8</text>

  <!-- Vertices -->
  <circle cx="50" cy="50" r="20" class="vertex" />
  <text x="50" y="55" class="label" text-anchor="middle">A</text>

  <circle cx="150" cy="50" r="20" class="vertex" />
  <text x="150" y="55" class="label" text-anchor="middle">B</text>

  <circle cx="250" cy="50" r="20" class="vertex" />
  <text x="250" y="55" class="label" text-anchor="middle">C</text>

  <circle cx="50" cy="150" r="20" class="vertex" />
  <text x="50" y="155" class="label" text-anchor="middle">D</text>

  <circle cx="150" cy="150" r="20" class="vertex" />
  <text x="150" y="155" class="label" text-anchor="middle">E</text>

  <circle cx="250" cy="150" r="20" class="vertex" />
  <text x="250" y="155" class="label" text-anchor="middle">F</text>
</svg>

1. Sort the edges by weight:

   - (A-B, 1), (B-C, 2), (A-E, 3), (A-D, 4), (B-E, 5), (C-F, 6), (D-E, 7),
     (E-F, 8)

2. Add edges to the MST, ensuring no cycles are formed:
   - Add (A-B, 1)
   - Add (B-C, 2)
   - Add (A-E, 3)
   - Add (A-D, 4)
   - Add (C-F, 6)

The resulting MST will have the edges: (A-B, 1), (B-C, 2), (A-E, 3), (A-D, 4),
(C-F, 6).

## Time and Space Complexity

### Time Complexity

1. Sorting all edges: Takes $O(E \log E)$. Since $E \log E$ is equivalent to $O(E \log V)$ in a connected graph, this step dominates the overall complexity.
2. Union-Find operations: The union-find data structure is used to detect cycles and merge sets. Each union or find operation has an amortized time complexity of $O(\alpha(V))$, where $\alpha(V)$ is the inverse Ackermann function, which grows extremely slowly. For $E$ edges, the total complexity of union-find operations is $O(E \alpha(V))$.

Thus, the overall time complexity of Kruskal's Algorithm is: $O(E \log E + E \alpha(V)) \approx O(E \log V)$. $ $

### Space Complexity

1. Edge list: $O(E)$ is required to store all edges.
2. Union-Find data structure: The parent and rank arrays used in the union-find operations require $O(V)$ space.

Therefore, the total space complexity is: $O(E + V)$. $ $
