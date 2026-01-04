# Data Model: Combat Arena

**Feature Branch**: `015-combat-arena`
**Created**: 2026-01-04

## Overview

The Combat Arena feature introduces grid-based positioning to the existing battle system. This document defines the data structures for grid state, combatant positions, and battle flow. Following the Two-Tier Data Model principle, all Pokemon reference data remains in Source files - only positional and state data is new.

---

## Core Entities

### GridPosition

Represents a position on the 10x10 battle grid.

| Field | Type | Description |
|-------|------|-------------|
| col | number (0-9) | Column index (A=0, J=9) |
| row | number (0-9) | Row index (1=0, 10=9) |

**Validation Rules**:
- `col` must be integer 0-9
- `row` must be integer 0-9

**Derived Properties**:
- `notation`: String representation (e.g., "A5", "J10")

---

### GridCell

Represents a single cell on the battle grid.

| Field | Type | Description |
|-------|------|-------------|
| position | GridPosition | Cell coordinates |
| occupant_type | enum | 'empty', 'pokemon', 'trainer' |
| occupant_id | string | null | combatant_id or 'player_trainer' / 'opponent_trainer' |
| is_deployment_zone | boolean | True if valid for player placement |
| is_highlighted | boolean | UI state for valid moves/targets |
| highlight_type | enum | null | null, 'move', 'attack', 'placement' |

**Invariants**:
- Only one occupant per cell
- Deployment zones are rows 0-1 (player) and rows 8-9 (enemy)
- Trainers are always at A5 (0,4) and J5 (9,4)

---

### Combatant (Extended)

Extends existing combatant from `lib/battleEngine.js` with position data.

| Field | Type | Description |
|-------|------|-------------|
| combatant_id | string (UUID) | Unique identifier |
| pokemon_id | string | Reference to Source Pokemon |
| owner | enum | 'player', 'opponent' |
| name | string | Pokemon name (from Source) |
| level | number (1-20) | Current level |
| type | string[] | Type array (from Source) |
| attributes | object | STR, DEX, CON, INT, WIS, CHA |
| ac | number | Armor Class |
| max_hp | number | Maximum HP |
| current_hp | number | Current HP |
| move_pp | object | Map of move_id to remaining PP |
| known_moves | string[] | Array of move IDs |
| abilities | string[] | Array of ability IDs |
| status_effects | StatusEffect[] | Active status conditions |
| initiative_roll | number | Initiative value |
| has_acted_this_round | boolean | Turn tracking |
| is_fainted | boolean | Faint state |
| sr | number | Species Rating |
| **position** | GridPosition | **NEW**: Grid coordinates |
| **has_moved_this_turn** | boolean | **NEW**: Movement tracking |

---

### BattleState

Complete battle state object for client and server synchronization.

| Field | Type | Description |
|-------|------|-------------|
| battle_id | string (UUID) | Unique battle identifier |
| battle_type | enum | 'wild', 'trainer', 'gym', 'pvp' |
| phase | enum | 'setup', 'combat', 'ended' |
| grid | GridCell[][] | 10x10 grid state |
| combatants | object | { player: Combatant[], opponent: Combatant[] } |
| trainers | object | { player: TrainerPosition, opponent: TrainerPosition } |
| initiative_order | string[] | combatant_ids in turn order |
| current_turn_index | number | Index into initiative_order |
| round_number | number | Current combat round |
| battle_log | LogEntry[] | Action history |
| outcome | enum | 'ongoing', 'victory', 'defeat', 'fled' |
| started_at | string (ISO) | Battle start timestamp |

**State Transitions**:
```
setup --> combat (when player confirms placement)
combat --> ended (when one side has no Pokemon remaining)
combat --> ended (when flee succeeds)
```

---

### TrainerPosition

Static trainer position data.

| Field | Type | Description |
|-------|------|-------------|
| position | GridPosition | Grid coordinates |
| sprite_id | string | Trainer sprite reference |

**Fixed Positions**:
- Player trainer: { col: 0, row: 4 } (A5)
- Opponent trainer: { col: 9, row: 4 } (J5)

---

### LogEntry

Battle log entry for action history.

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Unique entry ID |
| timestamp | string (ISO) | When action occurred |
| type | enum | 'attack', 'damage', 'faint', 'status', 'catch', 'flee', 'move', 'turn_start', 'round_start' |
| actor | string | Acting Pokemon name |
| target | string | null | Target Pokemon name |
| move | string | null | Move name (for attacks) |
| result | string | Human-readable result text |
| details | object | Type-specific details |

**Detail Fields by Type**:
- attack: { roll, modifier, total, hit, target_ac }
- damage: { dice, base, final, effectiveness, critical }
- status: { status_type, applied, blocked_reason }
- catch: { pokeball, roll, threshold, success }
- move: { from, to, distance }

---

### ActionRequest

Request payload for battle actions.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| battle_id | string | Yes | Battle identifier |
| battle_state | BattleState | Yes | Current battle state |
| action_type | enum | Yes | 'attack', 'move', 'item', 'catch', 'flee' |
| actor_id | string | Yes* | combatant_id performing action |
| move_id | string | For attack | Move to use |
| target_id | string | For attack | Target combatant_id |
| target_position | GridPosition | For move | Destination cell |
| item_id | string | For item | Item to use |

*Required except for 'flee' action.

---

### ActionResult

Response payload for battle actions.

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Whether action succeeded |
| action_type | string | Echo of requested action |
| actor | object | Acting combatant summary |
| target | object | null | Target combatant summary |
| details | object | Action-specific result data |
| state_changes | object | HP/status/position changes |
| battle_continues | boolean | Whether battle is ongoing |
| outcome | string | null | 'victory', 'defeat', 'fled' if ended |
| next_turn | string | null | Next combatant_id to act |

---

## Relationships

```
BattleState
├── grid: GridCell[10][10]
│   └── occupant --> Combatant (by combatant_id)
├── combatants
│   ├── player: Combatant[]
│   │   └── pokemon_id --> Source/pokemon/pokemon.json
│   └── opponent: Combatant[]
│       └── pokemon_id --> Source/pokemon/pokemon.json
├── initiative_order: combatant_id[]
└── battle_log: LogEntry[]
```

---

## State Validation Rules

### Setup Phase
1. Player must place at least 1 Pokemon before starting combat
2. Player can place up to 6 Pokemon (party limit)
3. Pokemon can only be placed in rows 1-2 (indices 0-1)
4. Each cell can hold at most 1 Pokemon
5. Trainers are immovable

### Combat Phase
1. Only the current turn combatant can act
2. Each combatant gets one action per turn (attack OR move)
3. Movement limited to 6 squares (Manhattan distance)
4. Cannot move through occupied cells
5. Attack requires valid target (opponent with HP > 0)
6. Attack requires PP > 0 for selected move
7. Catch only available for wild battle_type
8. Flee check uses relative speed stats

### Ended Phase
1. No actions allowed
2. Victory: all opponent Pokemon fainted
3. Defeat: all player Pokemon fainted
4. Fled: flee action succeeded

---

## Database Impact

**No new tables required.** The Combat Arena feature uses:

1. **Existing `player_pokemon` table** - For loading player's party
2. **Source files** - For Pokemon stats, moves, abilities
3. **Client-side state** - For real-time battle grid
4. **Request/response payloads** - For server validation

Per Constitution Principle I (Two-Tier Data Model), battle state is transient and not persisted to database. Only outcomes that affect player data (HP after battle, XP gained, Pokemon caught) are persisted through existing APIs:
- `/api/heal` - Restore HP
- `/api/player/pokemon` - Update after battle
- `/api/battle/catch` - Add caught Pokemon

---

## Type Definitions (TypeScript-style)

```typescript
type GridPosition = {
  col: number;  // 0-9
  row: number;  // 0-9
};

type OccupantType = 'empty' | 'pokemon' | 'trainer';
type HighlightType = 'move' | 'attack' | 'placement' | null;
type BattlePhase = 'setup' | 'combat' | 'ended';
type BattleType = 'wild' | 'trainer' | 'gym' | 'pvp';
type BattleOutcome = 'ongoing' | 'victory' | 'defeat' | 'fled';
type ActionType = 'attack' | 'move' | 'item' | 'catch' | 'flee';
type LogType = 'attack' | 'damage' | 'faint' | 'status' | 'catch' | 'flee' | 'move' | 'turn_start' | 'round_start';

type StatusType =
  | 'ASLEEP'
  | 'BURNED'
  | 'FROZEN'
  | 'PARALYZED'
  | 'POISONED'
  | 'BADLY_POISONED'
  | 'CONFUSED'
  | 'FLINCHED';
```
