---
title: Serialization
sidebar:
  order: 13
slug: program-construction/basics/serialization
prev: true
next: true
---

The process of writing objects and their exact states into a linear format using
I/O streams. The output format is not human readable. The output can be written
to a file, a network, or a database. Serialized object data is stored in a
`.ser` file.

State of an object can also be stored in a custom text format, which is not
recommended.

A class must implement `Serializable` interface (from `java.io` package) to be
serialized. Otherwise, `NotSerializableException` is exception is thrown. The
`ObjectOutputStream` class serializes objects, and feeds the output to another
output stream.

### Deserialization

The process of constructing the object from serialized format on the heap.
`ObjectInputStream`, which reads from a input stream, is used to deserialize.

## Serializable fields

When a class is made serializable, all of its fields must be serializable.

- All primary types are serializable
- Built-in objects such as String, URL, Date, Point, Random are serializable
- All collections from `java.util` package

## Transient fields

Fields can be defined as `transient`. Will not be serialized. Reverts to `null`
or default value primitive type when deserialized.
