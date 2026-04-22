---
title: Entity Relationship Model
sidebar:
  order: 4
slug: s3/database-systems/basics/entity-relationship-model
prev: true
next: true
dateCreated: 2026-04-22T07:09:10.694Z
lastUpdatedOn: 2026-04-22T07:15:36.795Z
---

A conceptual model to design a database schema. The model is illustrated using a diagram with a consistent notation.

## Entity

Represents an object or concept that can be uniquely identified. Described by a set of attributes. Illustrated as a rectangle.

## Entity Set

Represents a collection of entities of the same type.

### Strong Entity

An entity set is strong **iff** it has its own primary key.

### Weak Entity

When an entity set is not strong. Depends on another entity set to unique identification. The other entity is called the identifying entity set.

#### Partial key

Aka. discriminator. Unique identifier for a weak entity, given its identifying eneity. Denoted by dashed underlines.

## Attribute

Represents a characteristic or property of an entity. Can be atomic or composite. Can be single valued or multi-valued. Can be static or dynamically computed.

Illustrated as an oval. Connected with the entity using a line.

- Simple attributes - single-lined ovals
- Composite attributes - each component is single-lined ovals and connected to composite one, which is also a single-lined oval
- Multi-valued attributes - double-lined ovals
- Derived attributes - dashed-lined ovals connected to an entity with a dashed line

## Relationship

Represents an association between multiple entities.

## Relationship Set

A mathematical relation among multiple entity sets. Can have 0 or more attributes.

The combination of primary keys of the participating entity sets forms a super key of a relationship set.

### Recursive Relationship

When the same entity participates in a relationship more than once. Two separate lines are used, each labelled with a different _role_, to represent the relationship.

### Strong relationship

A relationship is strong **iff** all participating entity sets are strong. Does not depend on existence of an entity set.

### Weak relationship

When a relationship is not strong. Associates weak entities with their identifying entity sets.

### Identity relationship

A relationship between a strong entity set and a weak entity set. Illustrated as a double diamond.

## Degree

Aka. arity. The number of entity sets that participate in that relationship.

If a relationship set involves $n$ entity sets: $ $

```math
R \subseteq E_1 \times E_2 \times \ldots \times E_n
```

The relationship is named based on its degree.

| Degree | Name    |
| ------ | ------- |
| $1$    | Unary   |
| $2$    | Binary  |
| $3$    | Ternary |
| $n$    | n-ary   |

Binary relationships are frequently encountered in real life. Higher degree relationships can be decomposed into smaller degree relationships.

## Cardinality

Defines the number of entities that can participate in a relationship from each side.

For a binary relationship set $R$ between entity sets $A$ and $B$:

```math
R \subseteq A \times B
```

The cardinality specifies how many entities in $B$ can be associated with one entity in $A$, and vice versa.

In ER diagrams, represented near the entity sets using symbols like $1$, $N$, or $M$. Some notations also use $(min, max)$ pairs to indicate participation limits.

#### One-to-One (1:1)

Each entity in $A$ is related to at most one entity in $B$, and vice versa.

#### One-to-Many (1:N)

Each entity in $A$ can be related to many entities in $B$, but each entity in $B$ is related to only one entity in $A$.

#### Many-to-One (N:1)

Each entity in $A$ relates to only one entity in $B$, but an entity in $B$ can relate to many in $A$.

#### Many-to-Many (M:N)

Entities in both sets can relate to many in the other.

## Participation

### Total Participation

Each entity in an entity set participates in at least one relationship instance. Illustrated as a double-line.

### Partial Participation

Aka. optional participation. An entity may not participate in all relationship instances involving that entity set.

## Reduction to Relation Schema

Strong entity sets are represented as tables with the same attributes.

Weak entity sets are represented as tables with an additional column(s) to store the identifying attribute(s) of the strong entity they depend on.

Composite attributes are flattened out into separate columns.

Multivalued attributes are represented as separate tables with columns for the primary key of the entity set and the value.

Many-to-many relationship sets are represented as a separate table with columns to reference the primary keys of the related entity sets and additional attributes if any.

Many-to-one and one-to-many relationship sets that are total on the many-side can be represented by adding an extra attribute to the _many_ side, containing the primary key of the _one_ side.

## Extended Features

### Specialization

A top-down design approach to model inheritance. The process of dividing a broad entity set into smaller entity sets. Sub entity sets inherit all properties of the parent entity set. Similar to inheritance in OOP.

Constraint on which entities can be members of a given lower-level entity set:
- condition-defined: E.g.: all customers over 65 years are members of senior citizen entity set
- user-defined

Constraint on whether or not entities may belong to more than one lower level entity set.
- Disjoint - can belong to only one lower-level entity set
- Overlapping - can belong to more than one lower level entity set

Completeness constraint: Whether (total) or not (partial) every entity must belong to at least one lower-level entity set.

#### Representation

##### Method 1

Lower-level entity sets include primary key of the higher-level entity set and local attributes.

Drawback is: getting information about an employee requires joining two or more relations.

##### Method 2

Lower-level entity sets include both local and inherited attributes.

Drawback is: redundancy due to attribute duplication.

If the specialization is total, then higher-level entity doesn't have to store any data. The higher-level entity set can be defined as a view as a union of all lower-level entity sets.

### Generalization

A bottom-up design approach to model inheritance. The process of combining multiple specific entities into a more general entity. The super entity set includes all attributes of all sub entity sets. Reduces redundancy by identifying shared attributes.

### Aggregation

Represents a relationship about a relationship set. The relationship set is treated as an entity set. Illustrated as a diamond inside a rectangle.

#### Representation

Entities and the relationships are defined as usual.

For aggregated relationships, a table is defined with:
- Primary key(s) of the aggregated relationship
- Primary key(s) of the associated entity set(s)

The table must ensure  all dependencies are preserved while maintaining referential integrity.
