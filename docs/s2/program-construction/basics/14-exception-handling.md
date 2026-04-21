---
title: Exception Handling
sidebar:
  order: 14
slug: program-construction/basics/exception-handling
prev: true
next: true
---

Exception handling in programming helps manage and respond to error conditions
gracefully. Instead of having programs crash when something goes wrong,
exceptions let us detect and handle errors in a controlled way.

Most languages support try-catch blocks for exception handling.

## Error-handling in java

In Java, runtime issues are denoted by objects of the `Throwable` class. The two
main categories of `Throwable` are `Error` and `Exception`.

### Error

Unrecoverable problems that are not meant to be caught.

Examples: `OutOfMemoryError` or `StackOverflowError`.

### Exception

#### Checked Exceptions

Checked at compile time.

Examples: `IOException`, `SQLException`.

#### Unchecked Exceptions

Not checked while compiling.

Examples: `NullPointerException`, `ArrayIndexOutOfBoundsException`.

### Try-catch block

```java
try {
    // Code that might throw an exception
    int result = 10 / 0; // Will throw ArithmeticException
} catch (ArithmeticException e) {
    // runs if there is an arithmetic exception
    System.out.println("Cannot divide by zero!");
} catch (Exception e) {
    // runs if there is any other type of exception
} finally {
    // runs whether an exception occurs or not
    // runs whether the exception is caught or not
}
```

The code that might cause errors is placed inside a `try` block. If an exception
occurs, the code inside the `catch` block is executed. The `catch` block defines
what type of exception to catch and what to do when it occurs. Multiple `catch`
blocks can be defined to handle different type of exceptions. `catch` block has
access to an object of `Exception` class, which defines the error that occurred.

The `finally` block is used for code that should run whether an exception occurs
or not. Finally block has some special behaviours as mentioned in
[this answer on StackOverflow](https://stackoverflow.com/questions/3354823/why-use-finally).

Exceptions can be thrown using `throw` keyword.

```java
public void validateAge(int age) {
    if (age < 0) {
        throw new IllegalArgumentException("Age cannot be negative");
    }
}
```

Custom exceptions are defined by extending the `Exception` class.

```java
public class CustomException extends Exception {
    public CustomException(String message) {
        super(message);
    }
}
```

Methods that might throw exceptions should declare this using the `throws`
keyword:

```java
public void riskyMethod() throws CustomException {
    // Method implementation
    if (someErrorCondition) {
        throw new CustomException("An error occurred");
    }
}
```

### Exception Hierarchy

<svg xmlns="http://www.w3.org/2000/svg" width="900" class="mx-auto" viewBox="0 0 800 400">
  <style>
    .node { fill: currentColor; font-weight: 500; }
    .line { stroke: currentColor; opacity: 0.9; stroke-width: 2; }
  </style>
      <!-- Throwable -->
      <text x="310" y="20" class="node">Throwable</text>
      <!-- Error -->
      <line x1="350" y1="30" x2="150" y2="90" class="line" />
      <text x="130" y="110" class="node">Error</text>
      <!-- VirtualMachineError -->
      <line x1="150" y1="120" x2="50" y2="180" class="line" />
      <text x="0" y="200" class="node">VirtualMachineError</text>
      <!-- OutOfMemoryError -->
      <line x1="50" y1="210" x2="0" y2="270" class="line" />
      <text x="0" y="290" class="node">OutOfMemoryError</text>
      <!-- StackOverflowError -->
      <line x1="50" y1="210" x2="150" y2="230" class="line" />
      <text x="100" y="250" class="node">StackOverflowError</text>
      <!-- AWTError -->
      <line x1="150" y1="120" x2="250" y2="180" class="line" />
      <text x="200" y="200" class="node">AWTError</text>
      <!-- Exception -->
      <line x1="350" y1="30" x2="550" y2="90" class="line" />
      <text x="500" y="110" class="node">Exception</text>
      <!-- RuntimeException -->
      <line x1="550" y1="120" x2="350" y2="180" class="line" />
      <text x="300" y="200" class="node">RuntimeException (Unchecked)</text>
      <!-- NullPointerException -->
      <line x1="350" y1="210" x2="260" y2="270" class="line" />
      <text x="180" y="290" class="node">NullPointerException</text>
      <!-- ArithmeticException -->
      <line x1="350" y1="210" x2="350" y2="305" class="line" />
      <text x="300" y="320" class="node">ArithmeticException</text>
      <!-- IndexOutOfBoundsException -->
      <line x1="350" y1="210" x2="490" y2="270" class="line" />
      <text x="390" y="290" class="node">IndexOutOfBoundsException</text>
      <!-- IOException -->
      <line x1="550" y1="120" x2="720" y2="180" class="line" />
      <text x="620" y="200" class="node">IOException (Checked)</text>
      <!-- FileNotFoundException -->
      <line x1="650" y1="210" x2="640" y2="315" class="line" />
      <text x="550" y="330" class="node">FileNotFoundException</text>
      <!-- EOFException -->
      <line x1="650" y1="210" x2="700" y2="240" class="line" />
      <text x="680" y="260" class="node">EOFException</text>
</svg>
