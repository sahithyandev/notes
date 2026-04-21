---
title: HashMap
sidebar:
  order: 7
slug: program-construction/basics/hashmap
prev: true
next: true
---

A basic implementation of the [Map](/program-construction/map) interface in
Java. Uses keys in the same way as an Array uses an index. Duplicate keys are
not allowed. Existing value will be overridden when a key is reused.

HashMaps are not ordered and not thread safe.

Hashmap object has 48 bytes overhead. And an array overhead for storing the storage buckets. Each entry in the hashmap  has an overhead of 36 bytes to store:
- Key
- Value
- Hashcode of the key
- Reference to the next entry in the bucket

## Operations

### Creating a HashMap

```java
HashMap <K,V> hm = new HashMap<>(int capacity, float loadFactor);
```

Here `K` is type of key and `V` is type of value. The constructor optionally accepts 2 parameters. `capacity` is the number of storage buckets. The `capacity` is increased when `loadFactor` * `capacity` number of buckets are used. Once this threshold is reached, the `capacity` is doubled.

### Adding elements to the HashMap

`put(key, value)` method is used to add elements.

### Changing the elements in HashMap

`put(key, value)` can be used to change elements.

### Access the elements

`get(key)` method is used to access a value using its key.

### Remove the elements from HashMap

`remove(key)` method is used to remove elements.

### Traversal

```java
import java.util.HashMap;
import java.util.Map;

public class Test {
    public static void main(String[] args)
    {
        // initialize a HashMap
        HashMap<String, Integer> numbers = new HashMap<>();

        numbers.put("key1", 1);
        numbers.put("key2", 2);
        numbers.put("key3", 3);

        for(Map.Entry<String,Integer> e : numbers.entrySet()){
            System.out.println("Key: "+e.getKey()+" Value: "+e.getValue());
        }
    }
}
```
