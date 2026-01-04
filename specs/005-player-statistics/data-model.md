# Data Model: Player Statistics Page

**Feature**: 005-player-statistics
**Date**: 2026-01-03

## Overview

This feature does NOT require new database tables. All statistics are computed from existing data:
- `player_pokemon` table (user's Pokemon collection)
- `Source/pokemon/pokemon.json` (Pokemon species data including types)

## Existing Entities Used

### player_pokemon (Database)

Existing table storing user's Pokemon. No modifications needed.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users table |
| pokemon_id | TEXT | Reference to Source pokemon ID (e.g., "bulbasaur") |
| level | INTEGER | Current level (1-20) |
| current_hp | INTEGER | Current HP value |
| max_hp | INTEGER | Maximum HP value |
| is_active | BOOLEAN | Whether in active party |
| slot_number | INTEGER | Party slot (1-6) or null |
| created_at | TIMESTAMPTZ | When captured/added |
| updated_at | TIMESTAMPTZ | Last modification |

### Pokemon Source Data

Read-only JSON from `Source/pokemon/pokemon.json`.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier (e.g., "bulbasaur") |
| name | string | Display name (e.g., "Bulbasaur") |
| number | integer | Pokedex number |
| type | string[] | Array of types (e.g., ["grass", "poison"]) |
| sprite | string | Path to sprite image |

## Computed Statistics (API Response)

These are calculated at request time, not stored in database.

### CollectionStats

| Field | Type | Description |
|-------|------|-------------|
| totalPokemon | integer | Total count of player's Pokemon |
| uniqueSpecies | integer | Count of distinct pokemon_id values |
| typeDistribution | TypeCount[] | Array of type counts |

### TypeCount

| Field | Type | Description |
|-------|------|-------------|
| type | string | Pokemon type (e.g., "water") |
| count | integer | Number of Pokemon with this type |
| percentage | number | Percentage of total (0-100) |

### LevelStats

| Field | Type | Description |
|-------|------|-------------|
| topPokemon | TopPokemon[] | Top 5 Pokemon by level |
| distribution | LevelDistribution | Counts by level range |

### TopPokemon

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | player_pokemon record ID |
| pokemon_id | string | Source pokemon ID |
| name | string | Pokemon display name |
| level | integer | Current level |
| sprite | string | Path to sprite image |
| type | string[] | Pokemon types |

### LevelDistribution

| Field | Type | Description |
|-------|------|-------------|
| "1-5" | integer | Count of Pokemon levels 1-5 |
| "6-10" | integer | Count of Pokemon levels 6-10 |
| "11-15" | integer | Count of Pokemon levels 11-15 |
| "16-20" | integer | Count of Pokemon levels 16-20 |

## Future Entities (Placeholder)

These entities will be implemented by future features. The statistics page will show empty/placeholder states until they exist.

### BattleStats (Future - P3)

| Field | Type | Description |
|-------|------|-------------|
| totalBattles | integer | Total battles participated in |
| wins | integer | Number of victories |
| losses | integer | Number of defeats |
| winRate | number | Win percentage (0-100) |
| mostUsedPokemon | MostUsedPokemon[] | Top 5 most used in battles |

### BadgeStats (Future - P4)

| Field | Type | Description |
|-------|------|-------------|
| earned | Badge[] | List of earned badges with timestamps |
| total | integer | Total possible badges (8) |
| remaining | integer | Badges left to earn |

## Data Flow Diagram

```
Request: GET /api/player/stats
           |
           v
    +-----------------+
    | Authenticate    |
    | (JWT -> userId) |
    +-----------------+
           |
           v
    +-----------------+
    | Query Database  |
    | player_pokemon  |
    | WHERE user_id   |
    +-----------------+
           |
           v
    +-----------------+
    | Merge with      |
    | Source data     |
    | (pokemonData.js)|
    +-----------------+
           |
           v
    +-----------------+
    | Calculate:      |
    | - Type counts   |
    | - Level dist.   |
    | - Top Pokemon   |
    +-----------------+
           |
           v
    +-----------------+
    | Return JSON     |
    | { success,      |
    |   data: {...} } |
    +-----------------+
```

## Validation Rules

### Existing Constraints (from player_pokemon)

- `level >= 1 AND level <= 20`
- `pokemon_id` must exist in Source data
- `user_id` must be valid authenticated user

### Calculation Rules

- **Type Distribution**: Each Pokemon's types are counted independently. A Grass/Poison Pokemon adds 1 to both "grass" and "poison" counts.
- **Level Distribution**: Ranges are inclusive. Level 5 goes in "1-5", level 6 goes in "6-10".
- **Top Pokemon**: Sorted by level descending, then by created_at ascending (older first as tiebreaker).
- **Percentages**: Rounded to one decimal place for display.

## State Transitions

N/A - This feature is read-only and does not modify any data.
