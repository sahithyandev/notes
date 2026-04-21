---
title: Map
sidebar:
  order: 6
slug: program-construction/basics/map
prev: true
next: true
---

A data structure that stores key-value pairs. Keys are unique, and map to a
value.

## Map in Java

![Map Hierarchy](./images/map-hierarchy.png)

`Map` interface defines the basic operations for a map data structure.
`SortedMap` interface extends `Map` interface and provides additional methods
for sorted maps such as `firstKey()`, `lastKey()`, `headMap()`, `tailMap()`, and
`subMap()`.

Three primary classes implement these interfaces
[HashMap](/program-construction/hashmap/), `TreeMap`, and `LinkedHashMap`.
