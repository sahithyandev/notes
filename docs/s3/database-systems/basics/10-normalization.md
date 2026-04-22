---
title: Normalization
sidebar:
  order: 10
slug: s3/database-systems/basics/normalization
prev: true
next: true
dateCreated: 2026-04-22T07:09:10.695Z
lastUpdatedOn: 2026-04-22T07:15:36.795Z
---

A systematic approach to decide whether a particular relation is in good form. Helps ensure correctness and maintainability. But might degrade query performance. 

Normalization theory was introduced by Edgar F. Codd, the father of relational databases, in 1970.

### "Good" Form?

A relation is in _good_ form when it has these properties: 
- easier to understand and to extend
- clear keys that uniquely identify tuples
- appropriate atomic domains for attributes
- functional dependencies that do not introduce partial or transitive redundancy
- constraints captured by a suitable normal form (1NF, 2NF, 3NF, BCNF, etc.) given the application needs.

A database is in a _good_ form when all of its relations are in _good_ form.

### Normal Forms

Several normal forms are defined, each builds on the previous one and defines a set of rules. Consecutive normal forms ensure the relations are in a better form.

Each normal form defines a set of conditions. If one of the conditions are violated, the relation is said to be violate the normal form.

If a relation violates $n$th normal form, it is violating $i$th normal forms where $i \gt n$.

### Extraneous Attributes

Unnecessary attributes in a functional dependency (FD) that can be removed without affecting the closure. Can either be in LHS or RHS.

Removing extraneous attributes:
- Simplifies functional dependency sets
- Helps compute minimal covers
- Avoids redundant checks during normalization

#### Testing

Consider a set of functional dependencies $F$, and $\alpha \rightarrow \beta \in F$.

The attribute $A \in \alpha$ is extraneous in $\alpha$ **if** $(\alpha - A)^+$ contains $\beta$.

The attribute $A \in \beta$ is extraneous in $\beta$ **if**:
- Compute $\alpha^+$ using only the dependencies in $F' = (F - \set{\alpha - \beta}) \cup (\alpha \rightarrow (\beta - A))$
- Check if $\alpha^+$ contains $A$; if it does, $A$ is extraneous in $\beta$

## Anomalies

A situation where a change in data causes inconsistency or lose information.

### Insertion Anomaly
Occurs when certain data cannot be inserted into a database without the presence of other, unrelated data.

Example:  
Cannot add a new student unless they are enrolled in a course, because student and course details are stored in the same table.

### Update Anomaly
Happens when data redundancy causes inconsistent updates across records.

Example:  
If an instructor's department name changes, it must be updated in multiple rows; missing one row leads to inconsistent data.

### Deletion Anomaly
Occurs when deleting a record unintentionally removes valuable related information.

Example:  
Deleting the last student enrolled in a course also deletes the course information itself.

## 1st Normal Form (1NF)

If all the below conditions are met, the relation is in 1NF:
- Row order is not used to convey information.
- Domain of any attribute contains values of a single type, not multiple types.   
  Not possible in relational DBMS.
- It has a primary key.
- It has no repeating groups.

## 2nd Normal Form (2NF)

If all the below conditions are met, the relation is in 2NF:
- It's in 1NF
- All non-key attributes must depend on the entire primary key.

If not, the relation must be decomposed into smaller relations.

## 3rd Normal Form (3NF)

If all the below conditions are met, the relation is in 3NF:
- It's in 2NF
- All non-key attributes must dependent only on the entire primary key.

Allows key attributes to depend on non-key attributes.

Aims to remove data redundancy.

## Boyce-Codd Normal Form (BCNF)

Slightly stronger than 3NF. Can be thought of as 3.5NF.

If all the below conditions are met, the relation is in BCNF:
- It's in 3NF
- All key attributes must dependent on and only on the entire primary key.

:::note

**If** none of the dependencies in $F$ causes a violation of BCNF, **then** none of the dependencies in $F^+$ will cause a violation of BCNF either.

:::

### Fix for BCNF Violation

Suppose relation $R$ and a non-trivial functional dependency $A \rightarrow B$ cause a violation of BCNF.

$R$ is decomposed into:
- $(A \cup B)$
- $R - (B - A)$

:::note

Usually the goal in a relational database design is:
- BCNF
- Lossless-join decomposition
- Dependency preservation

If that's not achievable, either dependency preservation is left or 3NF is used.

:::

## 4th Normal Form (4NF)

If all the below conditions are met, the relation is in 4NF:
- It's in BCNF
- All multivalued dependencies must be multivalued dependencies on the key.

If not, the relation must be decomposed into smaller relations.

## 5th Normal Form (5NF)

If all the below conditions are met, the relation is in 5NF:
- It's in 4NF
- It cannot be describable as the logical result of joining some other tables together.
