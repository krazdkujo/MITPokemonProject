# Data Model: Combat System Enhancements

**Feature**: 018-combat-enhancements
**Date**: 2026-01-04

## Overview

This document defines the data structures for combat enhancements. Per constitution principles, no new database tables are required. All changes extend existing structures in JavaScript/JSON.

## Entity Definitions

### 1. Move (Extended)

**Source**: `Source/moves/moves.json` (read-only)
**Extension**: Runtime-computed properties via `lib/moveRanges.js`

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| id | string | Source | Unique move identifier |
| name | string | Source | Display name |
| type | string | Source | Pokemon type (grass, fire, etc.) |
| power | string[] or "none" | Source | Attributes that power the move |
| pp | number | Source | Maximum power points |
| range | string | Source | Raw range string ("melee", "30ft", "self", etc.) |
| **range_cells** | number | Computed | Grid cells for targeting (0-16) |
| **range_type** | enum | Computed | "self", "melee", "ranged", "cone", "line", "radius" |
| **is_aoe** | boolean | Computed | True if affects multiple cells |

**Range Parsing Rules**:
```javascript
// lib/moveRanges.js
function parseRange(rangeString) {
  if (rangeString === "melee") return { cells: 1, type: "melee", isAoe: false };
  if (rangeString === "self") return { cells: 0, type: "self", isAoe: false };
  if (rangeString === "varies") return { cells: 6, type: "ranged", isAoe: false };

  // "Xft" pattern
  const directMatch = rangeString.match(/^(\d+)ft$/);
  if (directMatch) {
    return { cells: Math.ceil(parseInt(directMatch[1]) / 5), type: "ranged", isAoe: false };
  }

  // "self (Xft cone/line/radius)" pattern
  const aoeMatch = rangeString.match(/^self \((\d+)ft (cone|line|radius)\)$/);
  if (aoeMatch) {
    return {
      cells: Math.ceil(parseInt(aoeMatch[1]) / 5),
      type: aoeMatch[2],
      isAoe: true
    };
  }

  // Default fallback
  return { cells: 6, type: "ranged", isAoe: false };
}
```

---

### 2. Combatant (Extended)

**Source**: Built from `player_pokemon` table + Source data
**Location**: `lib/battleEngine.js` - `buildCombatant()` and `buildOpponentCombatant()`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| combatant_id | string (UUID) | Generated | Unique ID for this battle instance |
| pokemon_id | string | Required | Reference to Source pokemon ID |
| owner | "player" or "opponent" | Required | Which side owns this Pokemon |
| name | string | From Source | Display name |
| level | number | Required | Current level |
| type | string[] | From Source | Pokemon types |
| attributes | object | From Source | {str, dex, con, int, wis, cha} |
| ac | number | From Source | Armor class |
| max_hp | number | Calculated | Maximum hit points |
| current_hp | number | Required | Current hit points |
| known_moves | Move[] | Required | **Full move objects** (not IDs) |
| known_move_ids | string[] | Computed | Move IDs for quick lookup |
| move_pp | object | Required | { [move_id]: current_pp } |
| status_effects | StatusEffect[] | [] | Active status effects |
| position | {col, row} | Required | Grid position |
| initiative_roll | number | Calculated | Turn order value |
| has_acted_this_round | boolean | false | Acted in current round |
| is_fainted | boolean | false | HP <= 0 |
| **movement_remaining** | number | 6 | Cells of movement left this turn |
| **has_moved_this_turn** | boolean | false | Already moved this turn |
| abilities | string[] | From Source | Ability IDs |
| proficiency_bonus | number | Calculated | Level-based bonus |

**Validation Rules**:
- `known_moves` MUST contain full move objects with all fields
- `move_pp` MUST have an entry for each move in `known_move_ids`
- `current_hp` MUST be <= `max_hp` and >= 0
- `position.col` MUST be 0-9, `position.row` MUST be 0-9

---

### 3. BattleState (Extended)

**Storage**: `active_battles.battle_state` JSONB column
**Location**: `lib/battleState.js`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| battle_id | string (UUID) | Generated | Unique battle identifier |
| battle_type | enum | Required | "wild", "trainer", "gym", "pvp" |
| phase | enum | "setup" | "setup", "combat", "ended" |
| grid | Cell[][] | 10x10 | Grid state with occupant tracking |
| combatants | object | Required | { player: Combatant[], opponent: Combatant[] } |
| trainers | object | Fixed | { player: {position}, opponent: {position} } |
| initiative_order | string[] | Calculated | Combatant IDs in turn order |
| current_turn_index | number | 0 | Index in initiative_order |
| round_number | number | 1 | Current battle round |
| battle_log | LogEntry[] | [] | History of actions |
| outcome | enum | "ongoing" | "ongoing", "victory", "defeat", "fled" |
| weather | string or null | null | Active weather effect |
| terrain | string or null | null | Active terrain effect |
| selected | object | null | Current selection state |
| **state_hash** | string | Computed | MD5 hash for integrity |
| **last_saved_at** | ISO string | Auto | Timestamp of last save |
| **highlighted_cells** | object | {} | { movement: Cell[], targeting: Cell[] } |

**State Hash Computation**:
```javascript
function computeStateHash(state) {
  const critical = {
    combatants: state.combatants,
    initiative_order: state.initiative_order,
    current_turn_index: state.current_turn_index,
    round_number: state.round_number
  };
  return md5(JSON.stringify(critical));
}
```

---

### 4. GridCell

**Location**: `lib/gridUtils.js`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| col | number | Required | Column index (0-9) |
| row | number | Required | Row index (0-9) |
| occupant_id | string or null | null | Combatant ID if occupied |
| occupant_type | enum or null | null | "pokemon", "trainer", null |
| terrain | string or null | null | Special terrain type |
| **is_movement_target** | boolean | false | Highlighted for movement |
| **is_attack_target** | boolean | false | Highlighted for targeting |
| **is_in_aoe** | boolean | false | Within area of effect |

---

### 5. AIDecision (New)

**Location**: `lib/combatAI.js`

| Field | Type | Description |
|-------|------|-------------|
| action_type | enum | "attack", "move", "pass" |
| move_id | string or null | Move to use (if attack) |
| target_id | string or null | Target combatant ID |
| destination | {col, row} or null | Movement destination |
| score | number | Decision confidence score |
| reasoning | string[] | Debug info for logging |

**Scoring Weights**:
```javascript
const AI_WEIGHTS = {
  TYPE_ADVANTAGE_2X: 50,
  TYPE_ADVANTAGE_4X: 100,
  TYPE_DISADVANTAGE_HALF: -30,
  TYPE_DISADVANTAGE_QUARTER: -60,
  MOVE_POWER_PER_10: 1,
  STATUS_ON_HEALTHY: 20,
  STATUS_ON_STATUSED: -50,
  LOW_PP_WARNING: -10,
  TARGET_LOW_HP: 15,
  IN_RANGE: 100,
  OUT_OF_RANGE: -1000
};
```

---

### 6. PokemonTooltipData (New)

**Location**: `components/Combat/PokemonTooltip.js`

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| name | string | Combatant | Pokemon name |
| level | number | Combatant | Current level |
| current_hp | number | Combatant | Current HP |
| max_hp | number | Combatant | Maximum HP |
| types | string[] | Combatant | Pokemon types |
| ac | number | Combatant | Armor class |
| attributes | object | Combatant | All 6 attributes with modifiers |
| proficiency_bonus | number | Combatant | Level-based bonus |
| moves | MoveDisplay[] | Combatant | Moves with PP |
| status_effects | StatusDisplay[] | Combatant | Active status effects |

**MoveDisplay**:
```javascript
{
  id: string,
  name: string,
  type: string,
  current_pp: number,
  max_pp: number,
  range_cells: number,
  range_type: string
}
```

---

## State Transitions

### Movement State

```
[Turn Start]
    |
    v
movement_remaining = 6
has_moved_this_turn = false
    |
    +-- [Move Action] --> movement_remaining -= distance
    |                     has_moved_this_turn = true
    |
    +-- [Attack Action] --> has_acted_this_round = true
    |
    v
[Turn End] --> Reset for next turn
```

### Battle Phase Transitions

```
"setup" --> "combat" (all Pokemon placed, player ready)
    |
"combat" --> "ended" (all opponent or player Pokemon fainted, or flee)
    |
"ended" --> (battle removed from active_battles)
```

---

## Validation Constraints

### Combatant Validation
- `known_moves.length` must equal `Object.keys(move_pp).length`
- All `move_pp` values must be >= 0 and <= move.pp
- `position` must be within grid bounds (0-9, 0-9)
- `current_hp` must be >= 0

### Action Validation
- Attack action requires `!has_acted_this_round`
- Move action requires `movement_remaining > 0`
- Target must be within move's `range_cells` for attack
- Destination must be within `movement_remaining` for move
- Destination cell must not be occupied

### State Persistence
- All state changes trigger save to `active_battles`
- Load must verify `state_hash` matches
- Failed saves retry up to 3 times with exponential backoff
