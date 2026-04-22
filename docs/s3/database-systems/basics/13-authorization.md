---
title: Authorization
sidebar:
  order: 13
slug: s3/database-systems/basics/authorization
prev: true
next: true
dateCreated: 2026-04-22T07:09:10.696Z
lastUpdatedOn: 2026-04-22T07:15:36.795Z
---

Refers to the process of determining what actions a user or application is permitted to perform on database objects such as tables, views, or procedures.

When a user connects to a SQL database, their identity is verified, and then the database checks what operations they are authorized to perform. These operations can be:

- reading data (SELECT)
- modifying data (INSERT, UPDATE, DELETE)
- executing stored procedures
- altering the structure of the database (CREATE, DROP, ALTER)

Privileges are typically granted to users or roles by a database administrator or another user with sufficient authority. For example, a user might be granted permission to SELECT from a table but not to DELETE from it. Privileges can be very granular, applying to specific columns within a table or to entire schemas.

Currently, SQL standard does not have a way to define row-level access controls.

## GRANT

The process of granting privileges involves explicit commands, such as the GRANT statement in SQL.

```sql
GRANT SELECT ON employees TO <user>;
```

The grantor of the privilege must already hold the required privileges on the specified item (or be the database administrator).

If a user is granted a previlege using `WITH GRANT OPTION`, they can grant the same previlege to another user.

Granting a privilege on a view does not imply granting any privileges on the underlying relations.

## REVOKE

Used to remove previously granted privileges.

```sql
REVOKE SELECT ON employees FROM alice;
```

If the same privilege was granted twice to the same user by different grantees, the user may retain the privilege after the revocation.

All privileges that depend on the privilege being revoked are also revoked.

Revoking a privilege from a user who has granted it to others can lead to cascading revocations, depending on the database system's implementation.

## Roles

Named groups of privileges that can be assigned to users or to other roles. Some DBMS provide built-in roles with predefined privileges, such as `db_owner` or `read_only`.

```sql
CREATE ROLE report_reader;
GRANT SELECT ON reports TO report_reader;
GRANT report_reader TO bob;
```

Can be hierarchical. Revoking a role from a user removes all privileges that were inherited through that role.

Makes it easy to apply the grant privileges to multiple users at once.
