# Data Model: Player Dashboard

**Feature**: 003-player-dashboard
**Date**: 2026-01-03

## Entities

### player_pokemon (Existing - Enhanced)

The core table for storing user-owned Pokemon. Already exists from 002-starter-selection but requires HP field additions.

**Current Fields** (from sql/002_create_player_pokemon.sql):
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique record identifier |
| user_id | UUID | NOT NULL, FK users(id), ON DELETE CASCADE | Owner reference |
| pokemon_id | TEXT | NOT NULL | Reference to Source pokemon ID |
| level | INTEGER | NOT NULL, DEFAULT 1, CHECK 1-20 | Current level |
| is_active | BOOLEAN | NOT NULL, DEFAULT false | In active party? |
| slot_number | INTEGER | CHECK 1-6, NULLABLE | Party slot (1-6) if active |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update timestamp |

**New Fields** (migration 003):
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| current_hp | INTEGER | NOT NULL, DEFAULT 1, CHECK >= 0 | Current hit points |
| max_hp | INTEGER | NOT NULL, DEFAULT 1, CHECK >= 1 | Maximum hit points |

**Indexes**:
- idx_player_pokemon_user_id (user_id)
- idx_player_pokemon_active (user_id, is_active) WHERE is_active = true

**RLS Policies**:
- Users can view own Pokemon: SELECT WHERE user_id = auth.uid()
- Users can insert own Pokemon: INSERT WITH CHECK user_id = auth.uid()
- Users can update own Pokemon: UPDATE WHERE user_id = auth.uid()
- Users can delete own Pokemon: DELETE WHERE user_id = auth.uid()

### player_badges (Future - Placeholder)

Table for tracking gym badges earned by players. Not created in this feature but documented for badge count placeholder.

**Planned Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique record identifier |
| user_id | UUID | NOT NULL, FK users(id) | Owner reference |
| badge_id | TEXT | NOT NULL | Reference to badge identifier |
| earned_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | When badge was earned |

**Note**: This table will be created when gym battles are implemented. Dashboard currently shows badge_count: 0.

## Derived Data

### Pokedex Progress

Not stored in database. Calculated as:
```sql
SELECT COUNT(DISTINCT pokemon_id)
FROM player_pokemon
WHERE user_id = $user_id
```

Returns the number of unique Pokemon species the player has ever owned.

### Box Count

Not stored in database. Calculated as:
```sql
SELECT COUNT(*)
FROM player_pokemon
WHERE user_id = $user_id AND is_active = false
```

Returns the number of Pokemon in storage (not in active party).

### Active Count

Not stored in database. Calculated as:
```sql
SELECT COUNT(*)
FROM player_pokemon
WHERE user_id = $user_id AND is_active = true
```

Returns the number of Pokemon in the active party (0-6).

## Source Data References

The dashboard merges database records with the following Source files:

### Source/pokemon/pokemon.json

Provides static Pokemon data merged with player_pokemon records:

| Field | Usage |
|-------|-------|
| id | Matches pokemon_id from database |
| name | Display name for Pokemon |
| type | Array of type strings for badges |
| media.sprite | URL for sprite image |
| media.main | URL for artwork image |
| hp | Base HP for calculations |
| hitDice | Hit dice type for HP calculations |

### Source/metadata.json (for total Pokedex count)

| Field | Usage |
|-------|-------|
| totalPokemon | Total number of Pokemon in game (for "X / Y caught" display) |

## State Transitions

### Pokemon HP Changes

```
created (current_hp = max_hp calculated from level + hit dice)
    |
    v
battle damage (current_hp decreased)
    |
    v
healing (current_hp increased, capped at max_hp)
    |
    v
fainted (current_hp = 0)
    |
    v
revived (current_hp restored)
```

### Pokemon Party Status

```
created (is_active based on party slots available)
    |
    v
deposited (is_active = false, slot_number = null)
    |
    v
withdrawn (is_active = true, slot_number = available 1-6)
```

## Validation Rules

1. **HP Bounds**: current_hp MUST be >= 0 and <= max_hp
2. **Level Bounds**: level MUST be >= 1 and <= 20 (Pokemon 5e cap)
3. **Slot Uniqueness**: Each slot_number (1-6) MUST be unique per user for active Pokemon
4. **Active Count**: A user can have at most 6 Pokemon with is_active = true
5. **Valid Pokemon ID**: pokemon_id MUST exist in Source/pokemon/pokemon.json

## Migration: 003_add_hp_fields.sql

```sql
-- Migration: 003_add_hp_fields
-- Purpose: Add HP tracking fields to player_pokemon table
-- Date: 2026-01-03
-- Feature: 003-player-dashboard

-- Add HP fields with defaults
ALTER TABLE player_pokemon
ADD COLUMN IF NOT EXISTS current_hp INTEGER NOT NULL DEFAULT 1 CHECK (current_hp >= 0),
ADD COLUMN IF NOT EXISTS max_hp INTEGER NOT NULL DEFAULT 1 CHECK (max_hp >= 1);

-- Add constraint to ensure current_hp <= max_hp
ALTER TABLE player_pokemon
ADD CONSTRAINT hp_bounds CHECK (current_hp <= max_hp);

-- Update existing records to have proper HP values
-- For existing Pokemon, set HP to a reasonable default based on level
-- (Will need to be recalculated properly using Pokemon 5e formulas)
UPDATE player_pokemon
SET
  max_hp = 10 + (level * 2),
  current_hp = 10 + (level * 2)
WHERE max_hp = 1;
```
