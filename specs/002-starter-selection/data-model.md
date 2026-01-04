# Data Model: Starter Pokemon Selection

**Feature**: 002-starter-selection
**Date**: 2026-01-03

## Overview

This feature introduces the `player_pokemon` table to store user-owned Pokemon. Following the Two-Tier Data Model principle, the table stores only user-specific state with references to Source data.

## Entities

### player_pokemon

Represents a Pokemon owned by a specific user.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| user_id | UUID | NOT NULL, FOREIGN KEY (users.id) | Owner reference |
| pokemon_id | TEXT | NOT NULL | Reference to Source pokemon ID (e.g., "bulbasaur") |
| level | INTEGER | NOT NULL, DEFAULT 1, CHECK (level >= 1 AND level <= 20) | Current level (Pokemon 5e max is 20) |
| is_active | BOOLEAN | NOT NULL, DEFAULT false | In active roster (max 6) |
| slot_number | INTEGER | CHECK (slot_number >= 1 AND slot_number <= 6) | Roster position (nullable if not active) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes**:
- `idx_player_pokemon_user_id` on (user_id) - Fast lookup of user's Pokemon
- `idx_player_pokemon_active` on (user_id, is_active) WHERE is_active = true - Fast active roster lookup

**RLS Policies**:
- SELECT: `user_id = auth.uid()` - Users can only view their own Pokemon
- INSERT: `user_id = auth.uid()` - Users can only add Pokemon to their own roster
- UPDATE: `user_id = auth.uid()` - Users can only modify their own Pokemon
- DELETE: `user_id = auth.uid()` - Users can only remove their own Pokemon

### Relationship Diagram

```
┌─────────────────┐         ┌─────────────────────┐
│     users       │         │   player_pokemon    │
├─────────────────┤         ├─────────────────────┤
│ id (PK)         │────────<│ user_id (FK)        │
│ email           │         │ id (PK)             │
│ name            │         │ pokemon_id ─────────┼──> Source/pokemon/pokemon.json
│ created_at      │         │ level               │
│ updated_at      │         │ is_active           │
└─────────────────┘         │ slot_number         │
                            │ created_at          │
                            │ updated_at          │
                            └─────────────────────┘
```

## Source Data Reference

The `pokemon_id` field references Pokemon in `Source/pokemon/pokemon.json`. For starter selection, we filter by `sr <= 0.5`.

**Relevant Source fields for display**:
```json
{
  "id": "bulbasaur",
  "name": "Bulbasaur",
  "type": ["grass", "poison"],
  "sr": 0.5,
  "media": {
    "sprite": "https://raw.githubusercontent.com/.../1.png",
    "main": "https://raw.githubusercontent.com/.../1.png"
  }
}
```

## API Response Merging

When returning player Pokemon data, merge database record with Source:

**Database record**:
```json
{
  "id": "uuid-here",
  "user_id": "user-uuid",
  "pokemon_id": "bulbasaur",
  "level": 1,
  "is_active": true,
  "slot_number": 1
}
```

**Merged API response**:
```json
{
  "id": "uuid-here",
  "pokemon_id": "bulbasaur",
  "name": "Bulbasaur",
  "type": ["grass", "poison"],
  "level": 1,
  "is_active": true,
  "slot_number": 1,
  "sprite": "https://raw.githubusercontent.com/.../1.png"
}
```

## Validation Rules

### Starter Selection
1. User must have zero existing Pokemon in player_pokemon
2. Selected pokemon_id must exist in Source data
3. Selected Pokemon must have sr <= 0.5
4. Only one starter can be selected (enforced by application logic)

### Active Roster (future features)
1. Maximum 6 active Pokemon (is_active = true)
2. Slot numbers 1-6 must be unique per user
3. is_active = false means slot_number should be null

## State Transitions

### New Player -> Has Starter
```
Initial State: user exists, player_pokemon count = 0
Action: Select starter
Final State: player_pokemon count = 1, is_active = true, slot_number = 1, level = 1
```

### Starter Selection Flow
```
[No Pokemon]
    │
    ▼ (user selects starter)
[INSERT player_pokemon]
    │
    ├── pokemon_id = selected ID
    ├── is_active = true
    ├── slot_number = 1
    └── level = 1
    │
    ▼
[Has Starter - Redirect to Dashboard]
```

## Migration Script

See `sql/002_create_player_pokemon.sql` for the complete migration with:
- Table creation
- Indexes
- RLS policies
- Trigger for updated_at
