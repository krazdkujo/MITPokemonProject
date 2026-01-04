# Data Model: Shop API Endpoint

**Feature**: 009-shop-api
**Date**: 2026-01-04

## Overview

This feature adds inventory management for purchased items. Following the Two-Tier Data Model (Constitution I), item reference data remains in Source files while only user-specific inventory state is stored in the database.

---

## Source Data (Read-Only)

### Items Catalog

**Location**: `Source/items/items.json`

**Schema** (existing):
```json
{
  "id": "poke-ball",
  "name": "Poke Ball",
  "type": "pokeball",
  "cost": 250,
  "description": "Lets a trainer attempt a Capture Roll to catch a Pokemon."
}
```

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier (kebab-case) |
| name | string | Display name |
| type | string | Category: pokeball, medicine, tm, holditem, etc. |
| cost | number or null | Purchase price in currency; null = not purchasable |
| description | string | Item effect/usage description |

**Item Types in Catalog**:
- `pokeball` - Capture devices (Poke Ball, Great Ball, Ultra Ball, etc.)
- `medicine` - Healing items (Potion, Super Potion, Antidote, etc.)
- `tm` - Technical Machines (move teaching)
- `holditem` - Held items for battle effects

---

## Database Schema

### Existing: users Table

**Note**: Currency column added by `004_battle_system.sql`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | User identifier |
| email | TEXT | NOT NULL, UNIQUE | User email |
| name | TEXT | NOT NULL | Display name |
| currency | INTEGER | NOT NULL, DEFAULT 0, CHECK >= 0 | In-game currency balance |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update timestamp |

### New: player_inventory Table

**Migration**: `sql/005_player_inventory.sql`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Row identifier |
| user_id | UUID | NOT NULL, FK users(id) ON DELETE CASCADE | Owner reference |
| item_id | TEXT | NOT NULL | Reference to Source items.json id |
| quantity | INTEGER | NOT NULL, DEFAULT 1, CHECK > 0 | Number owned |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | First acquired timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last quantity change |

**Constraints**:
- `UNIQUE(user_id, item_id)` - One row per item per user

**Indexes**:
- `idx_player_inventory_user_id` on `user_id` - Fast user inventory lookups

**RLS Policies**:
- SELECT: `user_id = auth.uid()`
- INSERT: `user_id = auth.uid()`
- UPDATE: `user_id = auth.uid()`
- DELETE: `user_id = auth.uid()`

---

## Entity Relationships

```
users (existing)
  ├── id (PK)
  ├── currency
  └── ...

player_inventory (new)
  ├── id (PK)
  ├── user_id (FK → users.id)
  ├── item_id (→ Source items.json)
  └── quantity

Source/items/items.json (read-only)
  └── [ { id, name, type, cost, description }, ... ]
```

---

## Data Operations

### Purchase Flow

1. **Validate Item**: Check `item_id` exists in Source with non-null `cost`
2. **Check Balance**: Query `users.currency WHERE id = user_id`
3. **Verify Funds**: `currency >= cost * quantity`
4. **Deduct Currency**: `UPDATE users SET currency = currency - total_cost WHERE id = user_id`
5. **Add Inventory**: `INSERT INTO player_inventory (user_id, item_id, quantity) VALUES (...) ON CONFLICT (user_id, item_id) DO UPDATE SET quantity = quantity + $quantity`
6. **Return State**: Query updated currency and inventory

### Inventory Query

```sql
SELECT pi.item_id, pi.quantity
FROM player_inventory pi
WHERE pi.user_id = $user_id
ORDER BY pi.created_at ASC;
```

Results are merged with Source item data in `lib/itemData.js` before returning.

---

## Migration Script

**File**: `sql/005_player_inventory.sql`

```sql
-- Migration: 005_player_inventory
-- Purpose: Create player inventory table for purchased items
-- Date: 2026-01-04
-- Feature: 009-shop-api

-- Create player_inventory table
CREATE TABLE IF NOT EXISTS player_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);

-- Index for user inventory lookups
CREATE INDEX IF NOT EXISTS idx_player_inventory_user_id
ON player_inventory(user_id);

-- Enable Row-Level Security
ALTER TABLE player_inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own inventory"
  ON player_inventory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory"
  ON player_inventory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory"
  ON player_inventory FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own inventory"
  ON player_inventory FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at trigger
CREATE TRIGGER update_player_inventory_updated_at
  BEFORE UPDATE ON player_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Validation Rules

| Field | Rule | Error Code |
|-------|------|------------|
| item_id | Must exist in Source items.json | ITEM_NOT_FOUND |
| item_id | Item must have non-null cost | ITEM_NOT_PURCHASABLE |
| quantity | Must be positive integer | INVALID_QUANTITY |
| currency | Must be >= total cost | INSUFFICIENT_FUNDS |

---

## State Transitions

### Inventory Quantity

- **Initial**: 0 (no row exists)
- **After first purchase**: New row with quantity = purchased amount
- **After subsequent purchase**: quantity += purchased amount
- **After use** (future feature): quantity -= used amount; delete row if quantity = 0
