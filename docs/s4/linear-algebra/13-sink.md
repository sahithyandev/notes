---
title: Sink
sidebar:
  order: 13
slug: s4/linear-algebra/sink
prev: true
next: false
dateCreated: 2026-04-23T17:39:39.627Z
lastUpdatedOn: 2026-04-23T17:39:39.627Z
---

# **7. Rank, Row Space, Column Space**

## 7.1 Reduced Row Echelon Form

Row-rank = column-rank = rank of matrix.

# **8. Eigenvalues and Eigenvectors**

## 8.1 Introduction

Important for solving differential equations and diagonalization.

## 8.2 Definition

$T(v)=\lambda v, v\ne0$.
Eigenvalues satisfy $\det(A-\lambda I)=0$.

## 8.3 Multiplicities

- Algebraic: power of $(x-\lambda)$ in characteristic polynomial
- Geometric: $\dim\ker(A-\lambda I)$
- Minimal multiplicity: exponent in minimal polynomial
  and
  [
  a_\lambda - g_\lambda \ge m_\lambda - 1.
  ]

## 8.4 Diagonalization

A matrix is diagonalizable iff
[
a_\lambda = g_\lambda\ \text{for all }\lambda.
]

# **9. Hermitian Matrices**

## 9.1 Hermitian

$A^H=A$.

### Properties

- Eigenvalues are real
- Eigenvectors of distinct eigenvalues are orthogonal
- There exists an orthonormal eigenbasis (spectral theorem) .

---

# **10. Jordan Form**

## 10.1 Introduction

Generalizes diagonalization when matrix is not diagonalizable.

## 10.2 Jordan Block

Block with λ on diagonal and 1s on the super-diagonal.

Every matrix has a Jordan decomposition:
[
A = PJP^{-1}.
]

---

# **11. SVD — Singular Value Decomposition**

## 11.1 Introduction

Factorization that works for all matrices.

## 11.2 Definition

[
A = V \Sigma U^H
]
where

- $U$, $V$ are unitary
- $\Sigma$ has singular values on diagonal.

Singular values are square roots of eigenvalues of $A^HA$ (or $AA^H$).

---

# **12. QR Decomposition**

## 12.1 Introduction

Used for solving systems and iterative eigenvalue algorithms.

## 12.2 Definition

[
A = QR
]

- $Q$ orthonormal (via Gram–Schmidt)
- $R$ upper triangular.
