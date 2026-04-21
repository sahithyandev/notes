---
title: HashSet
sidebar:
  order: 8
slug: program-construction/basics/hashset
prev: true
next: true
---

An implementation of the `Set` interface of Collections Framework. Stores the
unique elements and it doesn’t maintain any specific order of elements. Can
store the Null values.

## Methods

- `add(E e)`  
  Used to add the specified element if it is not present, if it is present then
  return false.
- `clear()`  
  Used to remove all the elements from the set.
- `contains(Object o)`  
  Used to return true if an element is present in a set.
- `remove(Object o)`  
  Used to remove the element if it is present in set.
- `iterator()`  
  Used to return an iterator over the element in the set.
- `isEmpty()`  
  Used to check whether the set is empty or not. Returns true for empty and
  false for a non-empty condition for set.
- `size()`  
  Used to return the size of the set.
- `clone()`  
  Used to create a shallow copy of the set.

```java
import java.util.HashSet;
import java.util.Iterator;

class HashSetInJava{
    public static void main(String[] args){
        //Declaring the hashset
        HashSet <String> fruits= new HashSet<>();

        //Addding the elements to hashset
        fruits.add("Apple");
        fruits.add("Banana");
        fruits.add("Grapes");
        fruits.add("Mango");

        System.out.println("After adding elements: "+fruits);

        //remove Grapes from hashset
        fruits.remove("Grapes");

        System.out.println("After removing Grapes: "+fruits);

        //if element doesn't exist in hashset, it will return false
        fruits.remove("Grapes");
        System.out.println("Repeately remove Grapes: "+fruits.remove("Grapes"));

        //Iterating through the HashSet
        Iterator <String> iterate=fruits.iterator();
        System.out.print("Iterate through HashSet: ");
        while(iterate.hasNext()){
            System.out.print(iterate.next()+", ");
        }

    }
}

```
