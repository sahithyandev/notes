---
title: Dijkstra's Algorithm
sidebar:
  order: 10
slug: data-structures-and-algorithms/algorithms/dijkstras-algorithm
prev: true
next: true
---

A greedy algorithm to find the shortest path from a single source vertex to all other nodes. Widely used in network routing and other optimization problems.

Fails for graphs with negative edge weights. Because a vertex is visited only once.

### Steps

1. Initialize the distance to the source vertex as 0 and all other vertices as infinity.
2. Create a priority queue (min-heap) to store vertices based on their current shortest distance.
3. While the priority queue is not empty:
   - Extract the vertex with the smallest distance.
   - For each adjacent vertex, calculate the distance through the current vertex. If this distance is smaller than the previously known distance, update it and push the vertex into the priority queue.

## Implementation

```cpp
#include <iostream>
#include <vector>
#include <queue>
#include <climits>

using namespace std;

// Function to print the distances from the source vertex
void printDistances(vector<int>& dist) {
    cout << "Vertex\tDistance from Source\n";
    for (int i = 0; i < dist.size(); i++) {
        cout << i << "\t" << (dist[i] == INT_MAX ? "INF" : to_string(dist[i])) << "\n";
    }
}

// Dijkstra's algorithm function
void dijkstra(int V, vector<vector<pair<int, int>>>& adj, int src) {
    vector<int> dist(V, INT_MAX); // Distance array
    dist[src] = 0;

    // Min-heap priority queue to store (distance, vertex)
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;
    pq.push({0, src});

    while (!pq.empty()) {
        int u = pq.top().second;
        pq.pop();

        // Traverse all adjacent vertices of u
        for (auto& edge : adj[u]) {
            int v = edge.first;
            int weight = edge.second;

            // Relaxation step
            if (dist[u] != INT_MAX && dist[u] + weight < dist[v]) {
                dist[v] = dist[u] + weight;
                pq.push({dist[v], v});
            }
        }
    }

    // Print the distances
    printDistances(dist);
}

int main() {
    int V = 5; // Number of vertices

    // Graph represented as an adjacency list
    // Each pair is (vertex, weight)
    vector<vector<pair<int, int>>> adj(V);
    adj[0].push_back({1, 2});
    adj[0].push_back({4, 1});
    adj[1].push_back({2, 3});
    adj[4].push_back({2, 2});
    adj[4].push_back({3, 4});
    adj[2].push_back({3, 1});

    int src = 0; // Source vertex
    dijkstra(V, adj, src);

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

1. Initialize distances: `dist[0] = 0`, all others = `INF`.
2. Process vertices in order of their current shortest distance:
   - Start with vertex 0: Update distances to 1 (`2`) and 4 (`1`).
   - Process vertex 4: Update distance to 2 (`3`) and 3 (`5`).
   - Process vertex 1: No updates needed.
   - Process vertex 2: Update distance to 3 (`4`).
   - Process vertex 3: No updates needed.

Output:
```txt
Vertex  Distance from Source
0       0
1       2
2       3
3       4
4       1
```

## Comparison from Bellman Ford's algorithm

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
