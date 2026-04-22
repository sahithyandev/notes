---
title: Branch Prediction
sidebar:
  order: 15
slug: s3/computer-architecture/branch-prediction
prev: true
next: true
dateCreated: 2026-04-22T07:09:10.689Z
lastUpdatedOn: 2026-04-22T07:15:36.791Z
---

The process of predicting whether a branch will be taken or not. Reduces control hazards. Better prediction means higher ILP.

### Branch-Target Buffer

Predict next PC. Improves branch prediction by storing target addresses.

## Types

### 2-Bit Predictor

A simple branch predictor that uses a small 2-bit state machine per branch.

Each branch has a 2-bit saturating counter with 4 states:

- Strongly taken
- Weakly taken
- Weakly not-taken
- Strongly not-taken

Prediction is taken if counter is in a “taken” state; otherwise not-taken. Counter moves toward taken/not-taken depending on the actual outcome.

Avoids flipping prediction due to single misprediction. Good for loops.

### Correlating Predictor (m,n)

Uses global branch history to predict the next one. Maintains a history of outcomes of the last $m$ branches. Has $2^m$ number of $n$-bit predictors.

Captures patterns where one branch correlates with previous branches.

### Tournament Predictor

Combines correlating predictor with per-branch predictors. Predictor with the best recent accuracy is chosen.

Adapts dynamically to different program behaviors.

### Tagged Hybrid Predictor

Aka. TAGE. Advanced modern predictor using multiple predictor tables with different history lengths. Each table is indexed using a different history length.

Each entry contains:

- A predicted direction,
- A tag to verify that the entry actually matches this branch,
- A usefulness counter.

Long-history tables capture long-range patterns; short-history tables handle simpler cases.
If multiple tables match:

- Longest matching history table = primary prediction.
- Backup tables used if primary is weak.

High accuracy with controlled storage size using tags + multiple history depths.

## Branch Folding

When a branch is predicted taken, the branch target is fetched early as if the branch wasn't there. Handled by using branch target buffer.

## Integrated Instruction Fetch Unit

One unit does:

- Prediction
- Prefetch
- Fetch-ahead
- Cache line crossing handling

## Alternatives

### Return Address Prediction

Predict return addresses of function calls.

### Value Prediction

Predict values instead of branches. Not widely used. But address alias prediction is used in stores.
