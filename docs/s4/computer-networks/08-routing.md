---
title: Routing
sidebar:
  order: 8
slug: s4/computer-networks/routing
prev: true
next: true
dateCreated: 2026-04-23T17:39:39.621Z
lastUpdatedOn: 2026-04-23T17:39:39.621Z
---

The process of determining the path used to deliver packets from source to destination or establishing a connection.

End systems send and receive data. Intermediate systems (routers) forward packets between networks.

### Routing Algorithms

Algorithms to compute the best path in a network.

A routing algorithm should provide:

- Correctness  
  Always find a valid path.
- Simplicity  
  Easy to implement and maintain.
- Robustness  
  Handle failures and topology changes.
- Stability  
  Avoid oscillating routes.
- Fairness  
  Distribute network resources fairly.
- Optimality  
  Choose the best path.

## Classification based on routing information update

### Static Routing

Aka. non-adaptive routing. Routing tables are manually configured and remain fixed. Simple. Not flexible. Not fail-safe. Requires manual maintenance. Suitable for small networks. Often includes a default route for unknown destinations.

#### Hierarchical Routing

Routers are grouped into _regions_ using a most-significant part of the addresses. Intra-region routing is done usually. Special routers named _gateways_ handle inter-region routing. Reduces routing table size. Scalable. Used heavily in the Internet. Might require more than 2 levels.

### Dynamic Routing

Aka. adaptive routing. Routers exchange routing information periodically and compute best paths automatically. Routing tables are automatically updated. Adapts to network changes and failures.

Routing information used to compute best paths:

- Link speed
- Delay
- Congestion
- Error rate
- Communication cost

_Distance_ is a common metric used to evaluate the best path, which is defined

Different routing protocols use different metrics to calculate the _distance_ such as:

- Number of hops
- Physical distance
- Delay
- Bandwidth (inverse)
- Communication cost

#### Broadcast Routing

Packets are sent to all nodes in the network except the incoming node. Guaranteed delivery. Causes large traffic overhead.

#### Flooding

Packets are sent to all neighboring nodes except the incoming node. Guaranteed delivery. Generates large traffic overhead. Slightly better than broadcast routing.

#### Shortest Path Routing

Minimum-cost path between nodes are computed by modelling the whole network topology as a graph.

#### Distance Vector Routing

Routers maintains a table of distance to each destination. The distances are periodically shared with neighboring nodes. Optimal paths are converged. Distributed. Incremental.

Example: Routing Information Protocol (RIP).

#### Link State Routing

Routers maintain information about state of each network link. Each router builds a complete network topology map.

Example: Open Shortest Path First (OSFP).

Components of a link state:

- Neighbour router
- Status: whether the link is up or down
- Cost: a numerical value
- Link identifier

### Source Routing

The source node specifies the complete route that packets must follow.

## Classification based on the number of receivers

| Type      | Meaning                      |
| --------- | ---------------------------- |
| Unicast   | one sender to one receiver   |
| Broadcast | one sender to all nodes      |
| Multicast | one sender to group of nodes |

In multicast routing, packets are forwarded to multiple outgoing links. Routers maintain group membership information. A group of nodes for multicast is called a _multicast group_.
