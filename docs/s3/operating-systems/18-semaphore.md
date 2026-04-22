---
title: Semaphore
sidebar:
  order: 18
slug: s3/operating-systems/semaphore
prev: true
next: true
dateCreated: 2026-04-22T07:09:10.707Z
lastUpdatedOn: 2026-04-22T07:15:36.801Z
---

A shared integer variable. Can allow a 1 or certain number of threads to access a resource simultaneously. Name adapted from the railway flags.

Deadlock not possible if properly used. More sophisticated than a lock.

Does not enforce fairness. Improper use can cause deadlock or starvation.

Used in operating systems for process synchronization.

## Operations

Has 2 atomic operations.

### Wait

Aka. P or down. Decreases the integer value. If the value is less than zero, the process waits.

### Signal

Aka. V or up. Increases the integer value. If there are waiting processes, one is allowed to proceed.

## Types

Usually a semaphore can take any non-negative integer value.

### Binary Semaphore

Aka. mutex semaphore. Can be 0 or 1. Similar to a lock. Can be used to implement mutual exclusion.

```c
semaphore mutex = 1

// Thread code
wait(mutex)
// critical section
signal(mutex)
```

### Blocked–Set Semaphore

Aka. Dijkstra semaphore. Holds waiting processes in a set. Not ordered. An arbitrarily chosen process is waked up on `signal()`. Simple. Low CPU usage. Weak fariness. Starvation possible.

Starvation not possible for 2 processes; possible for more than 2 processes.

### Blocked–Queue Semaphore

Holds waiting processes in a ordered FIFO queue. Fair. Low CPU usage. Predictable behavior. Starvation not possible.

Used in kernels.

### Busy-Wait Semaphore

A busy-wait semaphore loops until the semaphore becomes available. High CPU usage. Wastes CPU cycles. Starvation is possible (depends on CPU scheduling).

A typical busy-wait `wait()`:

```c
while (value <= 0) {
    // spinning
}
// once value > 0
value--;
```

Suitable when waiting time is very short (e.g., in kernel spinlocks).

## Implementation

### With Busy-Wait

```c
typedef struct {
    int value;
} semaphore;

void wait(semaphore *s) {
    while (s->value <= 0); // busy-wait (spin)
    s->value--;   // enter critical region
}

void signal(semaphore *s) {
    s->value++;
}
```

### Without Busy-Wait

Implemented using waiting queues (1 per semaphore). Each semaphore has a value and a process queue.

Has 2 operations:

- block: place current thread on waiting queue
- wakeup: remove one process from waiting queue to ready queue

```c
typedef struct {
    int value;
    int queue;   // number of waiting threads (fake wait queue)
} semaphore;

void wait(semaphore *s) {
    disable_interrupts();       // pretend atomic
    if (s->value > 0) {
        s->value--;
        enable_interrupts();
    } else {
        s->queue++;             // thread goes to sleep
        block();
        enable_interrupts();
        // when awakened, resource is guaranteed available
        s->value--;
    }
}

void signal(semaphore *s) {
    disable_interrupts();
    if (s->queue > 0) {
        s->queue--;
        wakeup();
    } else {
        s->value++;
    }
    enable_interrupts();
}
```

Used in kernel code.

## Possible Issues

### Unequal `wait()` and `signal()`

Will cause resource leaks. Might put semaphore into an invalid state. Negative integer value.

If the semaphore goes to a negative value, every other thread that calls `wait()` will block forever causing a deadlock.

### Missing `wait()`

Too many threads can get access.

### Missing `signal()`

Too little threads can get access.

### Reordering wait/signal

Mutual exclusion breaks.

## Related Problems

Here are some classical problems which can be solved using semaphores.

### Dining Philosophers Problem

Several philosophers sit around a table, each alternating between thinking and eating. There is a fork between each pair of philosophers, and each philosopher needs both the left and right fork to eat. The challenge is to design a protocol so that:

- No two neighboring philosophers try to eat at the same time (they can't).
- No philosopher starves.
- Indefinite waiting is prevented.

### Readers-Writers Problem

A resource is shared between readers and writers. Multiple readers can read it simultaneously. Only one writer can write to it at a time. The challenge is to:

- Allow multiple readers to access the resource at the same time.
- Ensure that writers have exclusive access (no readers or other writers) when writing.
- Prevent starvation of either readers or writers.

### Sleeping Barber Problem

There's a barber shop with one barber, a waiting room with a limited number of chairs, and customers who arrive at random times. The challenge is to:

- Ensure the barber sleeps when there are no customers.
- Wake the barber when a customer arrives.
- Customers either wait if there are empty chairs, or leave if the waiting room is full.
- Synchronize access so that the barber serves one customer at a time.
