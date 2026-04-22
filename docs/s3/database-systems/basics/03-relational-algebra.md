---
title: Relational Algebra
sidebar:
  order: 3
slug: s3/database-systems/basics/relational-algebra
prev: true
next: true
dateCreated: 2026-04-22T07:09:10.694Z
lastUpdatedOn: 2026-04-22T07:15:36.795Z
---

## Attribute

An atomic value.

## Domain

Allowed values for a given attribute. `null` is a special value which is an element of all domains.

## Relation Schema

A set of attributes. Denoted as $R(A_1, A_2, \ldots, A_n)$. $ $

## Relation

Given a set of relation schemas $D_1, D_2, \ldots, D_n$, a relation is a subset of $D_1 \times D_2 \times \ldots \times D_n$.

```math
r \subseteq D_1 \times D_2 \times \ldots \times D_n
```

A set of n-tuples.

## Tuple

Represents a record. Element of a relation.

```math
t = (a_1, a_2, \ldots, a_n)\;\text{where} a_i \in D_i
```

## Relation Instance
Current values of a relation. Represented by a table.

## Keys

Let $K \subseteq R$. $ $

### Superkey

$K$ is a superkey **iff** values for $K$ are sufficient to identify a unique tuple of each possible relation $r(R)$.

$K$ is a superkey **iff**:

```math
\forall t_1, t_2 \in r, t_1[K] = t_2[K] \implies t_1 = t_2
```

No two different tuples have the same values for attributes in $K$.

### Candidate Key

A minimal superkey. $K$ is a candidate key **iff**:
- $K\,\text{is a superkey}$ <b>AND</b> 
- $\nexists\, K' \subset K, K'\,\text{is a superkey}$

### Primary Key

A superkey that is chosen as the main identifier of tuples in $R$. Depends on the attributes.

### Foreign Key

Value in one relation must appear in another.

## Relational Algebra

A theoritical procedural query language. Defines a set of operations that take one or more relations as input and produce a new relation as output.

### Selection

Extracts tuples (rows) satisfying a specified condition. Denoted by $σ$. $ $

```math
σ_{\text{condition(s)}}(R)
```

### Projection

Extracts specific attributes (columns) from a relation. Denoted by $π$.

```math
π_{\text{attribute list}}(R)
````

Duplicates are removed by default, as it is a set. Useful for narrowing down the output to required columns.

### Union

Combines tuples from two relations. Denoted by $\cup$.

```math
R \cup S
```

Result includes all tuples that appear in either or both relations. Both relations must be union-compatible.

#### Union Compatible

2 relations are union-compatible **iff** both have the equal number of attributes and associated attributes have equivalent domains.

### Set Difference

Finds tuples that appear in one relation but not in another. Denoted by $-$.

```math
R − S
```

Requires union compatibility. Used to find “exclusive” records.

### Cartesian Product

Combines every tuple of one relation with every tuple of another. Denoted by $\times$.

```math
R \times S
```

If $R$ has $m$ tuples and $S$ has $n$ tuples, result has $m × n$ tuples. Attributes of both relations are concatenated.

### Rename

Assigns new names to relations or attributes. Denoted by $\rho$.

```math
\rho_{\text{newName(attribute-list)}}(R)
```

Used to avoid ambiguity, especially in self-joins or nested queries.

### Natural Join

Combines tuples from two relations based on matching attribute names and matching values. Denoted by $⋈$.

```math
R ⋈_{\text{condition}} S
```

### Division

Finds tuples in one relation associated with all tuples in another. Denoted by $\div$.

```math
R \div S
```

Typically, $R$ has attributes $(A, B)$ and $S$ has attributes $(B)$. Result contains those $A$ values that appear with every $B$ value in $S$.
