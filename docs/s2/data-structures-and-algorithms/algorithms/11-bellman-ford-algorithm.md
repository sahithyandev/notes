---
title: Bellman Ford Algorithm
sidebar:
  order: 11
slug: data-structures-and-algorithms/algorithms/bellman-ford-algorithm
prev: true
next: true
---

A dynamic algorithm to find the shortest paths from a source node to all other node in a weighted graph. Can handle graphs with negative weight edges. Fails for graphs with negative weight cycle.

### Steps

1. Initialize the distance to the source vertex as 0 and all other vertices as infinity.
2. Relax all edges $V - 1$ times. For each edge $(u, v)$ with weight $w$, if $\text{dist}(u) + w < \text{dist}(v)$, update the distance to $v$.
3. Check for negative weight cycles by iterating through all edges one more time. If a shorter path is found, it indicates the presence of a negative weight cycle.

## Implementation

```cpp
#include <iostream>
#include <vector>
#include <tuple>
#include <climits>

using namespace std;

// Function to print the distances from the source vertex
void printDistances(vector<int>& dist) {
    cout << "Vertex\tDistance from Source\n";
    for (int i = 0; i < dist.size(); i++) {
        cout << i << "\t" << (dist[i] == INT_MAX ? "INF" : to_string(dist[i])) << "\n";
    }
}

// Bellman-Ford algorithm function
void bellmanFord(int V, int E, vector<tuple<int, int, int>>& edges, int src) {
    vector<int> dist(V, INT_MAX);
    dist[src] = 0;

    // Relax all edges |V| - 1 times
    for (int i = 0; i < V - 1; i++) {
        for (int j = 0; j < E; j++) {
            int u, v, w;
            tie(u, v, w) = edges[j];
            if (dist[u] != INT_MAX && dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
            }
        }
    }

    // Check for negative weight cycles
    for (int j = 0; j < E; j++) {
        int u, v, w;
        tie(u, v, w) = edges[j];
        if (dist[u] != INT_MAX && dist[u] + w < dist[v]) {
            cout << "Graph contains a negative weight cycle\n";
            return;
        }
    }

    // Print the distances
    printDistances(dist);
}

int main() {
    int V = 5; // Number of vertices
    int E = 8; // Number of edges

    // Graph edges represented as (u, v, w) where u -> v with weight w
    vector<tuple<int, int, int>> edges = {
        {0, 1, -1}, {0, 2, 4}, {1, 2, 3}, {1, 3, 2},
        {1, 4, 2}, {3, 2, 5}, {3, 1, 1}, {4, 3, -3}
    };

    int src = 0; // Source vertex
    bellmanFord(V, E, edges, src);

    return 0;
}
```

## Example

Consider the following graph:

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" class="w-[600px] w-[400px] mx-auto">
    <style>
      .graph-edges {
        fill: currentColor;
        stroke: currentColor;
        font-size: 12px;
        font-weight: bold;
      }
      .graph-edge-line {
        stroke-width: 2;
      }
      .graph-nodes {
        fill: lightblue;
        stroke: none;
      }
      .graph-node-text {
        font-size: 12px;
        text-anchor: middle;
        fill: black;
      }
    </style>
  <!-- Edges -->
  <g class="graph-edges">
    <line x1="50" y1="50" x2="50" y2="150" class="graph-edge-line" />
    <text x="40" y="100">2</text>
    <line x1="50" y1="50" x2="150" y2="100" class="graph-edge-line" />
    <text x="90" y="85">3</text>
    <line x1="50" y1="50" x2="250" y2="50" class="graph-edge-line" />
    <text x="150" y="40">1</text>
    <line x1="50" y1="150" x2="150" y2="100" class="graph-edge-line" />
    <text x="90" y="140">3</text>
    <line x1="150" y1="100" x2="250" y2="150" class="graph-edge-line" />
    <text x="200" y="120">1</text>
    <line x1="250" y1="50" x2="250" y2="150" class="graph-edge-line" />
    <text x="260" y="100">2</text>
    <line x1="150" y1="100" x2="250" y2="50" class="graph-edge-line" />
    <text x="200" y="68">2</text>
  </g>

  <!-- Nodes -->
  <g class="graph-nodes">
    <circle cx="50" cy="50" r="20" />
    <text x="50" y="55" class="graph-node-text">0</text>
    <circle cx="50" cy="150" r="20" />
    <text x="50" y="155" class="graph-node-text">1</text>
    <circle cx="150" cy="100" r="20" />
    <text x="150" y="105" class="graph-node-text">2</text>
    <circle cx="250" cy="150" r="20" />
    <text x="250" y="155" class="graph-node-text">3</text>
    <circle cx="250" cy="50" r="20" />
    <text x="250" y="55" class="graph-node-text">4</text>
  </g>
</svg>

- Initialize: $d[0] = 0$, $d[1] = d[2] = d[3] = d[4] = \infty$, predecessors = null.
- Relax Edges (4 iterations):
   - Iteration 1: 
     - 0→1: $0+2=2$, $d[1]=2$, $pred[1]=0$.
     - 0→2: $0+3=3$, $d[2]=3$, $pred[2]=0$.
     - 0→4: $0+1=1$, $d[4]=1$, $pred[4]=0$.
     - 4→3: $1+2=3$, $d[3]=3$, $pred[3]=4$.
   - Iterations 2-4: No further updates.
- Check Negative Cycles: No distances decrease, so no negative cycles.

Final Results:
- Distances: $d[0]=0$, $d[1]=2$, $d[2]=3$, $d[3]=3$, $d[4]=1$.
- Paths:
  - 0→1: $0\to1$ (2)
  - 0→2: $0\to2$ (3)
  - 0→3: $0\to4\to3$ (1+2=3)
  - 0→4: $0\to4$ (1)

Bellman-Ford works by relaxing all edges $|V|-1$ times, handling negative weights if present (none here). $ $

## Comparison from Dijkstra's algorithm

| Aspect                   | Bellman-Ford                    | Dijkstra's                 |
| ------------------------ | ------------------------------- | -------------------------- |
| Negative Weights         | ✅ Supported                    | ❌ Not supported           |
| Negative Cycle Detection | ✅ Yes                          | ❌ No                      |
| Time Complexity          | O(VE)                           | O((V + E) log V)           |
| Space Complexity         | O(V)                            | O(V)                       |
| Approach                 | Dynamic Programming             | Greedy                     |
| Data Structure           | Arrays                          | Priority Queue             |
| Best Use Case            | Graphs with negative weights    | Non-negative weight graphs |
| Early Termination        | ❌ Must complete all iterations | ✅ Can stop at target      |
| Implementation           | Simpler                         | More complex               |
