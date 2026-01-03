# Data Model: Environment and Test Auth Setup

**Feature**: 001-env-auth-setup
**Date**: 2026-01-03

## Entities

### User

The foundational entity representing a platform user. All other user-specific data
in the platform will reference this table via `user_id` foreign key.

**Table Name**: `users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| email | TEXT | NOT NULL, UNIQUE | User's email address (login identifier) |
| name | TEXT | NOT NULL | Display name |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification timestamp |

**Indexes**:
- Primary key on `id`
- Unique index on `email` (for lookup during auth)

**Row-Level Security Policies**:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own record
CREATE POLICY "Users can view own record"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own record
CREATE POLICY "Users can update own record"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Insert handled by service role during user creation
-- No public insert policy needed
```

## State Transitions

### User Lifecycle

```
[New Email Submitted] --> [User Created] --> [Active User]
                              ^                   |
                              |                   |
                    [Existing Email] ----[Login]--+
```

**States**:
- **Non-existent**: Email not in database
- **Active**: User record exists and can authenticate

**Transitions**:
- New email submission: Creates user record (Non-existent -> Active)
- Existing email submission: Retrieves user record (Active -> Active, no state change)

## Validation Rules

### Email
- Must be valid email format (contains @ and domain)
- Must be unique across all users
- Case-insensitive comparison for uniqueness

### Name
- Must be non-empty string
- No length limit enforced at database level (application may limit for display)

## SQL Migration

The complete migration script will be placed in `sql/001_create_users_table.sql`:

```sql
-- Migration: 001_create_users_table
-- Purpose: Create the foundational users table with RLS
-- Date: 2026-01-03

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Enable Row-Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own record
CREATE POLICY "Users can view own record"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own record
CREATE POLICY "Users can update own record"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Relationships

This is the root entity. Future tables will reference it:

```
users (this feature)
  |
  +-- player_pokemon (future: user's Pokemon collection)
  |     - user_id -> users.id
  |
  +-- inventory (future: user's items)
  |     - user_id -> users.id
  |
  +-- battle_log (future: battle history)
        - user_id -> users.id
```

All child tables will include:
- `user_id UUID NOT NULL REFERENCES users(id)`
- RLS policies checking `user_id = auth.uid()`
