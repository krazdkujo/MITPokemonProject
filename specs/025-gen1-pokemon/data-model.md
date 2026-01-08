# Data Model: Gen 1 Pokemon Reduction

**Feature Branch**: `025-gen1-pokemon`
**Date**: 2026-01-07

## Overview

This feature modifies existing data files to reduce the Pokemon roster from 1,142 to 151 (Gen 1 only). No new entities are created; existing entities are filtered.

## Entities Affected

### 1. Pokemon (Modified)

**Source**: `Source/pokemon/pokemon.json`

| Field | Type | Filter Criteria |
|-------|------|-----------------|
| id | string | Keep if `number` in 1-151 |
| name | string | Unchanged |
| number | integer | **Must be 1-151** |
| type | string[] | Unchanged |
| sr | float | Unchanged |
| hp | integer | Unchanged |
| ac | integer | Unchanged |
| attributes | object | Unchanged |
| abilities | string[] | Unchanged |
| moves | object | Unchanged |

**Filter Rule**: `pokemon.number >= 1 AND pokemon.number <= 151`

**Before**: 1,142 entries
**After**: 151 entries

### 2. Location Encounters (Modified)

**Source**: `Source/locations.json`

| Field | Type | Filter Criteria |
|-------|------|-----------------|
| id | string | Unchanged |
| name | string | Unchanged |
| description | string | Unchanged |
| pokemon | array | **Filter to Gen 1 Pokemon IDs only** |

**Filter Rule**: Each entry in `pokemon[]` array must reference a Pokemon with `number` 1-151

### 3. Evolution Chains (Modified)

**Source**: `Source/evolution/evolution.json`

| Field | Type | Filter Criteria |
|-------|------|-----------------|
| pokemon | string | Keep if base Pokemon is Gen 1 |
| evolutions | array | **Remove entries targeting Pokemon #152+** |

**Filter Rules**:
- Keep evolution entry if base Pokemon number is 1-151
- Within each entry, remove evolution targets where target Pokemon number > 151
- Example: Eevee keeps Vaporeon/Jolteon/Flareon, removes Espeon/Umbreon/Leafeon/etc.

### 4. Pokemon Images (Deleted)

**Source**: `public/images/pokemon/`

| Pattern | Action |
|---------|--------|
| `1.png` - `151.png` | Keep |
| `152.png` - `1025.png` | **Delete** |
| `placeholder.png` | Keep |

**Files to Delete**: ~874 files
**Files to Keep**: 152 files (151 Pokemon + placeholder)

### 5. Player Pokemon (Database - Migration)

**Table**: `player_pokemon` (Supabase)

| Column | Type | Migration Action |
|--------|------|------------------|
| id | uuid | Unchanged |
| user_id | uuid | Unchanged |
| pokemon_id | text | **Validate against Gen 1** |
| nickname | text | Unchanged |
| level | integer | Unchanged |
| current_hp | integer | Unchanged |
| max_hp | integer | Unchanged |
| move_pp | jsonb | Unchanged |

**Migration Rule**:
- Records where `pokemon_id` references a Gen 1 Pokemon: Keep
- Records where `pokemon_id` references Pokemon #152+: Delete or nullify

## Entities NOT Affected

| Entity | Source File | Reason |
|--------|-------------|--------|
| Moves | `Source/moves/moves.json` | Gen 1 Pokemon can learn any move |
| Abilities | `Source/abilities/abilities.json` | Abilities not gen-restricted |
| Zones | `Source/zones.json` | Type/SR filters; auto-adjusts to available Pokemon |
| Users | `users` table | No Pokemon references |
| Inventory | `player_inventory` table | Items not gen-restricted |
| Active Battles | `active_battles` table | Uses Pokemon data at runtime; auto-adjusts |

## State Transitions

This feature involves data transformation, not state machines. The transformation is:

```
[Full Dataset] → [Filter by number 1-151] → [Gen 1 Dataset]
```

### Data Flow

```
1. pokemon.json (1,142 entries)
   └── Filter: number >= 1 AND number <= 151
       └── pokemon.json (151 entries)

2. locations.json (encounter arrays)
   └── For each location.pokemon[]
       └── Filter: pokemon_id exists in Gen 1 dataset
           └── locations.json (filtered encounters)

3. evolution.json (evolution chains)
   └── For each evolution entry
       └── Filter: base pokemon is Gen 1
       └── Filter: evolution targets are Gen 1
           └── evolution.json (Gen 1 evolutions only)

4. public/images/pokemon/
   └── Delete: files matching [152-1025].png
       └── Only Gen 1 images remain
```

## Validation Rules

### Pokemon Validation
- `number` must be integer 1-151
- `id` must be unique
- `type` must be non-empty array

### Location Validation
- All Pokemon IDs in `pokemon[]` must exist in filtered pokemon.json
- At least one Pokemon per location (or remove location)

### Evolution Validation
- Base Pokemon must be Gen 1
- All evolution targets must be Gen 1
- Evolution chains must be complete (no dangling references)

### Image Validation
- Every Pokemon ID 1-151 must have corresponding `{id}.png`
- No images for IDs > 151

## Relationships

```
Pokemon (1-151)
    │
    ├──< Location.pokemon[] (many-to-many)
    │
    ├──< Evolution.evolutions[] (one-to-many)
    │
    └──< PlayerPokemon.pokemon_id (one-to-many)
```

## Data Integrity Constraints

1. **Referential Integrity**: All Pokemon references must resolve to existing Gen 1 Pokemon
2. **Image Availability**: Every Pokemon ID must have corresponding image file
3. **Evolution Completeness**: No evolution chain can reference non-existent Pokemon
4. **Encounter Validity**: All encounter pools must have at least one spawnable Pokemon
