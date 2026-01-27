# PostgreSQL Database Setup with Two User Roles

This guide demonstrates how to set up a PostgreSQL database with two distinct user roles: a **migrator** (for schema management) and an **app user** (for content editing only).

## Overview

We'll create a database with the following access patterns:

- **Migrator Role**: Full control over schema (create/modify tables, sequences, etc.)
- **App User Role**: Limited to data operations only (SELECT, INSERT, UPDATE, DELETE on existing tables)

## Step 1: Create the Database

```sql
CREATE DATABASE nebula_db;
```

## Step 2: Create User Roles

Create two users with their respective passwords:

```sql
CREATE USER nebula_db_migrator WITH PASSWORD 'your_secure_password_here';
CREATE USER nebula_db_app WITH PASSWORD 'your_secure_password_here';
```

::: warning Security Note
Replace `'your_secure_password_here'` with strong, unique passwords in production environments.
:::

## Step 3: Grant Database Connection

Allow both users to connect to the database:

```sql
GRANT CONNECT ON DATABASE nebula_db TO nebula_db_migrator, nebula_db_app;
```

## Step 4: Connect to the Database

Switch to the newly created database:

```sql
\c nebula_db
```

## Step 5: Configure Schema Permissions

### Revoke Default Public Access

First, remove all default permissions from the public schema:

```sql
REVOKE ALL ON SCHEMA public FROM PUBLIC;
```

### Grant Migrator Permissions

Give the migrator full control over the schema:

```sql
GRANT USAGE, CREATE ON SCHEMA public TO nebula_db_migrator;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nebula_db_migrator;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO nebula_db_migrator;
```

### Grant App User Permissions

Give the app user limited data-only permissions:

```sql
GRANT USAGE ON SCHEMA public TO nebula_db_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nebula_db_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO nebula_db_app;
```

## Step 6: Set Default Privileges for Future Objects

Ensure that any tables or sequences created in the future automatically grant appropriate permissions:

```sql
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO nebula_db_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE, SELECT ON SEQUENCES TO nebula_db_app;
```

::: tip Why Default Privileges?
The `ALTER DEFAULT PRIVILEGES` commands ensure that when the migrator creates new tables or sequences, the app user automatically receives the appropriate permissions without manual intervention.
:::

## Permission Summary

| Action | Migrator | App User |
|--------|----------|----------|
| Create/Drop Tables | ✅ | ❌ |
| Alter Table Structure | ✅ | ❌ |
| Create/Drop Sequences | ✅ | ❌ |
| SELECT (Read Data) | ✅ | ✅ |
| INSERT (Add Rows) | ✅ | ✅ |
| UPDATE (Modify Rows) | ✅ | ✅ |
| DELETE (Remove Rows) | ✅ | ✅ |

## Usage Example

### Using the Migrator Role

The migrator should be used for schema migrations and structural changes:

```sql
-- Connect as migrator
psql -U nebula_db_migrator -d nebula_db

-- Create tables, run migrations, etc.
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL
);
```

### Using the App User Role

The app user should be used by your application for day-to-day operations:

```sql
-- Connect as app user
psql -U nebula_db_app -d nebula_db

-- Insert, update, delete, and read data
INSERT INTO users (username, email) VALUES ('john_doe', 'john@example.com');
SELECT * FROM users;
UPDATE users SET email = 'newemail@example.com' WHERE username = 'john_doe';
DELETE FROM users WHERE username = 'john_doe';
```

## Best Practices

::: tip Migration Workflow
1. Always use the **migrator** account for running database migrations
2. Use the **app user** account in your application connection strings
3. Keep migrator credentials secure and separate from application configuration
4. Never grant DDL permissions (CREATE, DROP, ALTER) to the app user
:::

## Troubleshooting

### App User Cannot Access New Tables

If the app user cannot access tables created after setup, ensure the migrator account created them. The default privileges only apply to objects created by the role that set them.

### Permission Denied Errors

Verify permissions with:

```sql
-- Check table permissions
\dp table_name

-- Check schema permissions
\dn+
```

## Complete Setup Script

Here's the complete script for quick reference:

```sql
-- Create database
CREATE DATABASE nebula_db;

-- Create users
CREATE USER nebula_db_migrator WITH PASSWORD 'secure_password_1';
CREATE USER nebula_db_app WITH PASSWORD 'secure_password_2';

-- Grant connection
GRANT CONNECT ON DATABASE nebula_db TO nebula_db_migrator, nebula_db_app;

-- Switch to database
\c nebula_db

-- Revoke public access
REVOKE ALL ON SCHEMA public FROM PUBLIC;

-- Configure migrator
GRANT USAGE, CREATE ON SCHEMA public TO nebula_db_migrator;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nebula_db_migrator;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO nebula_db_migrator;

-- Configure app user
GRANT USAGE ON SCHEMA public TO nebula_db_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nebula_db_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO nebula_db_app;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO nebula_db_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE, SELECT ON SEQUENCES TO nebula_db_app;
```