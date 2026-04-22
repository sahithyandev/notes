---
title: Thread
sidebar:
  order: 8
slug: s3/operating-systems/thread
prev: true
next: true
dateCreated: 2026-04-22T07:09:10.706Z
lastUpdatedOn: 2026-04-22T07:15:36.800Z
---

A thread is the basic unit of CPU utilization, consisting of a program counter, a stack, and a set of registers.

Threads are sometimes called lightweight processes. They have some of the properties of processes but are more efficient to create and manage.

Multiple threads inside the same process allow parallel or concurrent execution of tasks.

Threads are created using `clone()` syscall in Linux.

### Single vs Multi-Threaded Processes

A traditional process has a single thread of control. A multi-threaded process has multiple threads of control within the same address space.

### Thread Components

Each thread includes:

- Thread ID
- Program counter
- Register set
- Stack

Threads within the same process share:

- Code section
- Data section
- OS resources such as open files and signals

### Benefits of Multithreading

- Responsiveness  
  Allows applications to remain responsive to user input while performing intensive operations.
- Resource sharing  
  More efficient than IPC.
- Economy  
  Thread management has overhead compared to process management.
- Scalability  
  Multithreaded applications can take advantage of multiprocessor architectures more effectively.

## Types

Threads can be implemented in user space or kernel space.

### User thread

Managed by user-level library; no kernel intervention is required. Kernel doesn't know about these. Fast creation and switching. Entire process blocks if one thread makes a blocking syscall. Mapped to 1 or more kernel thread.

### Kernel thread

Managed by OS kernel. True parallelism on multicore. One blocked thread doesn't affect its siblings. More overhead.

### Lightweight Process

Aka. LWP. A kernel-level thread, sharing the address space with a user-level thread. A process can be mapped to multiple LWPs. Kernel schedules LWPs, while user threads are mapped onto LWPs by a thread library.

Technically, a thread. Naming confusion is because of historical reasons.

## Multithreading Models

Defines how user threads map to kernel threads.

### Many-to-One

Many user threads map to a single kernel thread. No parallelism. Not used in modern systems.

Example: GNU portable threads.

### One-to-One

Each user thread map to a kernel thread. True parallelism. Higher overhead. Number of threads per process may be limited due to overhead.

Used in Linux and Windows.

### Many-to-Many

Many user threads map to many kernel threads. OS decides number of kernel threads. Flexible. Rarely implemented in real-life systems.

### Two-Level Model

Similar to many-tomany, but allows binding specific user threads to specific kernel threads.

## Thread Library

Provide APIs to create/manage threads.

### User-level Library

Manages user-level threads. All thread operations happen in user space. Fast, but a blocking system call can block all threads.

Examples: pthreads.

### Kernel-level Library

Manages kernel-level threads. OS manages threads directly.

Examples: pthreads, windows threads, java threads.
