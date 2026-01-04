# Data Model: Wild Pokemon Encounter Page

**Feature**: 014-wild-encounter
**Date**: 2026-01-04

## Overview

This feature introduces one new Source data file (`locations.json`) and leverages existing data structures. No database schema changes are required.

---

## New Entity: Location

**Storage**: `Source/locations.json` (read-only reference data)

### Schema

```typescript
interface Location {
  id: string;           // Unique identifier (e.g., "route-1")
  name: string;         // Display name (e.g., "Route 1")
  description: string;  // Flavor text about the area
  levelRange: {
    min: number;        // Minimum Pokemon level (1-20)
    max: number;        // Maximum Pokemon level (1-20)
  };
  pokemon: PokemonEncounter[];  // Available wild Pokemon
  terrain: string;      // Visual theme ("grass" | "cave" | "water" | "forest")
  unlockRequirement: string | null;  // Future: unlock condition, null for MVP
}

interface PokemonEncounter {
  id: string;    // Pokemon ID from Source (e.g., "rattata")
  weight: number; // Relative encounter rate (higher = more common)
}
```

### Validation Rules

| Field | Rule |
|-------|------|
| id | Required, unique, lowercase with hyphens |
| name | Required, non-empty string |
| description | Required, non-empty string |
| levelRange.min | Required, integer 1-20, <= max |
| levelRange.max | Required, integer 1-20, >= min |
| pokemon | Required, non-empty array |
| pokemon[].id | Must exist in Source/pokemon/pokemon.json |
| pokemon[].weight | Required, positive integer |
| terrain | Required, one of: "grass", "cave", "water", "forest" |
| unlockRequirement | Optional, null for MVP |

### Sample Data

```json
{
  "locations": [
    {
      "id": "route-1",
      "name": "Route 1",
      "description": "A peaceful path connecting Pallet Town to Viridian City. New trainers often begin their journey here.",
      "levelRange": { "min": 2, "max": 4 },
      "pokemon": [
        { "id": "rattata", "weight": 50 },
        { "id": "pidgey", "weight": 50 }
      ],
      "terrain": "grass",
      "unlockRequirement": null
    },
    {
      "id": "viridian-forest",
      "name": "Viridian Forest",
      "description": "A dense forest maze filled with bug Pokemon. Trainers often get lost in its winding paths.",
      "levelRange": { "min": 3, "max": 6 },
      "pokemon": [
        { "id": "caterpie", "weight": 40 },
        { "id": "weedle", "weight": 40 },
        { "id": "pikachu", "weight": 5 },
        { "id": "metapod", "weight": 10 },
        { "id": "kakuna", "weight": 5 }
      ],
      "terrain": "forest",
      "unlockRequirement": null
    },
    {
      "id": "route-22",
      "name": "Route 22",
      "description": "A rugged path west of Viridian City, known for its diverse Pokemon population.",
      "levelRange": { "min": 3, "max": 5 },
      "pokemon": [
        { "id": "rattata", "weight": 30 },
        { "id": "spearow", "weight": 30 },
        { "id": "nidoran-m", "weight": 20 },
        { "id": "nidoran-f", "weight": 20 }
      ],
      "terrain": "grass",
      "unlockRequirement": null
    },
    {
      "id": "mt-moon",
      "name": "Mt. Moon",
      "description": "A mountain cave system filled with mysterious Pokemon. Rare fossils are said to be found here.",
      "levelRange": { "min": 6, "max": 10 },
      "pokemon": [
        { "id": "zubat", "weight": 50 },
        { "id": "geodude", "weight": 30 },
        { "id": "clefairy", "weight": 10 },
        { "id": "paras", "weight": 10 }
      ],
      "terrain": "cave",
      "unlockRequirement": null
    }
  ]
}
```

---

## Existing Entity: Wild Encounter (Runtime)

**Storage**: React component state (ephemeral)

This is not persisted; it represents the current encounter state during gameplay.

### Schema

```typescript
interface WildEncounter {
  pokemon_id: string;   // Pokemon ID from Source
  name: string;         // Pokemon display name
  level: number;        // Generated level within location range
  type: string[];       // Pokemon types
  sprite: string;       // Image path
  location: string;     // Location ID where encountered
}
```

### State Transitions

```
[No Encounter]
    │
    v (player clicks "Search for Pokemon")
[Searching]
    │
    v (API generates Pokemon)
[Encounter Active]
    │
    ├── (player clicks "Battle") ──> [Navigate to Combat]
    │
    └── (player clicks "Flee") ──> [No Encounter]
```

---

## Existing Entity: Battle Session

**Storage**: Returned from `/api/battle/start` (ephemeral)

No changes to existing structure. Used as-is from the combat engine.

### Relevant Fields

```typescript
interface BattleStartResponse {
  battle_id: string;
  battle_type: "wild";
  opponent: {
    pokemon_id: string;
    name: string;
    level: number;
    current_hp: number;
    max_hp: number;
    type: string[];
    // ... additional combat fields
  };
  // ... player_pokemon, initiative fields
}
```

---

## Data Access Patterns

### Read Patterns

| Operation | Source | Function |
|-----------|--------|----------|
| Get all locations | Source/locations.json | `getAllLocations()` |
| Get location by ID | Source/locations.json | `getLocationById(id)` |
| Get Pokemon for location | Source/pokemon.json | `getPokemonById(pokemonId)` |
| Get player party | Supabase + GameContext | `useGame().party` |

### Write Patterns

| Operation | Target | Method |
|-----------|--------|--------|
| None | - | No database writes in this feature |

---

## Utility Functions (lib/locationData.js)

```javascript
/**
 * Load all locations from Source/locations.json
 * @returns {Location[]} Array of location objects
 */
export function getAllLocations() { ... }

/**
 * Get a single location by ID
 * @param {string} id - Location ID
 * @returns {Location|null} Location object or null
 */
export function getLocationById(id) { ... }

/**
 * Select a random Pokemon from location's pool based on weights
 * @param {Location} location - Location object
 * @returns {string} Pokemon ID
 */
export function selectRandomPokemon(location) { ... }

/**
 * Generate a random level within location's range
 * @param {Location} location - Location object
 * @returns {number} Level (integer)
 */
export function generateEncounterLevel(location) { ... }
```

---

## Relationship Diagram

```
                     ┌─────────────────┐
                     │    Location     │
                     │ (Source JSON)   │
                     └────────┬────────┘
                              │ references pokemon IDs
                              v
┌─────────────────┐    ┌─────────────────┐
│  Player Party   │    │    Pokemon      │
│ (Database/RLS)  │    │ (Source JSON)   │
└────────┬────────┘    └────────┬────────┘
         │                      │
         │ first healthy        │ provides stats/moves
         v                      v
┌─────────────────────────────────────┐
│         /api/battle/start           │
│    (creates ephemeral battle)       │
└─────────────────────────────────────┘
                  │
                  v
       ┌─────────────────┐
       │  Combat Page    │
       │  (battle_id)    │
       └─────────────────┘
```

---

## Notes

1. **No Database Changes**: This feature uses existing tables only
2. **Two-Tier Compliance**: Location data is read-only reference data in Source/
3. **Pokemon Pool Integrity**: All pokemon IDs in locations.json must exist in pokemon.json
4. **Level Ranges**: Must respect Pokemon 5e level cap of 20
