# Data Model: Pokemon Center Page

**Date**: 2026-01-04
**Feature**: 012-pokecenter-page

## Overview

The Pokemon Center page is a frontend feature that leverages existing database tables and API endpoints. No new database entities are required.

---

## Existing Entities Used

### 1. Player Pokemon (Database)

**Table**: `player_pokemon`

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users table |
| pokemon_id | TEXT | Reference to Source pokemon ID |
| level | INTEGER | 1-20 |
| is_active | BOOLEAN | True = in party, False = in box |
| slot_number | INTEGER | 1-6 party position (null if boxed) |
| current_hp | INTEGER | Current health points |
| max_hp | INTEGER | Maximum health points |
| selected_moves | TEXT[] | Array of move IDs |
| move_pp | JSONB | Current PP for each move: `{"tackle": 35, "vine-whip": 25}` |

**Constraints**:
- current_hp >= 0
- max_hp >= 1
- current_hp <= max_hp
- level >= 1 AND level <= 20
- slot_number >= 1 AND slot_number <= 6

**RLS Policy**: `user_id = auth.uid()`

---

### 2. Pokemon (Source Data)

**File**: `Source/pokemon/pokemon.json`

| Field | Type | Description |
|-------|------|-------------|
| index | NUMBER | National dex number |
| name | STRING | Display name |
| type | STRING[] | Type array |
| SR | NUMBER | Species Rating |
| MIN LVL FOUND | NUMBER | Minimum encounter level |
| Abilities | STRING[] | Available abilities |
| Hidden Ability | STRING | Hidden ability |
| Evolves To | OBJECT | Evolution data |
| Starting Moves | STRING[] | Moves known at level 1 |
| Learnable Moves | OBJECT | Level-up moves |

---

### 3. Move (Source Data)

**File**: `Source/moves/moves.json`

| Field | Type | Description |
|-------|------|-------------|
| name | STRING | Move name |
| Type | STRING | Move type |
| Move Power | STRING | Damage category |
| Move Time | STRING | Action cost |
| PP | NUMBER | Maximum Power Points |
| Duration | STRING | Effect duration |
| Range | STRING | Attack range |
| Description | STRING | Effect description |

---

## API Response Models

### Party Pokemon Response

Merged response from database + Source data:

```typescript
interface PartyPokemon {
  id: string;           // UUID from database
  pokemon_id: string;   // e.g., "bulbasaur"
  name: string;         // From Source: "Bulbasaur"
  type: string[];       // From Source: ["Grass", "Poison"]
  level: number;        // From database: 1-20
  current_hp: number;   // From database
  max_hp: number;       // From database
  is_active: boolean;   // From database
  slot_number: number;  // From database: 1-6
  sprite: string;       // Computed: "/images/pokemon/{index}.png"
  artwork: string;      // Same as sprite
  selected_moves?: string[];  // Move IDs from database
  move_pp?: Record<string, number>;  // PP values from database
}
```

### Heal Response

```typescript
interface HealResponse {
  success: true;
  data: {
    healed: PartyPokemon[];
    healed_count: number;
    message: string;
  }
}
```

---

## State Transitions

### Pokemon Health State

```
[Healthy] ----battle damage----> [Damaged] ----heal----> [Healthy]
    ^                               |
    |                               v
    +-------<-------------------[Fainted]
                   heal
```

**Health States**:
- **Healthy**: current_hp == max_hp AND all move_pp == max_pp
- **Damaged**: current_hp < max_hp OR any move_pp < max_pp
- **Fainted**: current_hp == 0

### Heal Action

**Preconditions**:
- User is authenticated
- User has at least one active Pokemon
- At least one Pokemon is damaged or has reduced PP

**Postconditions**:
- All active Pokemon: current_hp = max_hp
- All move PP restored to maximum values
- GameContext party data refreshed

---

## Derived State (Frontend)

### Needs Healing Calculation

```javascript
const needsHealing = party.some(pokemon =>
  pokemon.current_hp < pokemon.max_hp
);
```

### HP Bar Color

```javascript
const hpPercentage = (current_hp / max_hp) * 100;
const color =
  hpPercentage > 50 ? 'green' :
  hpPercentage > 25 ? 'yellow' :
  'red';
```

### Fainted Status

```javascript
const isFainted = pokemon.current_hp === 0;
```

---

## Validation Rules

| Rule | Entity | Description |
|------|--------|-------------|
| VR-001 | Party | Maximum 6 active Pokemon |
| VR-002 | HP | current_hp cannot exceed max_hp |
| VR-003 | HP | current_hp cannot be negative |
| VR-004 | Slot | Active Pokemon must have slot_number 1-6 |
| VR-005 | PP | Move PP cannot exceed move's max PP from Source |

---

## No New Database Changes Required

The Pokemon Center page operates entirely on existing:
- `player_pokemon` table (party data with HP and PP)
- `users` table (authentication)
- POST `/api/heal` endpoint
- GET `/api/player/pokemon` endpoint
