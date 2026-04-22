---
title: Lock
sidebar:
  order: 17
slug: s3/operating-systems/lock
prev: true
next: true
dateCreated: 2026-04-22T07:09:10.707Z
lastUpdatedOn: 2026-04-22T07:15:36.801Z
---

Any software-level mechanism that provide mutual exclusion using special atomic hardware instructions. May spin (busy-wait) or block.

Has 2 atomic operations:

- `acquire()`
- `release()`

### Spinlock

A lock that busy-waits (spin) on the CPU until the lock becomes free. Never sleeps. Low overhead. Suitable for multiprocessor systems. Wastes CPU cycles.

Used when expected wait time is small.

Can be implemented using either `test_and_set` or `compare_and_swap`.

Implemented using `test_and_set`:

```c
bool lock = false;  // free

void acquire() {
    while (test_and_set(&lock) == true) {
        // spin (busy-wait)
    }
}

void release() {
    lock = false;
}
```

Implementation using `compare_and_swap`:

```c
int lock = 0;  // 0 = free, 1 = busy

void acquire() {
    while (!compare_and_swap(&lock, 0, 1)) {
        // spin while someone else holds it
    }
}

void release() {
    lock = 0;
}
```

If `lock` was false (free), it becomes `true` and the process enters. If it was true, the process keeps spinning until available.

### Mutex Lock

A lock that puts the thread to sleep when its unavailable. OS blocks the thread, context-switches it out, and wakes it later. Zero CPU waste. Higher overhead because sleeping/waking involves kernel scheduling.

The `mutex_lock()` function can be implemented as follows:

```sh
void mutex_lock(mutex_t *m) {
    while (!compare_and_swap(&m->state, 0, 1)) {
        // busy wait
    }
}

void mutex_unlock(mutex_t *m) {
    m->state = 0;
}
```

A mechanism that ensures only one thread enters a critical section at a time.
