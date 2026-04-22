---
title: Dekker's Algorithm
sidebar:
  order: 14
slug: s3/operating-systems/dekkers-algorithm
prev: true
next: true
dateCreated: 2026-04-22T07:09:10.707Z
lastUpdatedOn: 2026-04-22T07:15:36.801Z
---

A solution to the mutual exclusion problem of 2 processes. One of the first algorithms to achieve mutual exclusion using only shared memory and without relying on special atomic instructions. Uses busy waiting.

Only works for 2 processes. Wastes CPU cycles. Not suitable for modern multiprocessor systems due to cache coherence and memory consistency issues.

## Algorithm

For process $P_i$ ($i = 0 \text{ or } 1, j = 1 - i$):

```c
while(true) {
    // entry section
    flag[i] = true; // express intent to enter critical section
    //  conflict-resolution section
    while (flag[j]) {
        // if other thread also wants to enter
        if (turn != i) {
            // other thread's turn
            // back off and wait for own turn
            flag[i] = false;
            while (turn != i);
            flag[i] = true;
        }
    }
    
    // critical section
     
    // exit section
    turn = j; // give turn to other
    flag[i] = false; // no longer interested
}
```
