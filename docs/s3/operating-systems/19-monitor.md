---
title: Monitor
sidebar:
  order: 19
slug: s3/operating-systems/monitor
prev: true
next: true
dateCreated: 2026-04-22T07:09:10.708Z
lastUpdatedOn: 2026-04-22T07:15:36.801Z
---

A monitor is a high-level synchronization construct that provides mutual exclusion and condition-based waiting.

Contains:

- shared variables
- procedures (methods)

Key features of monitors:

- deterministic handover
- priority to awakened threads
- fairness within the monitor
- synchronization enforced automatically  
  issues related to semaphores' operation order wouldn't arise here.

```c
monitor M {
    // shared variables

    procedure A() { ... }

    procedure B() { ... }

    condition x;
}
```

Only one of the above procedures, A and B, can be active at a time.

## Implementation

Using 2 semaphores and a counter.

- `mutex`  
  semaphore. ensures mutual exclusion. initially 1.
- `next`  
  semaphore. handles signaling priority and correct waiting semantics. ensures that a signaled thread is allowed to run before others waiting at the monitor entrance. initially 0.
- `next_count`  
  counter. number of threads waiting on `next`.

```c
typedef struct {
    int count;          // number of threads waiting
    semaphore sem;      // queue for waiting threads
} condition;

// global semaphore
semaphore mutex = 1;    // monitor lock
semaphore next = 0;     // for handoff after signalling
int next_count = 0;     // number of threads waiting on "next"

void wait(condition *x) {
    x->count++;                     // this thread will wait

    // if another thread was signaled earlier inside monitor
    // -> current thread waits
    if (next_count > 0)
        signal(next);               // priority handoff
    else
        signal(mutex);              // free the monitor

    wait(x->sem); // block

    x->count--;                     // awakened, removed from queue
}

void signal(condition *x) {
    if (x->count > 0) {             // someone is waiting
        next_count++;
        signal(x->sem);             // wake that thread
        wait(next);                 // sleep until awakened thread finishes
        next_count--;
    }
}
```

Here is how it is used with a critical section.

```c
// entry section
wait(mutex);

// critical section

// exit section
if (next_count > 0)
    signal(next);
else
    signal(mutex);
```

## Conditional Variable

Allows threads to wait for specific conditions. Has no value. Only a waiting queue. Provides _wait under condition_ without counters. Must be implemented using a semaphore.

Supports 2 operations:

- `wait(x)` - always blocks the caller.
- `signal(x)` - wakes exactly one waiting thread (if any).

Each conditional variable is defined using:

```c
semaphore x_sem; // initially 0
int x_count = 0; // number of threads waiting for it

void wait(x) {
    x_count++;
    if (next_count > 0)
        signal(next);
    else
        signal(mutex);
    wait(x_sem);
    x_count--;
}

void signal(x) {
    if (x_count == 0) {
        // no thread is waiting
        return;
    }
    next_count++; // put current thread to sleep
    signal(x_sem); // wake a thread waiting on x
    wait(next); // step aside so the thread just woke up, runs
    next_count--;
}
```

The above `signal()` implementation ensures:

- awakened thread runs inside monitor
- signaling thread waits outside until awakened thread finishes

## Example

Here `S1` before `S2` using a monitor.

```c
monitor M {
    boolean done = false;
    condition x;

    procedure F1() {
        S1;
        done = true;
        x.signal();
    }

    procedure F2() {
        if (!done)
            x.wait();
        S2;
    }
}
```

## Single Resource Allocation

A single shared resource is allocated to only one process at a time. Processes tell how long they plan to use it.. Shorter planned time means higher priority.

```c
monitor ResourceAllocator {
    int available = 1;          // 1 = free, 0 = in use
    condition busy;             // queue for waiting processes

    // abstract priority queue:
    // stores planned times of all waiting processes
    priority_queue<int> waitTimes;   // smallest t at the front

    void acquire(int t) {
        // case 1: resource free and no one is waiting
        if (available == 1 && waitTimes.empty()) {
            available = 0;      // take the resource immediately
            return;
        }

        // case 2: someone else is using / waiting → join the queue
        waitTimes.insert(t);

        // wait until:
        //  - resource is free
        //  - this process has the smallest t among all waiters
        while (!(available == 1 && t == waitTimes.min())) {
            wait(busy);         // sleep inside monitor
        }

        // now it is this process's turn
        waitTimes.removeMin();  // remove own t from queue
        available = 0;          // get the resource
    }

    void release() {
        available = 1;          // free resource
        signal(busy);           // wake one waiting process
    }
}
```

Usage pattern:

```c
R.acquire(t);       // t = max time this process plans to use the resource
... access resource ...
R.release();
```

- Each process calls `R.acquire(t)` with its planned maximum time `t`.
- If the resource is free and no one is waiting, the process gets it immediately.
- Otherwise:
  - The process is inserted into `waitTimes`.
  - It sleeps on `busy` until:
    - the resource is free and
    - its `t` is the smallest among all waiting processes.
- `release()`:
  - Marks the resource as free.
  - `signal(busy)` wakes one sleeper; woken processes recheck the `while` condition.
