# Data Model: Healing API

**Feature**: 008-healing-api
**Date**: 2026-01-03

## Overview

The Healing API operates on the existing `player_pokemon` table. No new tables or schema changes are required.

## Existing Entities Used

### player_pokemon (Existing Table)

The healing endpoint reads and updates records in this table.

| Column | Type | Description | Healing Operation |
|--------|------|-------------|-------------------|
| id | UUID | Primary key | Read (for response) |
| user_id | UUID | Foreign key to users | Filter (WHERE clause) |
| pokemon_id | TEXT | Reference to Source Pokemon | Read (for PP init) |
| level | INTEGER | Pokemon level (1-20) | Read only |
| current_hp | INTEGER | Current hit points | **UPDATE to max_hp** |
| max_hp | INTEGER | Maximum hit points | Read (target value) |
| is_active | BOOLEAN | In active party | Filter (WHERE clause) |
| slot_number | INTEGER | Party slot (1-6) | Read (for ordering) |
| selected_moves | TEXT[] | Array of move IDs | Read (for PP init) |
| move_pp | JSONB | Current PP per move | **UPDATE (reinitialize)** |
| experience | INTEGER | Current XP | Read only |
| pending_levelup | BOOLEAN | Level-up pending | Read only |
| created_at | TIMESTAMPTZ | Creation timestamp | Read only |
| updated_at | TIMESTAMPTZ | Last update timestamp | Auto-updated |

### Source Data (Read-Only)

| Source File | Data Used | Purpose |
|-------------|-----------|---------|
| Source/pokemon/pokemon.json | Pokemon name, type, number | Merged into response |
| Source/moves/moves.json | Move PP values | Initialize move_pp |

## Data Flow

```text
1. Request arrives with JWT
         |
         v
2. authenticateRequest() extracts user_id
         |
         v
3. Query: SELECT * FROM player_pokemon
          WHERE user_id = $1 AND is_active = true
         |
         v
4. For each Pokemon:
   - Calculate new move_pp using initializeMovePP(selected_moves)
   - Set current_hp = max_hp
         |
         v
5. UPDATE player_pokemon SET current_hp = max_hp, move_pp = $pp
   WHERE id IN ($ids)
         |
         v
6. SELECT updated records
         |
         v
7. buildPlayerPokemonListResponse() merges with Source
         |
         v
8. Return merged response
```

## Database Queries

### Query 1: Fetch Active Pokemon

```sql
SELECT *
FROM player_pokemon
WHERE user_id = $1
  AND is_active = true
ORDER BY slot_number ASC NULLS LAST;
```

### Query 2: Update HP and PP (per Pokemon)

Due to the need to compute individual move_pp per Pokemon, updates are executed per record:

```sql
UPDATE player_pokemon
SET current_hp = max_hp,
    move_pp = $2
WHERE id = $1;
```

Note: While a single bulk UPDATE would be more efficient, each Pokemon has different selected_moves requiring individual PP calculation. The loop of updates is acceptable for max 6 Pokemon.

## Response Entity

The API returns a merged response using `buildPlayerPokemonListResponse()`:

```typescript
interface HealedPokemon {
  id: string;              // From database
  pokemon_id: string;      // From database
  name: string;            // From Source
  type: string[];          // From Source
  level: number;           // From database
  current_hp: number;      // Updated (= max_hp)
  max_hp: number;          // From database
  is_active: boolean;      // From database
  slot_number: number;     // From database
  sprite: string;          // From Source (computed path)
  artwork: string;         // From Source (computed path)
}

interface HealResponse {
  success: boolean;
  data: {
    healed: HealedPokemon[];
    healed_count: number;
    message: string;
  };
}
```

## Validation Rules

| Rule | Enforcement |
|------|-------------|
| User must be authenticated | authenticateRequest() returns 401 if invalid |
| Only active Pokemon healed | WHERE is_active = true |
| Only user's own Pokemon | WHERE user_id = $userId (RLS also enforces) |
| current_hp <= max_hp | Database constraint hp_bounds |

## State Transitions

```text
Before Heal:
  Pokemon A: current_hp = 5,  max_hp = 30, move_pp = {"tackle": 2, "vine-whip": 0}
  Pokemon B: current_hp = 0,  max_hp = 25, move_pp = {"scratch": 5, "ember": 3}

After Heal:
  Pokemon A: current_hp = 30, max_hp = 30, move_pp = {"tackle": 35, "vine-whip": 25}
  Pokemon B: current_hp = 25, max_hp = 25, move_pp = {"scratch": 35, "ember": 25}
```

Note: PP values are reset to their Source-defined maximums, not incremented.
