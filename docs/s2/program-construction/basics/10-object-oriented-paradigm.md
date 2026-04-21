---
title: Object Oriented Paradigm
sidebar:
  order: 10
slug: program-construction/basics/object-oriented-paradigm
prev: true
next: true
---

A way of developing software where the components of the system are designed and
developed as "objects".

## Object Oriented Analysis

System requirements are gathered from the client. The analysis will include
"actors".

### UML

Short for Unified Modeling Language. Provides a standard way to visualize the
design of a system.

## Object Oriented Design

Object Oriented Design (OOD) is the process of planning a system of interacting
objects for the purpose of solving a software problem. It involves the following
key concepts:

### UML in Design

Unified Modeling Language (UML) is used to visualize the design of a system.
Common UML diagrams used in OOD include:

- Class Diagrams: Show the static structure of the system, including classes,
  attributes, methods, and relationships.
- Sequence Diagrams: Show how objects interact in a particular sequence of time.
- Use Case Diagrams: Show the interactions between actors and the system.

### Principles

_SOLID_ design principles are used in OOD.

#### Single responsibility

Every class should have only one responsibility. Makes it easier to write unit
test cases. Good for maintainability and flexibility.

#### Open-closed

Software entities should be open for extension but closed for modification.
Makes it safe to refactoring.

#### Liskov substitution

Functions that use references to base classes must be able to use objects of its
subclasses.

#### Interface segregation

Clients should not be forced to depend upon interfaces that they don't use.

#### Dependency inversion

High level modules should depend on abstractions instead of low level modules.
Abstractions should not depend on implementation. Concrete implements must
depend on abstractions.

## Object Oriented Programming

A programming style, in which main components are thought in terms of objects.
Different kinds of objects interact with each other. Usually bad for performance
but can be used to solve problems that cannot be solved in procedural approach.

### Encapsulation

Internal data should be hidden from outside. Reduces too much coupling between 2 classes.

Achivied through private fields and methods.

### Inheritance

Allows a child class to inherit properties and methods from its
parent class. Promotes code reusability and extensibility.

For example, `Dog` class can inherit from an `Animal` class, gaining its
properties and behaviors.

#### Benefits

- Extensibility: Easily extend existing classes to create new functionality.
- Reusability: Reuse existing code to reduce redundancy.
- Duplicate code elimination: Common functionality is centralized in the parent
  class.

### Abstraction

Hides internal implementation details from outside.

Achieved through interfaces and abstract classes.

### Polymorphism

Different classes can be treated as objects of a common superclass. Enables a
single interface to represent different underlying data types.

For example, `Deer` class might be treated as `Animal` in one place and `Mammal`
in another.

### Cohesion

Refers to how closely related and focused the responsibilities of a single
module or class are. High cohesion means that a class is focused on a single
task, which is preferrable.

### Coupling

Refers to how much 2 classes depend on each other. Low
coupling is preferred as it reduces the interdependencies between classes,
making the system more modular and easier to maintain.
