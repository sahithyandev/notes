---
title: Java Basics
sidebar:
  order: 4
slug: program-construction/basics/java-basics
prev: true
next: true
---

### Java

A programming language that is built around
[object-oriented paradigm](/program-construction/object-oriented-paradigm/).
Everything is an object in Java. Objects can be instiated from a _class_ using
the unary operator: `new`. All classes are an extension of the `Object` class.

### JVM

Short for Java Virtual Memory. The virtual machine, on top of the operating
system, which runs the compiled Java code.

### JDK

Short for Java Development Kit. The set of tools to compile the Java programs.

Memory is allocated implicitly (variable declaration or `new` operator) and
deallocated implicitly (by the runtime).

## Terminology

### Class

A template for a object, giving information about state and actions. State of an
object is represented by variables and behavior is represented by methods.

The class definition contains a `constructor` method which is a special static
method used to instantiate objects. Inside methods `this` keyword is used to refer to the current object
instance.

### Interface

Defines the structure of a class. Can include state variable definitions but not
values. Can include method signatures. After Java 8, can also include method
body.

### Child class

Aka. sub class, derived class. A class extending another class (all public and
protected members), which is called its super class. Members can be overridden
by defining a member again in the sub class. New members can be declared.
`super` keyword can be used to access methods of super class.

### Abstract class

A special type of class, which cannot be used to instantiate objects from.
Defined by `abstract` keyword. Can only be extended from.

### Abstract methods

Can only be defined inside abstract classes. Defined by `abstract` keyword. Any
child class must either override the abstract method or declare itself abstract

### Access modifiers

In Java, access modifiers control visibility and accessibility of classes,
methods, and variables:

For classes:

- `public`: Class is visible everywhere
- `default` (no modifier): Class is only visible within same package

For methods:

- `public`: Accessible from any other class
- `protected`: Accessible within same package and by subclasses
- `default`: Only accessible within same package
- `private`: Only accessible within declaring class

For attributes:

- `public`: Accessible from any class
- `protected`: Accessible in same package and subclasses
- `default`: Only accessible in same package
- `private`: Only accessible within declaring class

### Non-access modifiers

For classes:

- `final`: Class cannot be inherited
- `abstract`: Class cannot be instantiated and may have abstract methods
- `strictfp`: Class uses strict floating-point calculations

For methods:

- `final`: Method cannot be overridden
- `abstract`: Method has no implementation and must be implemented by subclasses
- `synchronized`: Method can only be accessed by one thread at a time
- `native`: Method is implemented in platform-dependent code
- `strictfp`: Method uses strict floating-point calculations

For attributes:

- `final`: Attribute cannot be changed after initialization
- `static`: Attribute belongs to class rather than instance
- `transient`: Attribute will not be serialized
- `volatile`: Attribute value may be changed by multiple threads

### Static members

Aka. class members. Used to store data on a class
instead of an instance. There can be static variables and static methods. Static
methods cannot access non-static variables and cannot call non-static methods.
`this` keyword is not available inside static methods.

### Type Casting

The process of converting one data type to another. Can be implicit or explicit.

If a wrong cast operation is performed on a primitive type, it will cause a compile error or loss of accuracy. If a wrong cast is done on a reference type, it will cause a runtime error `ClassCastException`.

#### Upcasting

Casting a subclass to a superclass. Implicit and safe. Used in polymorphism to call overridden methods.

Example:
```java
Animal animal = new Dog(); // Upcasting
animal.makeSound(); // Calls Dog's implementation
```

#### Downcasting

Casting a superclass to a subclass. Explicit and requires a cast operator. Used to access subclass-specific methods or properties.

Example:
```java
Animal animal = new Dog();
Dog dog = (Dog) animal; // Downcasting
dog.fetch(); // Access subclass-specific method
```

Upcasting is common in method arguments and collections. Downcasting is used when subclass-specific behavior is needed.

## Object overhead

In Java, objects have additional memory overhead due to metadata stored alongside the actual data.

For example, in a 32-bit system, a primitive `int` requires 4 bytes of memory; An `Integer` object, requires 16 bytes. The extra memory is used to store object metadata:

- class pointer: A reference to the class metadata that defines the object's structure and behavior.
- flags: Indicators used to store object-specific state information, such as garbage collection status.
- synchronization locks: Mechanisms to manage thread-safe access to the object. More on this [here](/program-construction/concurrency/).
- object size information: Data about the memory footprint of the object.

These metadata are essential for the Java Virtual Machine (JVM) to manage objects effectively.

| Object Type   | Memory Overhead (Bytes) | Notes                                                               |
| ------------- | ----------------------- | ------------------------------------------------------------------- |
| String        | 44                      | Includes length, hash code, and character array overhead.           |
| HashMap       | 48                      | Includes hash table structure and bucket overhead.                  |
| Array         | 16                      | Includes array length and element type information.                 |
| LinkedList    | 24                      | Additionally, each item has 24 bytes overhead.                      |
| ArrayList     | 32                      | Includes capacity overhead for resizing and internal array storage. |

## Collections framework

A Java framework that includes production-grade implementations for commonly
used data structures. The implementation is done using interfaces, abstract
classes and (regular) classes.

<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1562.2289973143963 738.8737856203022" width="1562.2289973143963" height="738.8737856203022" >
	<g
		stroke-linecap="round"
		transform="translate(594.5060471152285 31.071907499864764) rotate(0 71.5 22.500000000000007)"
	>
		<path
			d="M11.25 0 C39.26 -0.95, 64.9 -1.66, 131.75 0 C139.12 -0.19, 143.84 6.19, 143 11.25 C141.85 19.9, 146.52 22.38, 143 33.75 C146.05 39.57, 139.79 43.79, 131.75 45 C101.91 42.78, 75.04 43.74, 11.25 45 C0.47 45.25, 3.44 40.58, 0 33.75 C-0.08 28.17, -2.38 17.99, 0 11.25 C1.66 6.63, 4.37 -1.71, 11.25 0"
			stroke="none"
			stroke-width="0"
			fill="#a5d8ff"
		></path>
		<path
			d="M11.25 0 C55.84 0.26, 98.24 1.25, 131.75 0 M11.25 0 C48.34 -0.5, 83.92 -0.41, 131.75 0 M131.75 0 C137.74 -1.57, 142.3 2.85, 143 11.25 M131.75 0 C139.84 2.23, 141.93 2.48, 143 11.25 M143 11.25 C141.88 17.17, 144.66 21.75, 143 33.75 M143 11.25 C144.05 19.17, 143.67 24.69, 143 33.75 M143 33.75 C142.94 39.32, 140.41 44.03, 131.75 45 M143 33.75 C140.75 43.06, 141.03 45.24, 131.75 45 M131.75 45 C90 43.61, 45.97 45.7, 11.25 45 M131.75 45 C104.37 44.98, 76.81 44.51, 11.25 45 M11.25 45 C5.32 44.99, 0.26 40.44, 0 33.75 M11.25 45 C2.58 44.78, 0.12 41.87, 0 33.75 M0 33.75 C1.98 30.16, 0.92 22.09, 0 11.25 M0 33.75 C-0.77 28.66, -0.08 23.25, 0 11.25 M0 11.25 C-0.17 3.87, 1.77 0.39, 11.25 0 M0 11.25 C-0.58 5.54, 5.46 -2.25, 11.25 0"
			stroke="currentColor"
			stroke-width="1"
			fill="none"
		></path>
	</g>
	<g
		transform="translate(625.5060471152285 43.07190749986478) rotate(0 38.99166488647461 12.5)"
	>
		<text
			x="-25"
			y="18"
			font-family="Excalifont, Xiaolai, Segoe UI Emoji"
			font-size="20px"
			text-anchor="start"
			style="white-space: pre"
			fill="#000"
			direction="ltr"
			dominant-baseline="alphabetic"
		>
			Iterable
		</text>
	</g>
	<g
		stroke-linecap="round"
		transform="translate(592.5060471152285 127.07190749986478) rotate(0 71.5 22.500000000000014)"
	>
		<path
			d="M11.25 0 C45.26 -2.71, 75.41 -4.7, 131.75 0 C139.97 -0.74, 141.07 4.14, 143 11.25 C139.61 15.95, 141.82 23.87, 143 33.75 C142.5 42.33, 136.38 43.7, 131.75 45 C86.12 44.99, 46.34 44.53, 11.25 45 C1.38 43.22, -1.26 43.75, 0 33.75 C-1.98 24.09, 0.23 19.37, 0 11.25 C-0.18 2.22, 0.73 3.38, 11.25 0"
			stroke="none"
			stroke-width="0"
			fill="#a5d8ff"
		></path>
		<path
			d="M11.25 0 C48.62 0.31, 85.56 0.54, 131.75 0 M11.25 0 C35.63 0.25, 60.75 -0.5, 131.75 0 M131.75 0 C140.13 1.6, 142.23 4.71, 143 11.25 M131.75 0 C139.13 -0.82, 143.83 4.28, 143 11.25 M143 11.25 C142.52 17.45, 141.45 27.37, 143 33.75 M143 11.25 C142.73 19.2, 143.6 24.38, 143 33.75 M143 33.75 C141.07 41.13, 139.24 46.02, 131.75 45 M143 33.75 C141.8 41.27, 139.19 45.21, 131.75 45 M131.75 45 C84.4 46.04, 35.97 46.91, 11.25 45 M131.75 45 C101.57 43.94, 71.32 45.34, 11.25 45 M11.25 45 C2.19 45.23, 0.99 40.68, 0 33.75 M11.25 45 C4.66 46.63, -0.74 39.6, 0 33.75 M0 33.75 C1.57 30.49, -1.68 24.74, 0 11.25 M0 33.75 C-0.09 29.67, 0.38 25.42, 0 11.25 M0 11.25 C-1.05 5.28, 4.02 1.81, 11.25 0 M0 11.25 C-1.95 2.71, 2.09 -1.91, 11.25 0"
			stroke="currentColor"
			stroke-width="1"
			fill="none"
		></path>
	</g>
	<g
		transform="translate(620.5060471152285 138.07190749986478) rotate(0 46.43333435058594 12.5)"
	>
		<text
			x="-25"
			y="18"
			font-family="Excalifont, Xiaolai, Segoe UI Emoji"
			font-size="20px"
			fill="#000"
			text-anchor="start"
			style="white-space: pre"
			direction="ltr"
			dominant-baseline="alphabetic"
		>
			Collection
		</text>
	</g>
	<g
		stroke-linecap="round"
		transform="translate(466.32558894035765 268.93330149060034) rotate(0 101.50000000000006 22.5)"
	>
		<path
			d="M11.25 0 C65.25 0.73, 120.66 3.49, 191.75 0 C202.75 -2.34, 199.45 2.32, 203 11.25 C200.86 14.7, 201.31 22.58, 203 33.75 C202.76 40.09, 200.23 48, 191.75 45 C124.92 47.06, 47.33 45.1, 11.25 45 C0.63 48.37, 0.71 42.39, 0 33.75 C2.1 27.42, -0.75 21.05, 0 11.25 C-1.47 4.6, 2.6 -0.76, 11.25 0"
			stroke="none"
			stroke-width="0"
			fill="#ffc9c9"
		></path>
		<path
			d="M11.25 0 C55.26 -0.56, 97.67 0.42, 191.75 0 M11.25 0 C72.66 0.48, 133.38 -0.17, 191.75 0 M191.75 0 C199.26 -1.92, 203.35 3.09, 203 11.25 M191.75 0 C199.43 -0.43, 202.23 4.48, 203 11.25 M203 11.25 C203.1 15.48, 203.89 21.19, 203 33.75 M203 11.25 C203.33 19.5, 204.03 27.33, 203 33.75 M203 33.75 C201.41 39.28, 198 44.59, 191.75 45 M203 33.75 C204.81 39.79, 200.9 42.8, 191.75 45 M191.75 45 C142.06 44.88, 92.37 44.52, 11.25 45 M191.75 45 C127.37 45.27, 62.93 46.27, 11.25 45 M11.25 45 C2.9 45.51, 1.4 41.68, 0 33.75 M11.25 45 C3.5 45.46, -1.18 40.7, 0 33.75 M0 33.75 C1.22 28.03, 1.49 22.33, 0 11.25 M0 33.75 C0.92 27.82, 0.04 23.4, 0 11.25 M0 11.25 C-0.27 1.8, 5.68 -0.87, 11.25 0 M0 11.25 C0.41 3.52, 2.89 1.36, 11.25 0"
			stroke="currentColor"
			stroke-width="1"
			fill="none"
		></path>
	</g>
	<g
		transform="translate(477.32558894035765 279.93330149060034) rotate(0 89.75833129882812 12.5)"
	>
		<text
			x="-25"
			y="18"
			font-family="Excalifont, Xiaolai, Segoe UI Emoji"
			font-size="20px"
			fill="#000"
			text-anchor="start"
			style="white-space: pre"
			direction="ltr"
			dominant-baseline="alphabetic"
		>
			AbstractCollection
		</text>
	</g>
	<g
		stroke-linecap="round"
		transform="translate(521.5907067284293 564.3026531605415) rotate(0 121.21395612912545 22.5)"
	>
		<path
			d="M11.25 0 C57.9 -0.61, 112.66 -0.94, 231.18 0 C237.56 2.47, 240.59 1.68, 242.43 11.25 C241.1 19.47, 243.74 29.15, 242.43 33.75 C243.66 43.39, 238.12 46.01, 231.18 45 C168.73 48.19, 109.85 45.32, 11.25 45 C6.38 43.42, 3.12 42.93, 0 33.75 C-3.41 22.96, 0.38 22.58, 0 11.25 C1.75 3.98, 3.82 -1.56, 11.25 0"
			stroke="none"
			stroke-width="0"
			fill="#ffc9c9"
		></path>
		<path
			d="M11.25 0 C92.81 2.29, 173.38 1.36, 231.18 0 M11.25 0 C58.26 -1.34, 105.74 -2.35, 231.18 0 M231.18 0 C237.94 0.66, 244 4.2, 242.43 11.25 M231.18 0 C239.85 -0.78, 243.46 3.58, 242.43 11.25 M242.43 11.25 C241.62 18.49, 242.86 23.59, 242.43 33.75 M242.43 11.25 C241.94 15.86, 243.18 20.63, 242.43 33.75 M242.43 33.75 C244.31 40.13, 237.29 46.46, 231.18 45 M242.43 33.75 C243.9 39.7, 236.79 44.35, 231.18 45 M231.18 45 C159.38 45.58, 91.43 44.9, 11.25 45 M231.18 45 C179.8 46.07, 129.23 45.69, 11.25 45 M11.25 45 C4.47 44.06, -0.97 40.75, 0 33.75 M11.25 45 C1.72 43.22, -0.68 39.97, 0 33.75 M0 33.75 C0.23 30.38, 0.98 25.81, 0 11.25 M0 33.75 C0.43 26.53, -0.93 16.97, 0 11.25 M0 11.25 C-0.33 3.82, 5.12 -0.36, 11.25 0 M0 11.25 C1 2.84, 5.23 1.49, 11.25 0"
			stroke="currentColor"
			stroke-width="1"
			fill="none"
		></path>
	</g>
	<g
		transform="translate(532.5907067284293 575.3026531605415) rotate(0 111.23332977294922 12.5)"
	>
		<text
			x="-35"
			y="18"
			font-family="Excalifont, Xiaolai, Segoe UI Emoji"
			font-size="20px"
			fill="#000"
			text-anchor="start"
			style="white-space: pre"
			direction="ltr"
			dominant-baseline="alphabetic"
		>
			AbstractSequentialList
		</text>
	</g>
	<g
		stroke-linecap="round"
		transform="translate(366.4576701933994 403.12585389592834) rotate(0 75.00000000000006 22.5)"
	>
		<path
			d="M11.25 0 C60.8 3.6, 107.34 2.11, 138.75 0 C144.3 -1.95, 152.51 2.1, 150 11.25 C153.46 17.25, 149.24 25.62, 150 33.75 C147.81 39.7, 145.42 41.97, 138.75 45 C111.58 49.1, 80.1 43.69, 11.25 45 C5.58 48.27, 0.23 38.41, 0 33.75 C-1.87 28.01, -1.46 19.67, 0 11.25 C-0.96 1.58, 4.44 1.73, 11.25 0"
			stroke="none"
			stroke-width="0"
			fill="#ffc9c9"
		></path>
		<path
			d="M11.25 0 C44.51 -1.03, 80.06 0.95, 138.75 0 M11.25 0 C36.97 -1.18, 62.76 -0.27, 138.75 0 M138.75 0 C146.65 -1.28, 148.19 2.36, 150 11.25 M138.75 0 C147.91 1, 149.88 2.35, 150 11.25 M150 11.25 C151.14 19.39, 149.14 26.16, 150 33.75 M150 11.25 C150.72 17.12, 149.59 24.34, 150 33.75 M150 33.75 C149.8 39.75, 146.29 46.22, 138.75 45 M150 33.75 C148.45 39, 145.71 47.28, 138.75 45 M138.75 45 C104.92 42.98, 67.89 45.44, 11.25 45 M138.75 45 C90.46 45.79, 42.3 47, 11.25 45 M11.25 45 C3.97 43.52, -0.56 39.56, 0 33.75 M11.25 45 C3.26 45.29, -2.03 39.57, 0 33.75 M0 33.75 C0.24 28.82, 0.44 21.93, 0 11.25 M0 33.75 C-0.72 29.51, 0.23 24.96, 0 11.25 M0 11.25 C1.36 2.38, 3.79 -1.58, 11.25 0 M0 11.25 C1.15 2.07, 5.09 2.1, 11.25 0"
			stroke="currentColor"
			stroke-width="1"
			fill="none"
		></path>
	</g>
	<g
		transform="translate(377.4576701933994 414.12585389592834) rotate(0 62.16666793823242 12.5)"
	>
		<text
			x="-25"
			y="18"
			font-family="Excalifont, Xiaolai, Segoe UI Emoji"
			font-size="20px"
			fill="#000"
			text-anchor="start"
			style="white-space: pre"
			direction="ltr"
			dominant-baseline="alphabetic"
		>
			AbstractList
		</text>
	</g>
	<g
		stroke-linecap="round"
		transform="translate(1071.3572574394839 406.66818370252884) rotate(0 71.50000000000011 22.5)"
	>
		<path
			d="M11.25 0 C52.51 3.3, 95.53 1.93, 131.75 0 C140.47 -0.88, 142.41 3.73, 143 11.25 C140.61 13.64, 144.43 19.28, 143 33.75 C144.42 42.73, 137.76 43.87, 131.75 45 C89.69 46.98, 41.65 41.03, 11.25 45 C7.2 46.5, -2.77 38.77, 0 33.75 C0.7 31.49, 0.21 26.3, 0 11.25 C-3.28 3.2, 4.4 -1.55, 11.25 0"
			stroke="none"
			stroke-width="0"
			fill="#ffc9c9"
		></path>
		<path
			d="M11.25 0 C36.07 -1.39, 65.54 -0.56, 131.75 0 M11.25 0 C37.9 1.23, 66.47 0.25, 131.75 0 M131.75 0 C139.64 -1.01, 143.36 3.24, 143 11.25 M131.75 0 C139.65 -2, 143.89 4.29, 143 11.25 M143 11.25 C144.55 22.03, 143.77 27.99, 143 33.75 M143 11.25 C143.8 15.58, 143.69 21.04, 143 33.75 M143 33.75 C144.74 39.28, 139.17 46.84, 131.75 45 M143 33.75 C143.82 43.05, 139.71 46.27, 131.75 45 M131.75 45 C97.59 47.17, 67.97 44.28, 11.25 45 M131.75 45 C93.33 44.11, 54.25 43.88, 11.25 45 M11.25 45 C2.7 45.69, 0.02 42.59, 0 33.75 M11.25 45 C3.76 46.56, 0.57 42.34, 0 33.75 M0 33.75 C-1.79 26.55, -0.96 15.7, 0 11.25 M0 33.75 C-0.4 27.58, 0.33 20.87, 0 11.25 M0 11.25 C-1.47 5.66, 2.75 0.94, 11.25 0 M0 11.25 C-2.07 3.54, 1.97 -1.63, 11.25 0"
			stroke="currentColor"
			stroke-width="1"
			fill="none"
		></path>
	</g>
	<g
		transform="translate(1082.3572574394839 417.66818370252884) rotate(0 60.44166564941406 12.5)"
	>
		<text
			x="-35"
			y="18"
			font-family="Excalifont, Xiaolai, Segoe UI Emoji"
			font-size="20px"
			fill="#000"
			text-anchor="start"
			style="white-space: pre"
			direction="ltr"
			dominant-baseline="alphabetic"
		>
			AbstractSet
		</text>
	</g>
	<g
		stroke-linecap="round"
		transform="translate(603.3115841459239 398.60771255024235) rotate(0 85 22.5)"
	>
		<path
			d="M11.25 0 C54.48 -0.52, 96.36 -0.06, 158.75 0 C163.62 2.71, 167.8 6.68, 170 11.25 C170.99 20.24, 167.95 22.28, 170 33.75 C171.81 43.13, 164.46 43.49, 158.75 45 C107 48.78, 58.81 46.03, 11.25 45 C0.45 42.86, -2.9 42.22, 0 33.75 C3.25 26.54, 2.3 16.82, 0 11.25 C2.41 7.21, 7.11 -2.67, 11.25 0"
			stroke="none"
			stroke-width="0"
			fill="#ffc9c9"
		></path>
		<path
			d="M11.25 0 C56.82 -0.07, 99.53 -1.08, 158.75 0 M11.25 0 C56.37 -0.74, 98.73 0.32, 158.75 0 M158.75 0 C164.51 0.79, 170.82 2.92, 170 11.25 M158.75 0 C165.53 1.73, 167.76 3.07, 170 11.25 M170 11.25 C168.32 21.89, 171 27.16, 170 33.75 M170 11.25 C169.36 16.72, 170.54 21.78, 170 33.75 M170 33.75 C171.28 39.43, 165.94 45.36, 158.75 45 M170 33.75 C169.01 39.33, 167.9 44.93, 158.75 45 M158.75 45 C114.74 47.13, 73.06 46.54, 11.25 45 M158.75 45 C111.66 45.69, 62.73 44.15, 11.25 45 M11.25 45 C5.72 43.94, -1.19 41.11, 0 33.75 M11.25 45 C5.9 42.96, -2.09 40.76, 0 33.75 M0 33.75 C0.13 29.49, -1.75 23.09, 0 11.25 M0 33.75 C-0.13 25.56, 0.08 18.4, 0 11.25 M0 11.25 C0.05 4.92, 5.1 0.94, 11.25 0 M0 11.25 C-0.72 3.14, 3.7 -0.69, 11.25 0"
			stroke="currentColor"
			stroke-width="1"
			fill="none"
		></path>
	</g>
	<g
		transform="translate(614.3115841459239 409.60771255024235) rotate(0 72.70833587646484 12.5)"
	>
		<text
			x="-25"
			y="18"
			font-family="Excalifont, Xiaolai, Segoe UI Emoji"
			font-size="20px"
			fill="#000"
			text-anchor="start"
			style="white-space: pre"
			direction="ltr"
			dominant-baseline="alphabetic"
		>
			AbstractQueue
		</text>
	</g>
	<g
		stroke-linecap="round"
		transform="translate(235.5060471152285 261.0719074998648) rotate(0 47.49999999999994 22.5)"
	>
		<path
			d="M11.25 0 C35.03 -2.14, 62.94 -2.17, 83.75 0 C93.44 1.51, 95.12 2.85, 95 11.25 C93.76 18.68, 98.75 26.26, 95 33.75 C97.42 37.79, 89.09 47.65, 83.75 45 C60.03 44.85, 40.25 48.3, 11.25 45 C3.96 43.32, -2.24 44.45, 0 33.75 C-3.03 26.12, 1.73 19.48, 0 11.25 C-2.84 5.11, 6.83 -0.48, 11.25 0"
			stroke="none"
			stroke-width="0"
			fill="#a5d8ff"
		></path>
		<path
			d="M11.25 0 C41.52 0.37, 68.67 1.9, 83.75 0 M11.25 0 C29.87 -0.49, 49.99 0.18, 83.75 0 M83.75 0 C89.41 1.21, 93.07 4.16, 95 11.25 M83.75 0 C92.61 0.13, 97.21 2.4, 95 11.25 M95 11.25 C95.84 20.19, 93.9 28.4, 95 33.75 M95 11.25 C95.15 18.46, 94.2 24.66, 95 33.75 M95 33.75 C94.72 40.03, 91.51 44.84, 83.75 45 M95 33.75 C94.55 40.28, 91.02 42.95, 83.75 45 M83.75 45 C68.78 45.1, 52.65 45.26, 11.25 45 M83.75 45 C57.37 45.77, 30.63 45.02, 11.25 45 M11.25 45 C5.71 44.64, 1.16 40.37, 0 33.75 M11.25 45 C5.72 44.06, -1.48 43.39, 0 33.75 M0 33.75 C1.47 26.67, 1.17 17.01, 0 11.25 M0 33.75 C-0.84 27.47, -0.16 23.37, 0 11.25 M0 11.25 C-1.17 3.17, 4.01 0.15, 11.25 0 M0 11.25 C-1.86 3.23, 4.64 -0.27, 11.25 0"
			stroke="currentColor"
			stroke-width="1"
			fill="none"
		></path>
	</g>
	<g
		transform="translate(263.5060471152285 271.0719074998648) rotate(0 18.84166717529297 12.5)"
	>
		<text
			x="-20"
			y="18"
			font-family="Excalifont, Xiaolai, Segoe UI Emoji"
			font-size="20px"
			fill="#000"
			text-anchor="start"
			style="white-space: pre"
			direction="ltr"
			dominant-baseline="alphabetic"
		>
			List
		</text>
	</g>
	<g
		stroke-linecap="round"
		transform="translate(10 564.4095906706798) rotate(0 69.49999999999994 22.5)"
	>
		<path
			d="M11.25 0 C40.78 -1.51, 65.77 -3.2, 127.75 0 C132.84 -1.51, 137.27 7.18, 139 11.25 C141.46 21.13, 140.84 27.76, 139 33.75 C138.82 41.83, 135.86 46.56, 127.75 45 C101.87 44.33, 76.99 43.58, 11.25 45 C6.47 47.85, -0.27 44.04, 0 33.75 C3.26 27.2, 2.03 22.94, 0 11.25 C-1.66 2.23, 6.18 0.69, 11.25 0"
			stroke="none"
			stroke-width="0"
			fill="#b2f2bb"
		></path>
		<path
			d="M11.25 0 C47.13 -1.54, 82.95 -0.67, 127.75 0 M11.25 0 C45.75 0.61, 80.01 -0.56, 127.75 0 M127.75 0 C135.78 -1.44, 139.2 5.22, 139 11.25 M127.75 0 C135.34 0.97, 140.79 2.75, 139 11.25 M139 11.25 C140.48 18.1, 138.48 28.57, 139 33.75 M139 11.25 C139.68 16.79, 139.62 21.44, 139 33.75 M139 33.75 C140.02 39.57, 136.87 45.32, 127.75 45 M139 33.75 C137.41 42.31, 133.61 46.16, 127.75 45 M127.75 45 C105.05 46.7, 77.67 44.27, 11.25 45 M127.75 45 C82.59 45.32, 37.41 46.36, 11.25 45 M11.25 45 C2.8 44.64, 0.89 41.91, 0 33.75 M11.25 45 C5.41 43.65, -0.13 42.38, 0 33.75 M0 33.75 C0.52 23.24, 1.74 16.64, 0 11.25 M0 33.75 C-0.74 26.08, 0.06 18.97, 0 11.25 M0 11.25 C-1.07 2.77, 4.68 1.21, 11.25 0 M0 11.25 C2.2 4.51, 2.74 -0.28, 11.25 0"
			stroke="currentColor"
			stroke-width="1"
			fill="none"
		></path>
	</g>
	<g
		transform="translate(32 574.4095906706798) rotate(0 44.49166488647461 12.5)"
	>
		<text
			x="-30"
			y="18"
			font-family="Excalifont, Xiaolai, Segoe UI Emoji"
			font-size="20px"
			fill="#000"
			text-anchor="start"
			style="white-space: pre"
			direction="ltr"
			dominant-baseline="alphabetic"
		>
			ArrayList
		</text>
	</g>
	<g
		stroke-linecap="round"
		transform="translate(159.9088156305762 675.9816784124295) rotate(0 49.49999999999994 22.5)"
	>
		<path
			d="M11.25 0 C39.07 0.63, 63.9 2.89, 87.75 0 C93.93 -2.2, 102.2 6.62, 99 11.25 C98.61 20.23, 101.2 27.71, 99 33.75 C96.59 38.88, 93.49 47.95, 87.75 45 C70.67 45.98, 55.19 42.21, 11.25 45 C3.14 41.93, 3.04 41.81, 0 33.75 C-2.39 26.73, 1.46 12.39, 0 11.25 C-1.81 6.33, 4.11 1.15, 11.25 0"
			stroke="none"
			stroke-width="0"
			fill="#b2f2bb"
		></path>
		<path
			d="M11.25 0 C28.99 1.82, 45.76 -1.38, 87.75 0 M11.25 0 C35.4 -0.16, 58.24 -0.11, 87.75 0 M87.75 0 C93.5 -1.59, 100.72 3.82, 99 11.25 M87.75 0 C94.04 -1.34, 97.17 1.9, 99 11.25 M99 11.25 C100.15 18.61, 99.83 20.92, 99 33.75 M99 11.25 C98.37 16.74, 98.66 20.8, 99 33.75 M99 33.75 C97.93 39.34, 97.19 46.38, 87.75 45 M99 33.75 C96.84 42.08, 93.13 45.55, 87.75 45 M87.75 45 C63.97 46.7, 41.44 44.53, 11.25 45 M87.75 45 C57.82 44.44, 28.37 45.14, 11.25 45 M11.25 45 C4.08 45.57, 0.33 41.96, 0 33.75 M11.25 45 C5.15 45.56, 1.7 41.69, 0 33.75 M0 33.75 C1.79 26.36, -1.23 15.8, 0 11.25 M0 33.75 C0.79 27.89, -0.45 23.29, 0 11.25 M0 11.25 C-1.97 3.53, 3.72 -1.88, 11.25 0 M0 11.25 C-2.24 3.91, 1.57 -0.15, 11.25 0"
			stroke="currentColor"
			stroke-width="1"
			fill="none"
		></path>
	</g>
	<g
		transform="translate(181.9088156305762 685.9816784124295) rotate(0 27.883333206176758 12.5)"
	>
		<text
			x="-30"
			y="18"
			font-family="Excalifont, Xiaolai, Segoe UI Emoji"
			font-size="20px"
			fill="#000"
			text-anchor="start"
			style="white-space: pre"
			direction="ltr"
			dominant-baseline="alphabetic"
		>
			Stack
		</text>
	</g>
	<g
		stroke-linecap="round"
		transform="translate(330.21769614823097 560.6505199978369) rotate(0 69.49999999999994 22.5)"
	>
		<path
			d="M11.25 0 C52.98 2.08, 86.05 -3.31, 127.75 0 C137.87 -2.56, 137.74 1.56, 139 11.25 C137.73 15.2, 138.89 19.46, 139 33.75 C141.66 38.65, 138.77 46.3, 127.75 45 C100.5 40.29, 73.15 41.23, 11.25 45 C4.51 48.23, -0.96 38.65, 0 33.75 C0.72 27.22, -1.4 18.44, 0 11.25 C-1.04 5.6, 1.66 -0.04, 11.25 0"
			stroke="none"
			stroke-width="0"
			fill="#b2f2bb"
		></path>
		<path
			d="M11.25 0 C45.1 -0.66, 75.33 1.53, 127.75 0 M11.25 0 C48.28 0.02, 83.87 1.08, 127.75 0 M127.75 0 C136.69 1.45, 138.1 2.96, 139 11.25 M127.75 0 C134.79 -1.93, 140.47 3.56, 139 11.25 M139 11.25 C137.05 19.5, 137.77 25.48, 139 33.75 M139 11.25 C138.45 18.47, 138.94 24.54, 139 33.75 M139 33.75 C137.77 39.92, 134.75 46.97, 127.75 45 M139 33.75 C139.83 41.8, 133.63 43.88, 127.75 45 M127.75 45 C84.52 46.67, 44.73 46.05, 11.25 45 M127.75 45 C95.39 45.49, 61.13 45, 11.25 45 M11.25 45 C5.42 44.21, 0.42 41.64, 0 33.75 M11.25 45 C1.85 42.86, 0.97 42.01, 0 33.75 M0 33.75 C1.61 26.65, -0.95 18.46, 0 11.25 M0 33.75 C-0.35 24.62, -0.79 15.94, 0 11.25 M0 11.25 C1.81 3.61, 3.55 -0.15, 11.25 0 M0 11.25 C0.55 2, 3.63 1, 11.25 0"
			stroke="currentColor"
			stroke-width="1"
			fill="none"
		></path>
	</g>
	<g
		transform="translate(352.21769614823097 570.6505199978369) rotate(0 48.724998474121094 12.5)"
	>
		<text
			x="-25"
			y="18"
			font-family="Excalifont, Xiaolai, Segoe UI Emoji"
			font-size="20px"
			fill="#000"
			text-anchor="start"
			style="white-space: pre"
			direction="ltr"
			dominant-baseline="alphabetic"
		>
			LinkedList
		</text>
	</g>
	<g
		stroke-linecap="round"
		transform="translate(803.2140372379733 561.6384257673794) rotate(0 76.82232656224642 22.5)"
	>
		<path
			d="M11.25 0 C54.4 -4.05, 96.49 -3.65, 142.39 0 C151.83 -0.98, 156.21 5.24, 153.64 11.25 C155.31 12.27, 153.36 17.71, 153.64 33.75 C156.95 43.55, 153.18 42.86, 142.39 45 C108.03 47.81, 79.88 47.65, 11.25 45 C6.41 47.96, -1.59 42.82, 0 33.75 C1.68 23.49, 2.89 20.43, 0 11.25 C-2.19 3, 5.41 2.63, 11.25 0"
			stroke="none"
			stroke-width="0"
			fill="#b2f2bb"
		></path>
		<path
			d="M11.25 0 C41.88 -2.32, 72.08 -0.85, 142.39 0 M11.25 0 C43.69 0.87, 75.89 1.7, 142.39 0 M142.39 0 C148.3 0.32, 155 4.51, 153.64 11.25 M142.39 0 C149.47 1.28, 155.36 2.55, 153.64 11.25 M153.64 11.25 C154.72 20.56, 154.17 28.19, 153.64 33.75 M153.64 11.25 C154.27 17.87, 153.22 23.83, 153.64 33.75 M153.64 33.75 C152.32 42.93, 149.95 44.19, 142.39 45 M153.64 33.75 C152.52 41.18, 148.85 42.83, 142.39 45 M142.39 45 C100.76 45.57, 61.02 46.57, 11.25 45 M142.39 45 C96.49 46.03, 51.07 45.05, 11.25 45 M11.25 45 C2.84 43.15, 0.04 39.92, 0 33.75 M11.25 45 C2.4 44.65, 2.12 42.95, 0 33.75 M0 33.75 C0.75 27.92, 0.18 17.33, 0 11.25 M0 33.75 C-0.16 26.38, -0.6 19.89, 0 11.25 M0 11.25 C-1.3 3.41, 4.2 -0.32, 11.25 0 M0 11.25 C-0.58 5.19, 2.18 -2.17, 11.25 0"
			stroke="currentColor"
			stroke-width="1"
			fill="none"
		></path>
	</g>
	<g
		transform="translate(813.9489194499017 571.6384257673794) rotate(0 66.71666717529297 12.5)"
	>
		<text
			x="-30"
			y="18"
			font-family="Excalifont, Xiaolai, Segoe UI Emoji"
			font-size="20px"
			fill="#000"
			text-anchor="start"
			style="white-space: pre"
			direction="ltr"
			dominant-baseline="alphabetic"
		>
			PriorityQueue
		</text>
	</g>
	<g
		stroke-linecap="round"
		transform="translate(1003.5945278563838 561.4998197581151) rotate(0 68.93674411059624 22.5)"
	>
		<path
			d="M11.25 0 C37.4 -1.88, 71.58 1.11, 126.62 0 C132.29 1.59, 135.79 5.15, 137.87 11.25 C136.33 18.17, 134.79 20.43, 137.87 33.75 C137.58 39.77, 132.6 45.2, 126.62 45 C87.84 40.87, 53.86 44.4, 11.25 45 C5.54 48.55, -1.23 41.04, 0 33.75 C3.22 24.22, 1.05 16.27, 0 11.25 C-1.94 5, 6.81 -1.7, 11.25 0"
			stroke="none"
			stroke-width="0"
			fill="#b2f2bb"
		></path>
		<path
			d="M11.25 0 C49.35 0.85, 90.39 -0.31, 126.62 0 M11.25 0 C40.81 0.82, 71.78 -0.62, 126.62 0 M126.62 0 C132.65 0.32, 137.5 5.66, 137.87 11.25 M126.62 0 C135.78 0.9, 137.97 3.92, 137.87 11.25 M137.87 11.25 C138.73 21.21, 136.69 27.62, 137.87 33.75 M137.87 11.25 C137.13 15.53, 138.47 22.11, 137.87 33.75 M137.87 33.75 C138.91 41.48, 134.96 43.83, 126.62 45 M137.87 33.75 C136.7 43.36, 133.02 44.83, 126.62 45 M126.62 45 C95.63 45.94, 61.99 47.85, 11.25 45 M126.62 45 C82.99 43.44, 37.83 44.24, 11.25 45 M11.25 45 C2.69 43.95, -0.04 40.09, 0 33.75 M11.25 45 C2.61 46.31, 0.81 40.46, 0 33.75 M0 33.75 C1.96 29.54, 0.95 20.29, 0 11.25 M0 33.75 C0.93 26.7, -0.8 18.29, 0 11.25 M0 11.25 C-0.17 5.52, 3.1 -1.89, 11.25 0 M0 11.25 C2.13 5.53, 4.4 2.16, 11.25 0"
			stroke="currentColor"
			stroke-width="1"
			fill="none"
		></path>
	</g>
	<g
		transform="translate(1014.3294100683122 571.4998197581151) rotate(0 55.05833435058594 12.5)"
	>
		<text
			x="-30"
			y="18"
			font-family="Excalifont, Xiaolai, Segoe UI Emoji"
			font-size="20px"
			fill="#000"
			text-anchor="start"
			style="white-space: pre"
			direction="ltr"
			dominant-baseline="alphabetic"
		>
			ArrayDeque
		</text>
	</g>
	<g
		stroke-linecap="round"
		transform="translate(1216.3666480416728 557.9816784124291) rotate(0 50.91255564968162 22.5)"
	>
		<path
			d="M11.25 0 C36.51 0.75, 65.13 -3.59, 90.58 0 C100.37 -0.72, 98.51 1.47, 101.83 11.25 C104.95 16.52, 102.73 25.7, 101.83 33.75 C100.06 41.53, 94.48 44.24, 90.58 45 C63.49 47.57, 32.17 49.1, 11.25 45 C4.96 41.46, 0.14 38.69, 0 33.75 C0.14 25.91, -2.99 18.92, 0 11.25 C-1.24 2.09, 2.66 -2.83, 11.25 0"
			stroke="none"
			stroke-width="0"
			fill="#b2f2bb"
		></path>
		<path
			d="M11.25 0 C42.68 -0.27, 72.47 2.22, 90.58 0 M11.25 0 C36.12 -0.28, 61.19 -0.25, 90.58 0 M90.58 0 C99.75 -0.79, 102.99 2.81, 101.83 11.25 M90.58 0 C96.79 -0.11, 103.97 4.95, 101.83 11.25 M101.83 11.25 C103.44 16.39, 103.5 25.49, 101.83 33.75 M101.83 11.25 C100.92 18.81, 101.63 28.91, 101.83 33.75 M101.83 33.75 C99.94 41.25, 96.83 45.24, 90.58 45 M101.83 33.75 C103 41.14, 95.92 44.66, 90.58 45 M90.58 45 C63.18 44.05, 41.37 44.88, 11.25 45 M90.58 45 C60.84 45.06, 29.03 46.09, 11.25 45 M11.25 45 C4.22 44.15, 0.97 41.07, 0 33.75 M11.25 45 C3.31 44.68, -0.84 41.89, 0 33.75 M0 33.75 C0.76 28.29, -1.45 21.73, 0 11.25 M0 33.75 C0.78 26.89, 0.23 18.69, 0 11.25 M0 11.25 C0.49 4.96, 2.93 -0.47, 11.25 0 M0 11.25 C1.73 3.17, 5.34 1.52, 11.25 0"
			stroke="currentColor"
			stroke-width="1"
			fill="none"
		></path>
	</g>
	<g
		transform="translate(1227.101530253601 567.9816784124291) rotate(0 39.53333282470703 12.5)"
	>
		<text
			x="-25"
			y="18"
			font-family="Excalifont, Xiaolai, Segoe UI Emoji"
			font-size="20px"
			fill="#000"
			text-anchor="start"
			style="white-space: pre"
			direction="ltr"
			dominant-baseline="alphabetic"
		>
			TreeSet
		</text>
	</g>
	<g
		stroke-linecap="round"
		transform="translate(1403.2289973143966 562.3491195183932) rotate(0 50.91255564968162 22.5)"
	>
		<path
			d="M11.25 0 C40.85 1.42, 72.87 -0.16, 90.58 0 C94.48 -2.86, 103.11 1.62, 101.83 11.25 C104.16 19.45, 102.45 29.2, 101.83 33.75 C105.29 39.95, 100.88 44.32, 90.58 45 C60.85 48.18, 28.61 44.6, 11.25 45 C4.39 43.84, -3.27 38.78, 0 33.75 C-3.32 25.58, 2.08 23.27, 0 11.25 C-1.27 0.26, 3.21 -1.18, 11.25 0"
			stroke="none"
			stroke-width="0"
			fill="#b2f2bb"
		></path>
		<path
			d="M11.25 0 C35.36 0.08, 63.04 0.8, 90.58 0 M11.25 0 C36.77 -0.78, 64 0.34, 90.58 0 M90.58 0 C100.06 -1.05, 101.64 2.95, 101.83 11.25 M90.58 0 C96.32 -1.44, 100.39 4.64, 101.83 11.25 M101.83 11.25 C100.21 20.25, 102.5 26.32, 101.83 33.75 M101.83 11.25 C101.27 16.29, 102.24 20.96, 101.83 33.75 M101.83 33.75 C103.36 41.68, 99.78 46.01, 90.58 45 M101.83 33.75 C103.42 41.83, 96.6 46.87, 90.58 45 M90.58 45 C64.11 45.6, 40.22 45.97, 11.25 45 M90.58 45 C61.15 45.29, 30.87 46.15, 11.25 45 M11.25 45 C4.19 46.15, 0.32 39.93, 0 33.75 M11.25 45 C4.99 43.83, -0.24 41, 0 33.75 M0 33.75 C0.32 26.69, 0.95 18.99, 0 11.25 M0 33.75 C-0.76 26.67, 0.12 19.94, 0 11.25 M0 11.25 C0.09 5.43, 2.43 -1.24, 11.25 0 M0 11.25 C1.65 2.11, 3.62 -0.86, 11.25 0"
			stroke="currentColor"
			stroke-width="1"
			fill="none"
		></path>
	</g>
	<g
		transform="translate(1413.9638795263247 572.3491195183932) rotate(0 39.70833206176758 12.5)"
	>
		<text
			x="-30"
			y="18"
			font-family="Excalifont, Xiaolai, Segoe UI Emoji"
			font-size="20px"
			fill="#000"
			text-anchor="start"
			style="white-space: pre"
			direction="ltr"
			dominant-baseline="alphabetic"
		>
			HashSet
		</text>
	</g>
	<g
		stroke-linecap="round"
		transform="translate(1398.5843441899037 683.8737856203022) rotate(0 76.8223265622463 22.5)"
	>
		<path
			d="M11.25 0 C43.49 -0.56, 71.43 2.6, 142.39 0 C146.48 1.57, 153.6 1.28, 153.64 11.25 C156.99 16.77, 156.06 22.38, 153.64 33.75 C153.69 42.94, 149.15 46.97, 142.39 45 C94.1 44.66, 42.42 44.89, 11.25 45 C1.08 44.31, 2.03 40.73, 0 33.75 C-2.57 22.56, 2.4 21.3, 0 11.25 C-2.28 3.49, 5.33 -1.15, 11.25 0"
			stroke="none"
			stroke-width="0"
			fill="#b2f2bb"
		></path>
		<path
			d="M11.25 0 C42.5 -0.96, 78.68 2.33, 142.39 0 M11.25 0 C54.89 -0.34, 96.56 -0.07, 142.39 0 M142.39 0 C151.55 0.72, 151.67 3.82, 153.64 11.25 M142.39 0 C148.53 0.62, 151.55 2.12, 153.64 11.25 M153.64 11.25 C152.64 16.65, 152.37 23.36, 153.64 33.75 M153.64 11.25 C153.22 16.11, 153.48 21.95, 153.64 33.75 M153.64 33.75 C155.16 40.24, 151.79 45.98, 142.39 45 M153.64 33.75 C155.36 41.77, 149.96 46.33, 142.39 45 M142.39 45 C112.83 44.84, 81.02 42.74, 11.25 45 M142.39 45 C93.27 44.56, 42.14 44.63, 11.25 45 M11.25 45 C2.52 43.28, -0.44 39.36, 0 33.75 M11.25 45 C3.54 46.48, -1.77 39.33, 0 33.75 M0 33.75 C-1.26 28.17, 0.83 22.32, 0 11.25 M0 33.75 C-0.23 29.24, -0.44 24.62, 0 11.25 M0 11.25 C-0.5 4.11, 4.76 0.96, 11.25 0 M0 11.25 C-1.31 3.9, 2.28 0.63, 11.25 0"
			stroke="currentColor"
			stroke-width="1"
			fill="none"
		></path>
	</g>
	<g
		transform="translate(1407.0662028442175 695.0002973991094) rotate(0 69.59166717529297 12.5)"
	>
		<text
			x="-30"
			y="18"
			font-family="Excalifont, Xiaolai, Segoe UI Emoji"
			font-size="20px"
			fill="#000"
			text-anchor="start"
			style="white-space: pre"
			direction="ltr"
			dominant-baseline="alphabetic"
		>
			LinkedHashSet
		</text>
	</g>
	<g
		stroke-linecap="round"
		transform="translate(171.9088156305762 564.7891260071015) rotate(0 50.99999999999994 22.5)"
	>
		<path
			d="M11.25 0 C31.11 0.47, 51.26 3.11, 90.75 0 C95.65 3.52, 103.3 1.1, 102 11.25 C98.87 16.79, 99.81 26.79, 102 33.75 C105.23 40.29, 95.65 48.4, 90.75 45 C71.19 43.75, 49.38 44.2, 11.25 45 C5.6 42.91, -0.04 41.93, 0 33.75 C-1.43 28.35, -1.66 21.03, 0 11.25 C3.52 0.75, 1.43 2.42, 11.25 0"
			stroke="none"
			stroke-width="0"
			fill="#b2f2bb"
		></path>
		<path
			d="M11.25 0 C40.53 -1.47, 66.12 -0.98, 90.75 0 M11.25 0 C28.49 0.04, 45.99 -0.91, 90.75 0 M90.75 0 C99.59 -1.23, 102.41 3.78, 102 11.25 M90.75 0 C100.55 -0.98, 100.22 4.75, 102 11.25 M102 11.25 C100.61 16.85, 103.91 24.19, 102 33.75 M102 11.25 C102.46 18.69, 102.66 25.25, 102 33.75 M102 33.75 C102.71 42.43, 98.34 44.72, 90.75 45 M102 33.75 C103.33 42.44, 100.47 44.74, 90.75 45 M90.75 45 C65.92 46.08, 43.07 44.01, 11.25 45 M90.75 45 C75.07 44.6, 58.54 45.99, 11.25 45 M11.25 45 C5.16 43.9, 1.72 42.83, 0 33.75 M11.25 45 C2.05 43.66, -1.19 39.87, 0 33.75 M0 33.75 C0.03 28.95, 0.02 25.03, 0 11.25 M0 33.75 C0.37 29.38, 0.58 24.39, 0 11.25 M0 11.25 C1.82 1.82, 2.57 1.46, 11.25 0 M0 11.25 C-1.63 2.95, 2.35 -1.41, 11.25 0"
			stroke="currentColor"
			stroke-width="1"
			fill="none"
		></path>
	</g>
	<g
		transform="translate(192.9088156305762 573.7891260071015) rotate(0 31.674999237060547 12.5)"
	>
		<text
			x="-30"
			y="18"
			font-family="Excalifont, Xiaolai, Segoe UI Emoji"
			font-size="20px"
			fill="#000"
			text-anchor="start"
			style="white-space: pre"
			direction="ltr"
			dominant-baseline="alphabetic"
		>
			Vector
		</text>
	</g>
	<g
		stroke-linecap="round"
		transform="translate(740.5060471152285 268.0719074998648) rotate(0 58 22.5)"
	>
		<path
			d="M11.25 0 C44.01 0.21, 83.04 -2.33, 104.75 0 C114.09 -3.37, 116.65 1.94, 116 11.25 C113.47 14.8, 117.83 28.32, 116 33.75 C117.71 40.35, 111.8 42.71, 104.75 45 C81.88 44.88, 50.03 43.31, 11.25 45 C5.78 44.97, 2.1 43.22, 0 33.75 C3.35 26.4, 2.62 15.72, 0 11.25 C2.96 2.85, 1.57 2.06, 11.25 0"
			stroke="none"
			stroke-width="0"
			fill="#a5d8ff"
		></path>
		<path
			d="M11.25 0 C40.39 1.48, 72.93 -1.17, 104.75 0 M11.25 0 C34.21 -1.73, 59.5 -0.44, 104.75 0 M104.75 0 C111.54 0.98, 116.66 4.48, 116 11.25 M104.75 0 C110.85 -0.98, 117.8 3.95, 116 11.25 M116 11.25 C116.78 19.98, 117.64 27.63, 116 33.75 M116 11.25 C116.53 19.87, 116.78 29.28, 116 33.75 M116 33.75 C117.07 39.88, 111.15 45.2, 104.75 45 M116 33.75 C117.33 40.19, 113.31 46.89, 104.75 45 M104.75 45 C72.04 44.46, 34.54 45.03, 11.25 45 M104.75 45 C76.42 45.33, 46.54 45.32, 11.25 45 M11.25 45 C3.33 44.41, 0.65 41.49, 0 33.75 M11.25 45 C3.72 46.63, -0.86 40.42, 0 33.75 M0 33.75 C-1.67 30.04, -1.63 25.12, 0 11.25 M0 33.75 C-0.82 27.8, 0.55 22.05, 0 11.25 M0 11.25 C-1.41 4.08, 4.09 0.06, 11.25 0 M0 11.25 C0.14 4.62, 5.67 -1.96, 11.25 0"
			stroke="currentColor"
			stroke-width="1"
			fill="none"
		></path>
	</g>
	<g
		transform="translate(768.5060471152285 278.0719074998648) rotate(0 29.383333206176758 12.5)"
	>
		<text
			x="-20"
			y="18"
			font-family="Excalifont, Xiaolai, Segoe UI Emoji"
			font-size="20px"
			fill="#000"
			text-anchor="start"
			style="white-space: pre"
			direction="ltr"
			dominant-baseline="alphabetic"
		>
			Queue
		</text>
	</g>
	<g
		stroke-linecap="round"
		transform="translate(882.3079252356658 405.36773850507393) rotate(0 58 22.5)"
	>
		<path
			d="M11.25 0 C41.73 -1.33, 71.51 -1.99, 104.75 0 C114.34 -0.01, 117.94 3.34, 116 11.25 C115.1 13.91, 118.64 19.51, 116 33.75 C112.44 44.7, 114.29 47.59, 104.75 45 C83.4 47.73, 55.66 44.68, 11.25 45 C2.46 46.42, -3.18 43.36, 0 33.75 C-0.99 29.86, 0.19 23.18, 0 11.25 C3.55 6.66, 1.8 -2.99, 11.25 0"
			stroke="none"
			stroke-width="0"
			fill="#a5d8ff"
		></path>
		<path
			d="M11.25 0 C37.88 -1, 62.79 -0.57, 104.75 0 M11.25 0 C33.97 -0.07, 59.12 -0.8, 104.75 0 M104.75 0 C113.1 0.47, 116.54 3.73, 116 11.25 M104.75 0 C112.22 -1.02, 116.5 1.85, 116 11.25 M116 11.25 C116.53 16.25, 116.05 20.79, 116 33.75 M116 11.25 C115.27 16.38, 116.59 23.36, 116 33.75 M116 33.75 C114.71 42.56, 112.64 46.01, 104.75 45 M116 33.75 C116.9 40.09, 113.1 47.04, 104.75 45 M104.75 45 C85.2 46.37, 63.2 47.63, 11.25 45 M104.75 45 C74.21 44.23, 44.82 45.29, 11.25 45 M11.25 45 C3.29 43.1, 0.93 40.17, 0 33.75 M11.25 45 C4.08 46.1, 1.65 41.62, 0 33.75 M0 33.75 C2.05 25.81, 0.99 14.63, 0 11.25 M0 33.75 C0.4 26.66, 0.6 19.63, 0 11.25 M0 11.25 C0.27 3.24, 4.86 -0.78, 11.25 0 M0 11.25 C-0.88 4.37, 2.5 -1.47, 11.25 0"
			stroke="currentColor"
			stroke-width="1"
			fill="none"
		></path>
	</g>
	<g
		transform="translate(910.3079252356658 415.36773850507393) rotate(0 29.40833282470703 12.5)"
	>
		<text
			x="-25"
			y="18"
			font-family="Excalifont, Xiaolai, Segoe UI Emoji"
			font-size="20px"
			fill="#000"
			text-anchor="start"
			style="white-space: pre"
			direction="ltr"
			dominant-baseline="alphabetic"
		>
			Deque
		</text>
	</g>
	<g
		stroke-linecap="round"
		transform="translate(1048.5060471152285 251.07190749986478) rotate(0 45 22.5)"
	>
		<path
			d="M11.25 0 C26.73 -4.43, 52.07 -0.98, 78.75 0 C89.04 -0.09, 90.56 4.35, 90 11.25 C87.04 19.33, 89.1 24.09, 90 33.75 C90.15 40.86, 88.01 45.76, 78.75 45 C57.18 47.28, 32.36 44.1, 11.25 45 C4.14 42.57, -3.35 38.56, 0 33.75 C-1.49 27.39, 2.6 19.71, 0 11.25 C-2.07 4.04, 0.59 -0.06, 11.25 0"
			stroke="none"
			stroke-width="0"
			fill="#a5d8ff"
		></path>
		<path
			d="M11.25 0 C33.44 -1.26, 58.98 -0.59, 78.75 0 M11.25 0 C33.27 0.82, 55.23 0.2, 78.75 0 M78.75 0 C84.56 -0.97, 88.95 4.17, 90 11.25 M78.75 0 C86.13 -2.02, 91.19 5.68, 90 11.25 M90 11.25 C89.94 14.62, 91.16 20.79, 90 33.75 M90 11.25 C89.21 16.6, 89 23.28, 90 33.75 M90 33.75 C88.59 42.85, 87.09 46.68, 78.75 45 M90 33.75 C91.42 43.26, 85.92 45.59, 78.75 45 M78.75 45 C60.4 44.81, 45.72 43.43, 11.25 45 M78.75 45 C55.29 43.73, 33 44.78, 11.25 45 M11.25 45 C5.27 43.13, -1.93 41.38, 0 33.75 M11.25 45 C4.17 45.51, -0.18 39.95, 0 33.75 M0 33.75 C0.17 28.87, -0.48 22.46, 0 11.25 M0 33.75 C0.79 26.15, 1.05 20.37, 0 11.25 M0 11.25 C-0.97 3.81, 4.81 -0.44, 11.25 0 M0 11.25 C-2.27 3.34, 1.77 -1.42, 11.25 0"
			stroke="currentColor"
			stroke-width="1"
			fill="none"
		></path>
	</g>
	<g
		transform="translate(1076.5060471152285 261.0719074998648) rotate(0 17.116666793823242 12.5)"
	>
		<text
			x="-30"
			y="18"
			font-family="Excalifont, Xiaolai, Segoe UI Emoji"
			font-size="20px"
			fill="#000"
			text-anchor="start"
			style="white-space: pre"
			direction="ltr"
			dominant-baseline="alphabetic"
		>
			Set
		</text>
	</g>
	<g
		stroke-linecap="round"
		transform="translate(1371.676321623619 403.012391629567) rotate(0 64.15070023972169 22.5)"
	>
		<path
			d="M11.25 0 C39.48 3.05, 74.6 -0.11, 117.05 0 C123.28 3.26, 131.69 7, 128.3 11.25 C126.22 14.28, 129.09 22.26, 128.3 33.75 C129.66 43.97, 127.51 46.94, 117.05 45 C85.32 42.81, 61.93 44.92, 11.25 45 C5.92 45.09, -0.82 41.69, 0 33.75 C-1.51 26.08, 1.32 21.94, 0 11.25 C0.79 5.42, 0.23 -3.09, 11.25 0"
			stroke="none"
			stroke-width="0"
			fill="#a5d8ff"
		></path>
		<path
			d="M11.25 0 C35.2 1.04, 55.96 -0.62, 117.05 0 M11.25 0 C43.76 0.58, 75.87 0.41, 117.05 0 M117.05 0 C123.31 -1.93, 129.33 5.26, 128.3 11.25 M117.05 0 C126.8 -0.1, 126.34 5.9, 128.3 11.25 M128.3 11.25 C129.48 16.12, 128.05 23.54, 128.3 33.75 M128.3 11.25 C127.59 17.51, 128.08 22.56, 128.3 33.75 M128.3 33.75 C129.02 39.92, 124.42 43.24, 117.05 45 M128.3 33.75 C130.19 40.83, 123.36 43.69, 117.05 45 M117.05 45 C86.58 44.66, 55.73 45.36, 11.25 45 M117.05 45 C86.04 44.66, 53.5 43.76, 11.25 45 M11.25 45 C2.34 45.8, 1.51 40.59, 0 33.75 M11.25 45 C1.63 47.25, 1.23 40.84, 0 33.75 M0 33.75 C-0.9 28.54, 0.06 25.4, 0 11.25 M0 33.75 C-0.08 26.03, 1.04 19.88, 0 11.25 M0 11.25 C0.19 5.68, 3.15 1.49, 11.25 0 M0 11.25 C-1.85 3.7, 2.33 1.01, 11.25 0"
			stroke="currentColor"
			stroke-width="1"
			fill="none"
		></path>
	</g>
	<g
		transform="translate(1387.2846920567401 414.1389034083742) rotate(0 50.70000076293945 12.5)"
	>
		<text
			x="-25"
			y="18"
			font-family="Excalifont, Xiaolai, Segoe UI Emoji"
			font-size="20px"
			fill="#000"
			text-anchor="start"
			style="white-space: pre"
			direction="ltr"
			dominant-baseline="alphabetic"
		>
			SortedSet
		</text>
	</g>
	<g stroke-linecap="round">
		<g
			transform="translate(662.6990635782388 122.07190749986478) rotate(0 -2.0793230253187858 -19)"
		>
			<path
				d="M-0.49 -0.54 C-1.15 -6.94, -3.08 -31.89, -3.67 -38.2 M0.26 0.37 C-0.46 -5.98, -3.09 -31.21, -3.85 -37.6"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(662.6990635782388 122.07190749986478) rotate(0 -2.0793230253187858 -19)"
		>
			<path
				d="M4.62 -20.46 C0.63 -25.76, -1.8 -32.45, -3.85 -37.6 M4.62 -20.46 C3 -24.86, 0.69 -28.57, -3.85 -37.6"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(662.6990635782388 122.07190749986478) rotate(0 -2.0793230253187858 -19)"
		>
			<path
				d="M-8.37 -19.03 C-7.73 -24.78, -5.52 -31.98, -3.85 -37.6 M-8.37 -19.03 C-6.91 -23.71, -6.14 -27.76, -3.85 -37.6"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
	</g>
	<g stroke-linecap="round">
		<g
			transform="translate(299.1019204484942 252.07190749986478) rotate(0 165.73569199987475 -35.5)"
		>
			<path
				d="M-0.1 0.06 C55.33 -11.72, 277.36 -60.11, 332.63 -71.81 M-1.61 -0.96 C53.75 -12.5, 276.89 -58.85, 332.3 -70.69"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(299.1019204484942 252.07190749986478) rotate(0 165.73569199987475 -35.5)"
		>
			<path
				d="M311.07 -57.49 C317.81 -59.59, 322.89 -65.43, 332.3 -70.69 M311.07 -57.49 C318.7 -61.97, 326.84 -67.3, 332.3 -70.69"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(299.1019204484942 252.07190749986478) rotate(0 165.73569199987475 -35.5)"
		>
			<path
				d="M307.55 -74.23 C315.21 -71.18, 321.37 -71.88, 332.3 -70.69 M307.55 -74.23 C316.35 -72.49, 325.81 -71.56, 332.3 -70.69"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
	</g>
	<g stroke-linecap="round">
		<g
			transform="translate(760.011005894585 258.0719074998648) rotate(0 -50.84759982320196 -38.5)"
		>
			<path
				d="M-0.22 -0.24 C-17.1 -13.34, -85.51 -65.21, -102.25 -78.15 M-1.8 -1.41 C-18.79 -14.45, -86.98 -64.62, -103.49 -77.22"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(760.011005894585 258.0719074998648) rotate(0 -50.84759982320196 -38.5)"
		>
			<path
				d="M-79.55 -70 C-85.13 -72.52, -91.8 -71.4, -103.49 -77.22 M-79.55 -70 C-84.77 -72.6, -90.14 -73.28, -103.49 -77.22"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(760.011005894585 258.0719074998648) rotate(0 -50.84759982320196 -38.5)"
		>
			<path
				d="M-89.79 -56.3 C-93.22 -61.75, -97.69 -63.58, -103.49 -77.22 M-89.79 -56.3 C-92.57 -61.94, -95.61 -65.75, -103.49 -77.22"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
	</g>
	<g stroke-linecap="round">
		<g
			transform="translate(1077.02442670375 244.07190749986478) rotate(0 -183.74273257873438 -30)"
		>
			<path
				d="M-0.02 0.41 C-61.34 -9.37, -307.61 -49.55, -368.66 -59.42 M-1.48 -0.42 C-62.39 -10.49, -305.73 -51.21, -366.57 -61.24"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(1077.02442670375 244.07190749986478) rotate(0 -183.74273257873438 -30)"
		>
			<path
				d="M-342 -65.82 C-347.23 -66.69, -352.83 -61.74, -366.57 -61.24 M-342 -65.82 C-351.33 -63.41, -361.07 -61.27, -366.57 -61.24"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(1077.02442670375 244.07190749986478) rotate(0 -183.74273257873438 -30)"
		>
			<path
				d="M-344.8 -48.95 C-349.25 -53.86, -354.19 -52.95, -366.57 -61.24 M-344.8 -48.95 C-353.01 -53.26, -361.63 -57.84, -366.57 -61.24"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
	</g>
	<g stroke-linecap="round">
		<g
			transform="translate(72.52800869291741 552.4095906706798) rotate(0 84.98901921115555 -120.1688415854075)"
		>
			<path
				d="M-0.1 0.59 C28.26 -39.38, 141.53 -200.68, 169.9 -240.73"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
				stroke-dasharray="8 9"
			></path>
		</g>
		<g
			transform="translate(72.52800869291741 552.4095906706798) rotate(0 84.98901921115555 -120.1688415854075)"
		>
			<path
				d="M163.35 -216.6 C166.34 -223.46, 166.54 -229.8, 169.9 -240.73"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(72.52800869291741 552.4095906706798) rotate(0 84.98901921115555 -120.1688415854075)"
		>
			<path
				d="M149.38 -226.46 C156.19 -230.55, 160.28 -234.14, 169.9 -240.73"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
			></path>
		</g>
	</g>
	<g stroke-linecap="round">
		<g
			transform="translate(419.6682126773902 546.6505199978369) rotate(0 -97.73783013603122 -130.06047115228625)"
		>
			<path
				d="M0.86 0.29 C-31.84 -43.09, -163.41 -216.28, -196.32 -259.51"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
				stroke-dasharray="8 9"
			></path>
		</g>
		<g
			transform="translate(419.6682126773902 546.6505199978369) rotate(0 -97.73783013603122 -130.06047115228625)"
		>
			<path
				d="M-175.3 -245.99 C-180.94 -251.14, -186.46 -255.53, -196.32 -259.51"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(419.6682126773902 546.6505199978369) rotate(0 -97.73783013603122 -130.06047115228625)"
		>
			<path
				d="M-188.91 -235.64 C-190.71 -243.86, -192.32 -251.22, -196.32 -259.51"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
			></path>
		</g>
	</g>
	<g stroke-linecap="round">
		<g
			transform="translate(254.04869917538406 552.7891260071015) rotate(0 27.228673969922227 -117.85860925361834)"
		>
			<path
				d="M0.99 -0.18 C10.05 -39.32, 44.37 -196.3, 53.29 -235.36"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
				stroke-dasharray="8 9"
			></path>
		</g>
		<g
			transform="translate(254.04869917538406 552.7891260071015) rotate(0 27.228673969922227 -117.85860925361834)"
		>
			<path
				d="M56.52 -210.57 C55.65 -217.71, 55.86 -220.91, 53.29 -235.36"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(254.04869917538406 552.7891260071015) rotate(0 27.228673969922227 -117.85860925361834)"
		>
			<path
				d="M39.83 -214.29 C42.46 -220.79, 46.18 -223.2, 53.29 -235.36"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
			></path>
		</g>
	</g>
	<g stroke-linecap="round">
		<g
			transform="translate(239.58339452484097 664.9816784124295) rotate(0 -12.076079418978168 -24.16145717683446)"
		>
			<path
				d="M0.51 -0.12 C-3.42 -8.2, -19.74 -40.3, -23.93 -48.25 M0.11 -0.66 C-3.85 -8.66, -20.31 -39.51, -24.25 -47.51"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(239.58339452484097 664.9816784124295) rotate(0 -12.076079418978168 -24.16145717683446)"
		>
			<path
				d="M-5.89 -30.54 C-10.55 -34.12, -14.59 -39.43, -24.25 -47.51 M-5.89 -30.54 C-12.69 -37.24, -20.03 -43.65, -24.25 -47.51"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(239.58339452484097 664.9816784124295) rotate(0 -12.076079418978168 -24.16145717683446)"
		>
			<path
				d="M-21.09 -22.71 C-22.12 -28.24, -22.52 -35.42, -24.25 -47.51 M-21.09 -22.71 C-22.01 -32.38, -23.45 -41.83, -24.25 -47.51"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
	</g>
	<g stroke-linecap="round">
		<g
			transform="translate(584.2437059778791 254.93330149060034) rotate(0 27.13117056867469 -35.43069699536778)"
		>
			<path
				d="M0.58 0.48 C9.64 -11.14, 45.49 -58.67, 54.41 -70.56"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
				stroke-dasharray="8 9"
			></path>
		</g>
		<g
			transform="translate(584.2437059778791 254.93330149060034) rotate(0 27.13117056867469 -35.43069699536778)"
		>
			<path
				d="M47.11 -46.65 C50.3 -53.74, 52.23 -61.53, 54.41 -70.56"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(584.2437059778791 254.93330149060034) rotate(0 27.13117056867469 -35.43069699536778)"
		>
			<path
				d="M33.45 -56.94 C40.74 -60.95, 46.84 -65.6, 54.41 -70.56"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
			></path>
		</g>
	</g>
	<g stroke-linecap="round">
		<g
			transform="translate(399.8006741614545 395.48522889592834) rotate(0 -33.647313523112985 -45.02697319803178)"
		>
			<path
				d="M-0.94 1.1 C-11.96 -14.14, -55.14 -75.15, -66.3 -90.36"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
				stroke-dasharray="8 9"
			></path>
		</g>
		<g
			transform="translate(399.8006741614545 395.48522889592834) rotate(0 -33.647313523112985 -45.02697319803178)"
		>
			<path
				d="M-45.64 -76.28 C-49.77 -78.76, -57.95 -85.4, -66.3 -90.36"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(399.8006741614545 395.48522889592834) rotate(0 -33.647313523112985 -45.02697319803178)"
		>
			<path
				d="M-59.52 -66.29 C-59.82 -71.48, -64.08 -80.95, -66.3 -90.36"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
			></path>
		</g>
	</g>
	<g stroke-linecap="round">
		<g
			transform="translate(508.71021585582525 390.48522889592834) rotate(0 34.436908322771444 -32.096276202664)"
		>
			<path
				d="M-1.18 -0.75 C10.38 -11.41, 57.05 -52.4, 68.86 -63.15 M0.4 1.47 C11.85 -9.58, 56.41 -53.73, 67.91 -64.73"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(508.71021585582525 390.48522889592834) rotate(0 34.436908322771444 -32.096276202664)"
		>
			<path
				d="M57.06 -42.2 C58.43 -47.88, 64.2 -52.23, 67.91 -64.73 M57.06 -42.2 C59.07 -46.21, 62.43 -51.81, 67.91 -64.73"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(508.71021585582525 390.48522889592834) rotate(0 34.436908322771444 -32.096276202664)"
		>
			<path
				d="M45.12 -54.44 C49.63 -56.87, 58.45 -58.09, 67.91 -64.73 M45.12 -54.44 C49.54 -56.01, 55.39 -59.04, 67.91 -64.73"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
	</g>
	<g stroke-linecap="round">
		<g
			transform="translate(121.05413639586686 557.2657632793205) rotate(0 146.58546069499005 -50.77463582690456)"
		>
			<path
				d="M1.1 1.09 C50.02 -15.9, 245.56 -85.03, 294.3 -102.12 M0.22 0.62 C49 -16.21, 245.15 -84.1, 293.95 -100.89"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(121.05413639586686 557.2657632793205) rotate(0 146.58546069499005 -50.77463582690456)"
		>
			<path
				d="M274.53 -85.14 C283.52 -89.23, 287.89 -96.27, 293.95 -100.89 M274.53 -85.14 C280.85 -90.48, 286.14 -94.74, 293.95 -100.89"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(121.05413639586686 557.2657632793205) rotate(0 146.58546069499005 -50.77463582690456)"
		>
			<path
				d="M268.95 -101.3 C279.98 -99.5, 286.4 -100.58, 293.95 -100.89 M268.95 -101.3 C277.11 -101.65, 284.12 -100.93, 293.95 -100.89"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
	</g>
	<g stroke-linecap="round">
		<g
			transform="translate(283.5953899195217 605.5186346544826) rotate(0 67.08674912661496 -71.62086621334652)"
		>
			<path
				d="M-1.16 0.56 C21.36 -22.95, 111.3 -117.99, 134.01 -142.06 M0.43 -0.19 C22.88 -23.91, 110.57 -119.78, 132.97 -143.56"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(283.5953899195217 605.5186346544826) rotate(0 67.08674912661496 -71.62086621334652)"
		>
			<path
				d="M123.28 -120.52 C126.38 -125.38, 129.39 -128.23, 132.97 -143.56 M123.28 -120.52 C126.52 -125.76, 128.41 -132.05, 132.97 -143.56"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(283.5953899195217 605.5186346544826) rotate(0 67.08674912661496 -71.62086621334652)"
		>
			<path
				d="M110.73 -132.14 C116.28 -134.52, 121.85 -135, 132.97 -143.56 M110.73 -132.14 C117.04 -134.5, 122.05 -137.91, 132.97 -143.56"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
	</g>
	<g stroke-linecap="round">
		<g
			transform="translate(1149.0988691304235 393.24061953641785) rotate(0 -15.481448875290994 -44.49721526288283)"
		>
			<path
				d="M-0.86 0.66 C-6.15 -13.98, -26.25 -73.89, -31.19 -88.89"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
				stroke-dasharray="8 9"
			></path>
		</g>
		<g
			transform="translate(1149.0988691304235 393.24061953641785) rotate(0 -15.481448875290994 -44.49721526288283)"
		>
			<path
				d="M-15.65 -69.31 C-19.72 -76.53, -25.99 -82.11, -31.19 -88.89"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(1149.0988691304235 393.24061953641785) rotate(0 -15.481448875290994 -44.49721526288283)"
		>
			<path
				d="M-31.87 -63.9 C-30.32 -72.87, -31.01 -80.3, -31.19 -88.89"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
			></path>
		</g>
	</g>
	<g stroke-linecap="round">
		<g
			transform="translate(715.8418060469737 387.60806064238193) rotate(0 40.05589829701012 -32.10558569600403)"
		>
			<path
				d="M0.88 -0.73 C14.28 -11.67, 67 -54.15, 80.22 -64.8"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
				stroke-dasharray="8 9"
			></path>
		</g>
		<g
			transform="translate(715.8418060469737 387.60806064238193) rotate(0 40.05589829701012 -32.10558569600403)"
		>
			<path
				d="M67.29 -43.4 C69.6 -49.4, 73.51 -55.49, 80.22 -64.8"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(715.8418060469737 387.60806064238193) rotate(0 40.05589829701012 -32.10558569600403)"
		>
			<path
				d="M56.56 -56.71 C62.01 -59.01, 68.97 -61.32, 80.22 -64.8"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
			></path>
		</g>
	</g>
	<g stroke-linecap="round">
		<g
			transform="translate(674.3839689963415 392.11410775761055) rotate(0 -30.71061509117186 -34.35860925361834)"
		>
			<path
				d="M-0.78 0.11 C-10.86 -11.46, -51.02 -57.89, -61.1 -69.22 M1 -0.88 C-9.15 -12.3, -51.39 -56.46, -61.88 -67.95"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(674.3839689963415 392.11410775761055) rotate(0 -30.71061509117186 -34.35860925361834)"
		>
			<path
				d="M-39.58 -56.65 C-44.91 -59.04, -51.43 -62.06, -61.88 -67.95 M-39.58 -56.65 C-47.91 -61.71, -55.76 -64.17, -61.88 -67.95"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(674.3839689963415 392.11410775761055) rotate(0 -30.71061509117186 -34.35860925361834)"
		>
			<path
				d="M-52.06 -44.96 C-54.33 -50.15, -57.78 -56.05, -61.88 -67.95 M-52.06 -44.96 C-55.78 -54.32, -59.05 -61.06, -61.88 -67.95"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
	</g>
	<g stroke-linecap="round">
		<g
			transform="translate(1094.6380680879502 394.36713131522504) rotate(0 -206.23107755323974 -44.26883709803681)"
		>
			<path
				d="M-1.14 0.49 C-70.11 -14.05, -344.27 -73.01, -412.94 -87.76 M0.46 -0.3 C-68.79 -15.13, -345.62 -74.5, -414.14 -89.47"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(1094.6380680879502 394.36713131522504) rotate(0 -206.23107755323974 -44.26883709803681)"
		>
			<path
				d="M-389.37 -92.87 C-397.82 -92.63, -406.58 -91.78, -414.14 -89.47 M-389.37 -92.87 C-397.5 -92.47, -406.1 -91.23, -414.14 -89.47"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(1094.6380680879502 394.36713131522504) rotate(0 -206.23107755323974 -44.26883709803681)"
		>
			<path
				d="M-392.99 -76.15 C-400.01 -82.12, -407.42 -87.5, -414.14 -89.47 M-392.99 -76.15 C-399.84 -81.46, -407.2 -85.93, -414.14 -89.47"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
	</g>
	<g stroke-linecap="round">
		<g
			transform="translate(534.3978307969264 555.5033558785891) rotate(0 -7.740545084320502 -47.49443052576561)"
		>
			<path
				d="M-0.75 0.83 C-3.21 -15.2, -12.14 -79.25, -14.68 -95.37 M1.05 0.22 C-1.5 -15.71, -12.19 -78.16, -15.21 -94.04"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(534.3978307969264 555.5033558785891) rotate(0 -7.740545084320502 -47.49443052576561)"
		>
			<path
				d="M-2.65 -72.42 C-5.22 -77.73, -11.06 -86.54, -15.21 -94.04 M-2.65 -72.42 C-6.1 -77.08, -8.52 -82.58, -15.21 -94.04"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(534.3978307969264 555.5033558785891) rotate(0 -7.740545084320502 -47.49443052576561)"
		>
			<path
				d="M-19.49 -69.4 C-16.97 -75.53, -17.7 -85.25, -15.21 -94.04 M-19.49 -69.4 C-19.15 -74.75, -17.8 -80.93, -15.21 -94.04"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
	</g>
	<g stroke-linecap="round">
		<g
			transform="translate(476.67948993799644 579.2199923376792) rotate(0 17.772492919873514 0.8387151269243418)"
		>
			<path
				d="M0.33 -0.2 C6.13 0.15, 29.36 1.84, 35.22 2.22 M-0.16 -0.79 C5.78 -0.58, 30.4 1.2, 36.29 1.54"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(476.67948993799644 579.2199923376792) rotate(0 17.772492919873514 0.8387151269243418)"
		>
			<path
				d="M19.21 6.52 C25.27 4.08, 32.89 2.68, 36.29 1.54 M19.21 6.52 C25.54 4.52, 31.98 2.78, 36.29 1.54"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(476.67948993799644 579.2199923376792) rotate(0 17.772492919873514 0.8387151269243418)"
		>
			<path
				d="M20 -5.63 C25.78 -3.51, 33.1 -0.36, 36.29 1.54 M20 -5.63 C26.1 -3.07, 32.23 -0.25, 36.29 1.54"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
	</g>
	<g stroke-linecap="round">
		<g
			transform="translate(854.7129615927165 545.7959926596491) rotate(0 -51.4900944458891 -43.55163929994046)"
		>
			<path
				d="M-0.82 -0.23 C-18.03 -14.82, -85.86 -72.86, -102.81 -87.26 M0.96 -1.39 C-16.44 -15.82, -86.33 -71.25, -103.67 -85.8"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(854.7129615927165 545.7959926596491) rotate(0 -51.4900944458891 -43.55163929994046)"
		>
			<path
				d="M-80.05 -77.61 C-88.47 -80.28, -96.37 -82.62, -103.67 -85.8 M-80.05 -77.61 C-88.62 -79.87, -95.99 -83.52, -103.67 -85.8"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(854.7129615927165 545.7959926596491) rotate(0 -51.4900944458891 -43.55163929994046)"
		>
			<path
				d="M-90.84 -64.35 C-95.63 -71.44, -99.86 -78.28, -103.67 -85.8 M-90.84 -64.35 C-95.66 -71.16, -99.35 -79.34, -103.67 -85.8"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
	</g>
	<g stroke-linecap="round">
		<g
			transform="translate(911.8183179935272 393.5046457345758) rotate(0 -28.493436581657647 -34.35860925361834)"
		>
			<path
				d="M0.73 0.82 C-8.7 -10.52, -46.98 -57.02, -56.63 -68.7 M-0.35 0.21 C-9.91 -10.88, -47.77 -55.74, -57.38 -67.15"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(911.8183179935272 393.5046457345758) rotate(0 -28.493436581657647 -34.35860925361834)"
		>
			<path
				d="M-35.7 -54.71 C-40.71 -57.68, -48.5 -62.28, -57.38 -67.15 M-35.7 -54.71 C-40.88 -58.59, -46.04 -60.32, -57.38 -67.15"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(911.8183179935272 393.5046457345758) rotate(0 -28.493436581657647 -34.35860925361834)"
		>
			<path
				d="M-48.77 -43.68 C-49.84 -50.01, -53.74 -57.89, -57.38 -67.15 M-48.77 -43.68 C-50.53 -50.32, -52.37 -54.85, -57.38 -67.15"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
	</g>
	<g stroke-linecap="round">
		<g
			transform="translate(475.4016220079843 579.4370004468918) rotate(0 213.62998111395257 -57.4810563237325)"
		>
			<path
				d="M0.79 0.46 C71.8 -18.6, 356.2 -95.23, 427.13 -114.59"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
				stroke-dasharray="8 9"
			></path>
		</g>
		<g
			transform="translate(475.4016220079843 579.4370004468918) rotate(0 213.62998111395257 -57.4810563237325)"
		>
			<path
				d="M406.69 -100.19 C415.45 -106.15, 423.27 -113.01, 427.13 -114.59"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(475.4016220079843 579.4370004468918) rotate(0 213.62998111395257 -57.4810563237325)"
		>
			<path
				d="M402.22 -116.7 C412.69 -116.26, 422.25 -116.68, 427.13 -114.59"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
			></path>
		</g>
	</g>
	<g stroke-linecap="round">
		<g
			transform="translate(1026.0783720320946 552.704678178115) rotate(0 -31.08347555478383 -44.6781510787477)"
		>
			<path
				d="M-0.96 0.91 C-11.36 -13.94, -52.34 -74.55, -62.34 -89.67"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
				stroke-dasharray="8 9"
			></path>
		</g>
		<g
			transform="translate(1026.0783720320946 552.704678178115) rotate(0 -31.08347555478383 -44.6781510787477)"
		>
			<path
				d="M-42.16 -74.92 C-46.67 -79.83, -54.82 -82.03, -62.34 -89.67"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(1026.0783720320946 552.704678178115) rotate(0 -31.08347555478383 -44.6781510787477)"
		>
			<path
				d="M-56.36 -65.4 C-56.54 -73.08, -60.39 -78.15, -62.34 -89.67"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
			></path>
		</g>
	</g>
	<g stroke-linecap="round">
		<g
			transform="translate(1380.0112769498407 394.63115751338296) rotate(0 -116.1433848148838 -46.186982931093524)"
		>
			<path
				d="M-0.32 0.84 C-39.03 -14.29, -194 -76.2, -232.8 -91.87 M1.71 0.23 C-37.16 -15.15, -195.28 -78.3, -234.02 -93.73"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(1380.0112769498407 394.63115751338296) rotate(0 -116.1433848148838 -46.186982931093524)"
		>
			<path
				d="M-209.03 -92.97 C-213.98 -94.09, -220.9 -94.9, -234.02 -93.73 M-209.03 -92.97 C-215.41 -92.73, -220.89 -92.72, -234.02 -93.73"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(1380.0112769498407 394.63115751338296) rotate(0 -116.1433848148838 -46.186982931093524)"
		>
			<path
				d="M-215.37 -77.08 C-218.56 -82.23, -223.86 -87.07, -234.02 -93.73 M-215.37 -77.08 C-220.13 -80.52, -224.16 -84.18, -234.02 -93.73"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
	</g>
	<g stroke-linecap="round">
		<g
			transform="translate(1232.8640885356508 547.0721192840792) rotate(0 -40.754110460921765 -42.42512752113339)"
		>
			<path
				d="M0.41 0.9 C-13.26 -12.95, -68.79 -69.36, -82.42 -83.71 M-0.83 0.33 C-14.1 -13.77, -66.66 -71.17, -80.18 -85.24"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(1232.8640885356508 547.0721192840792) rotate(0 -40.754110460921765 -42.42512752113339)"
		>
			<path
				d="M-57.89 -73.92 C-62.33 -78.4, -67.93 -79.62, -80.18 -85.24 M-57.89 -73.92 C-63.77 -76.66, -70.91 -79.65, -80.18 -85.24"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(1232.8640885356508 547.0721192840792) rotate(0 -40.754110460921765 -42.42512752113339)"
		>
			<path
				d="M-70.38 -62.24 C-71.4 -69.91, -73.64 -74.26, -80.18 -85.24 M-70.38 -62.24 C-72.95 -68.23, -76.7 -74.39, -80.18 -85.24"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
	</g>
	<g stroke-linecap="round">
		<g
			transform="translate(1394.7110677529254 556.9343631492571) rotate(0 -97.2377099474661 -47.91950534312588)"
		>
			<path
				d="M1.19 0.18 C-31.24 -15.62, -162.41 -79.34, -195.01 -95.26 M0.36 -0.77 C-32.25 -16.89, -163.66 -80.97, -196.25 -97.08"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(1394.7110677529254 556.9343631492571) rotate(0 -97.2377099474661 -47.91950534312588)"
		>
			<path
				d="M-171.39 -94.41 C-177.71 -95.77, -183.68 -95.52, -196.25 -97.08 M-171.39 -94.41 C-179.92 -95.23, -188.78 -95.33, -196.25 -97.08"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(1394.7110677529254 556.9343631492571) rotate(0 -97.2377099474661 -47.91950534312588)"
		>
			<path
				d="M-178.92 -79.05 C-183.18 -84.59, -187.13 -88.44, -196.25 -97.08 M-178.92 -79.05 C-184.73 -85.19, -191.02 -90.55, -196.25 -97.08"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
	</g>
	<g stroke-linecap="round">
		<g
			transform="translate(1476.7751107365848 551.5781663993077) rotate(0 -169.59460471288799 -121.28095203763445)"
		>
			<path
				d="M0.16 0.03 C-56.44 -40.62, -282.73 -202.61, -339.33 -242.95"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
				stroke-dasharray="8 9"
			></path>
		</g>
		<g
			transform="translate(1476.7751107365848 551.5781663993077) rotate(0 -169.59460471288799 -121.28095203763445)"
		>
			<path
				d="M-315.25 -236.25 C-323.02 -238.62, -331.49 -240.96, -339.33 -242.95"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(1476.7751107365848 551.5781663993077) rotate(0 -169.59460471288799 -121.28095203763445)"
		>
			<path
				d="M-325.19 -222.33 C-329.87 -229.21, -335.13 -236.04, -339.33 -242.95"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
			></path>
		</g>
	</g>
	<g stroke-linecap="round">
		<g
			transform="translate(1461.8274109847393 675.4944620680955) rotate(0 -1.9711571319872974 -26.215825664461704)"
		>
			<path
				d="M-0.31 -0.26 C-0.91 -9.19, -3.58 -43.84, -4.02 -52.56 M1.72 -1.43 C1 -9.66, -4.18 -42.77, -5 -51.08"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(1461.8274109847393 675.4944620680955) rotate(0 -1.9711571319872974 -26.215825664461704)"
		>
			<path
				d="M6.52 -28.9 C2.87 -34.88, 0.06 -38.93, -5 -51.08 M6.52 -28.9 C3.39 -35.54, 0.35 -42.43, -5 -51.08"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(1461.8274109847393 675.4944620680955) rotate(0 -1.9711571319872974 -26.215825664461704)"
		>
			<path
				d="M-10.44 -26.68 C-9.65 -33.2, -8 -37.84, -5 -51.08 M-10.44 -26.68 C-8.64 -34.1, -6.75 -41.63, -5 -51.08"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
	</g>
	<g stroke-linecap="round">
		<g
			transform="translate(51.50203476190018 55.95814783439377) rotate(0 42.24419170526846 -1.6897676682107488)"
		>
			<path
				d="M-0.68 -0.39 C13.71 -0.88, 71.28 -2.64, 85.64 -3.31 M1.17 -1.64 C15.56 -1.89, 71.29 -1.4, 85.3 -1.74"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(51.50203476190018 55.95814783439377) rotate(0 42.24419170526846 -1.6897676682107488)"
		>
			<path
				d="M61.86 6.95 C66.94 6.89, 73.41 4.48, 85.3 -1.74 M61.86 6.95 C66.48 4.95, 72.23 3.72, 85.3 -1.74"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(51.50203476190018 55.95814783439377) rotate(0 42.24419170526846 -1.6897676682107488)"
		>
			<path
				d="M61.76 -10.15 C66.81 -6.05, 73.31 -4.29, 85.3 -1.74 M61.76 -10.15 C66.54 -8.54, 72.31 -6.16, 85.3 -1.74"
				stroke="currentColor"
				stroke-width="1"
				fill="none"
			></path>
		</g>
	</g>
	<g stroke-linecap="round">
		<g
			transform="translate(55.995987646671495 92.98233629530833) rotate(0 42.24419170526846 -1.6897676682107488)"
		>
			<path
				d="M-0.36 0.23 C13.42 -0.22, 69.21 -2.19, 83.44 -2.62"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
				stroke-dasharray="8 9"
			></path>
		</g>
		<g
			transform="translate(55.995987646671495 92.98233629530833) rotate(0 42.24419170526846 -1.6897676682107488)"
		>
			<path
				d="M60.24 6.7 C68.96 1.67, 78.17 0.96, 83.44 -2.62"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
			></path>
		</g>
		<g
			transform="translate(55.995987646671495 92.98233629530833) rotate(0 42.24419170526846 -1.6897676682107488)"
		>
			<path
				d="M59.67 -10.39 C68.6 -9.28, 78.02 -3.85, 83.44 -2.62"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
			></path>
		</g>
	</g>
	<g
		transform="translate(158.52065374858034 40.186982931093524) rotate(0 40.554424037057686 12.5)"
	>
		<text
			x="0"
			y="17.619999999999997"
			font-family="Excalifont, Xiaolai, Segoe UI Emoji"
			font-size="20px"
			text-anchor="start"
			style="white-space: pre"
			direction="ltr"
			dominant-baseline="alphabetic"
			fill="currentColor"
		>
			extends
		</text>
	</g>
	<g
		transform="translate(1177.8752075597947 52.44000648870784) rotate(0 70.97024206485094 12.5)"
	>
		<text
			x="0"
			y="17.619999999999997"
			font-family="Excalifont, Xiaolai, Segoe UI Emoji"
			font-size="20px"
			text-anchor="start"
			fill="currentColor"
			style="white-space: pre"
			direction="ltr"
			dominant-baseline="alphabetic"
		>
			abstract class
		</text>
	</g>
	<g
		transform="translate(1178.8631133293375 10.620464663578502) rotate(0 70.97024206485105 12.5)"
	>
		<text
			x="0"
			y="17.619999999999997"
			font-family="Excalifont, Xiaolai, Segoe UI Emoji"
			fill="currentColor"
			font-size="20px"
			text-anchor="start"
			style="white-space: pre"
			direction="ltr"
			dominant-baseline="alphabetic"
		>
			interface
		</text>
	</g>
	<g
		transform="translate(1177.5979955412658 93.84373028604384) rotate(0 70.97024206485105 12.5)"
	>
		<text
			x="0"
			y="17.619999999999997"
			font-family="Excalifont, Xiaolai, Segoe UI Emoji"
			font-size="20px"
			fill="currentColor"
			text-anchor="start"
			style="white-space: pre"
			direction="ltr"
			dominant-baseline="alphabetic"
		>
			class
		</text>
	</g>
	<g
		transform="translate(157.52065374858034 75.18698293109352) rotate(0 50.69303004632212 12.5)"
	>
		<text
			x="0"
			y="17.619999999999997"
			font-family="Excalifont, Xiaolai, Segoe UI Emoji"
			font-size="20px"
			fill="currentColor"
			text-anchor="start"
			style="white-space: pre"
			direction="ltr"
			dominant-baseline="alphabetic"
		>
			implements
		</text>
	</g>
	<g
		stroke-linecap="round"
		transform="translate(1140.9654366472307 51.819541825129335) rotate(0 13.518141345685876 13.518141345685919)"
	>
		<path
			d="M6.76 0 C9.92 0.95, 18.78 2.34, 20.28 0 C24.43 0.82, 30.52 5.6, 27.04 6.76 C27.28 11.94, 26.05 15.02, 27.04 20.28 C28.54 27.5, 28.01 25.19, 20.28 27.04 C15.81 25.15, 10.84 27.75, 6.76 27.04 C0.06 23.91, -2.62 24.15, 0 20.28 C0.71 19.22, 1.92 15.1, 0 6.76 C2.11 0.6, 3.75 -1.89, 6.76 0"
			stroke="none"
			stroke-width="0"
			fill="#ffc9c9"
		></path>
		<path
			d="M6.76 0 C8.95 -0.15, 11.83 1.16, 20.28 0 M6.76 0 C12.05 -0.48, 15.79 -0.55, 20.28 0 M20.28 0 C23.61 0.49, 26.11 0.28, 27.04 6.76 M20.28 0 C24.96 -2.19, 25.66 4.38, 27.04 6.76 M27.04 6.76 C28.13 11.93, 26.34 14.72, 27.04 20.28 M27.04 6.76 C26.68 10.73, 26.7 15.37, 27.04 20.28 M27.04 20.28 C28.04 26.66, 26.31 27.18, 20.28 27.04 M27.04 20.28 C27.04 23.43, 24.77 29.19, 20.28 27.04 M20.28 27.04 C16.89 27.4, 13.03 26.73, 6.76 27.04 M20.28 27.04 C15.51 26.89, 11.68 26.99, 6.76 27.04 M6.76 27.04 C4.02 25.39, -1.32 23.82, 0 20.28 M6.76 27.04 C0.75 25.34, -0.46 23.79, 0 20.28 M0 20.28 C-0.93 16.21, 1.17 13.27, 0 6.76 M0 20.28 C0.06 15.83, -0.2 10.92, 0 6.76 M0 6.76 C-1.47 2.76, 1.45 0.87, 6.76 0 M0 6.76 C-0.07 2.41, 0.21 0.63, 6.76 0"
			stroke="currentColor"
			stroke-width="1"
			fill="none"
		></path>
	</g>
	<g
		stroke-linecap="round"
		transform="translate(1141.9533424167735 10) rotate(0 13.518141345685876 13.518141345685919)"
	>
		<path
			d="M6.76 0 C10.95 -2.08, 17.66 -1.32, 20.28 0 C23.75 1, 23.66 1.3, 27.04 6.76 C27.28 9.92, 27.34 15.35, 27.04 20.28 C30.3 24.95, 22.78 26.96, 20.28 27.04 C16.26 26.74, 8.51 26.73, 6.76 27.04 C4.74 25.66, 1.7 25.06, 0 20.28 C1.22 15.34, 2.16 8.66, 0 6.76 C2.62 -1.03, 0.88 0.73, 6.76 0"
			stroke="none"
			stroke-width="0"
			fill="#a5d8ff"
		></path>
		<path
			d="M6.76 0 C12.4 0.16, 15.49 -1.18, 20.28 0 M6.76 0 C11.97 -0.49, 17.07 -0.08, 20.28 0 M20.28 0 C23.97 1.7, 28.1 0.63, 27.04 6.76 M20.28 0 C23.73 -1.36, 28.26 3.99, 27.04 6.76 M27.04 6.76 C27.55 11.47, 26.96 17.01, 27.04 20.28 M27.04 6.76 C27.04 11.69, 27 14.98, 27.04 20.28 M27.04 20.28 C28.36 23.57, 24.13 26.75, 20.28 27.04 M27.04 20.28 C26.16 23.8, 25.01 25.68, 20.28 27.04 M20.28 27.04 C16.48 27.46, 11.22 26.32, 6.76 27.04 M20.28 27.04 C16.15 27.74, 11.77 27.69, 6.76 27.04 M6.76 27.04 C1.08 28.31, 0.71 24.46, 0 20.28 M6.76 27.04 C0.44 25.5, -0.07 25.63, 0 20.28 M0 20.28 C-1.18 18.37, 0.78 14.23, 0 6.76 M0 20.28 C0.21 16.6, 0.05 11.9, 0 6.76 M0 6.76 C1.2 1.62, 0.27 0.98, 6.76 0 M0 6.76 C-1.61 1.98, 1.33 -1.62, 6.76 0"
			stroke="currentColor"
			stroke-width="1"
			fill="none"
		></path>
	</g>
	<g
		stroke-linecap="round"
		transform="translate(1140.6882246287018 93.22326562246533) rotate(0 13.518141345685876 13.518141345685919)"
	>
		<path
			d="M6.76 0 C9.54 0.97, 12.54 -0.25, 20.28 0 C27.65 -3.01, 26.69 3.12, 27.04 6.76 C28.45 11.3, 27.92 17, 27.04 20.28 C23.7 24.99, 21.69 26.22, 20.28 27.04 C15.7 29.42, 11.91 25.61, 6.76 27.04 C1.4 27.71, -0.57 27.38, 0 20.28 C-0.93 16.26, -1 12.65, 0 6.76 C1.5 -0.67, 3.32 0.23, 6.76 0"
			stroke="none"
			stroke-width="0"
			fill="#b2f2bb"
		></path>
		<path
			d="M6.76 0 C11.36 -0.81, 16.5 -0.4, 20.28 0 M6.76 0 C11.02 -0.61, 15.62 0.69, 20.28 0 M20.28 0 C24.48 -1.53, 25.91 3.8, 27.04 6.76 M20.28 0 C26.06 1.32, 24.85 1.83, 27.04 6.76 M27.04 6.76 C26.17 9.66, 28.35 14.49, 27.04 20.28 M27.04 6.76 C26.43 10.93, 26.48 14.54, 27.04 20.28 M27.04 20.28 C27.53 25.17, 24.07 25.46, 20.28 27.04 M27.04 20.28 C25.78 24.34, 26.07 29.15, 20.28 27.04 M20.28 27.04 C16.15 26.54, 11.52 28.23, 6.76 27.04 M20.28 27.04 C15.26 27, 10.38 26.72, 6.76 27.04 M6.76 27.04 C2.79 28.81, 0.93 26.49, 0 20.28 M6.76 27.04 C1.92 27.23, 0.12 22.64, 0 20.28 M0 20.28 C1.04 16.3, -0.16 13.32, 0 6.76 M0 20.28 C-0.67 15, 0.44 10.32, 0 6.76 M0 6.76 C0.16 2.88, 2.92 -0.28, 6.76 0 M0 6.76 C0.79 0.72, 0.38 -1.02, 6.76 0"
			stroke="currentColor"
			stroke-width="1"
			fill="none"
		></path>
	</g>
</svg>

- `Iterable` interface represents an object that can be used in a `forEach`
  statement.
- `Collection` interface adds common functionliaty such as add, remove to
  `Iterable` interface. Provides a common interface for all the implementations
  of different data structures.
- `List`, `Queue`, `Set` interfaces extends `Collection` to specific data
  structures
- [ArrayList](/program-construction/arraylist/) is a dynamic array
  implementation
- `PriorityQueue` is an implementation of `Queue`
- `HashSet` is an implementation of `Set`
- `Map` is a similar interface to `Collection`. Allows access to items by
  reference to contents that are used as a key
- `HashMap` is an implementation of Map

All these interfaces and classes are implemented around generics. Generics allow
them to be created with compile-time types.

### Pre-Collection

Originally, JDK provided the ability to group objects through:

- `Array` which is a native language feature
- `Vector` which can grow in size but not shrink
- `Hashtable` which is an array with 2 parts: a hashcode and the actual data.
  Hashcode is generated from the content of the data. Data is accessed using the
  hashcode.

But they didn't have a common interface.
