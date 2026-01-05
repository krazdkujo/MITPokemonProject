# Data Model: Pokemon 5e Combat System

**Feature**: 017-5e-combat-research
**Date**: 2026-01-04

## Overview

This document defines the data model for the complete Pokemon 5e combat system. Following the Two-Tier Data Model principle, all reference data (moves, abilities, rules) comes from Source/ files, while the database stores only user-specific state.

## Entity Definitions

### 1. Battle State (Database: active_battles)

Represents an active battle session.

```typescript
interface BattleState {
  // Identity
  id: string;                    // UUID
  user_id: string;               // FK to users table

  // Battle Configuration
  format: '1v1' | '2v2';         // Battle format (1v1 initially)
  weather: WeatherType | null;   // Current weather condition
  terrain: TerrainType | null;   // Current terrain effect
  turn_number: number;           // Current turn count

  // Combatants (JSONB)
  player_combatants: Combatant[];   // Player's active Pokemon
  enemy_combatants: Combatant[];    // Enemy Pokemon (wild or trainer)

  // Turn Management
  initiative_order: InitiativeEntry[];  // Sorted by roll
  current_turn_index: number;           // Who's acting now

  // Battle Log
  battle_log: BattleLogEntry[];   // Action history

  // Metadata
  status: 'active' | 'victory' | 'defeat' | 'fled' | 'caught';
  started_at: timestamp;
  ended_at: timestamp | null;
}
```

### 2. Combatant (Embedded in BattleState)

Represents a Pokemon in combat with all runtime state.

```typescript
interface Combatant {
  // Identity
  id: string;                      // Unique combatant ID for this battle
  pokemon_id: string;              // Reference to Source/pokemon
  player_pokemon_id: string | null; // FK to player_pokemon (null for wild)

  // Position (Grid)
  position: {
    x: number;                     // 0-9 (10x10 grid)
    y: number;                     // 0-9
  };
  side: 'player' | 'enemy';

  // Attributes (copied at battle start, may be modified)
  attributes: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };

  // Combat Stats
  level: number;
  current_hp: number;
  max_hp: number;
  ac: number;
  speed: number;                   // Movement in feet (convert to cells)

  // Moves (with PP tracking)
  moves: CombatMove[];

  // Status
  status: NonVolatileStatus | null;
  volatile_statuses: VolatileStatus[];
  status_metadata: {
    [status: string]: {
      rounds_remaining?: number;
      applier_proficiency?: number;  // For Frozen DC
      source_combatant_id?: string;
    }
  };

  // Concentration
  concentrating_on: string | null;  // Move ID if concentrating

  // Transformation
  transformation: TransformationState | null;

  // Bond
  bond_level: number;               // -3 to +3
  bond_points_remaining: number;    // Current available BP

  // Ability
  ability_id: string;               // Reference to Source/abilities

  // Types (may change with Terastallization)
  types: string[];                  // Current types
  original_types: string[];         // Base types (for STAB with Tera)
  tera_type: string | null;         // If terastallized

  // Flags
  can_act: boolean;                 // False if newly sent out
  has_reaction: boolean;            // Reset each round
  movement_remaining: number;       // In feet
}
```

### 3. Combat Move (Embedded in Combatant)

Runtime state for a move in combat.

```typescript
interface CombatMove {
  move_id: string;           // Reference to Source/moves
  current_pp: number;        // Remaining uses
  max_pp: number;            // Maximum uses
}
```

### 4. Initiative Entry

Turn order tracking.

```typescript
interface InitiativeEntry {
  combatant_id: string;
  initiative_roll: number;   // d20 + DEX mod
  dex_modifier: number;      // For tiebreaker
}
```

### 5. Battle Log Entry

Action history for replay and debugging.

```typescript
interface BattleLogEntry {
  turn: number;
  timestamp: timestamp;
  actor_id: string;          // Combatant who acted
  action_type: 'move' | 'switch' | 'item' | 'catch' | 'flee';
  action_data: {
    move_id?: string;
    target_ids?: string[];
    roll?: number;
    damage?: number;
    effects?: string[];
  };
  result: 'success' | 'miss' | 'fail' | 'critical';
  narrative: string;         // Human-readable description
}
```

### 6. Weather State

```typescript
type WeatherType =
  | 'harsh-sunlight'
  | 'rain'
  | 'sandstorm'
  | 'hail'
  | 'snow'
  | 'fog';

interface WeatherState {
  type: WeatherType;
  turns_remaining: number | null;  // null = indefinite
  source: 'environment' | 'move';  // Move-triggered may have extra effects
}
```

### 7. Terrain State

```typescript
type TerrainType =
  | 'electric'
  | 'grassy'
  | 'misty'
  | 'psychic';

interface TerrainState {
  type: TerrainType;
  turns_remaining: number;
  affected_cells: Position[];  // Which grid cells have terrain
}
```

### 8. Status Types

```typescript
type NonVolatileStatus =
  | 'burned'
  | 'frozen'
  | 'paralyzed'
  | 'poisoned'
  | 'badly-poisoned';

type VolatileStatus =
  | 'asleep'
  | 'confused'
  | 'flinched';

interface StatusState {
  type: NonVolatileStatus | VolatileStatus;
  rounds_remaining?: number;     // For volatile
  applier_proficiency?: number;  // For Frozen DC
  grace_until_turn?: number;     // Immunity after recovery
}
```

### 9. Transformation State

```typescript
interface TransformationState {
  type: 'mega' | 'z-move' | 'dynamax' | 'terastallization';

  // Mega Evolution
  mega_form_id?: string;         // Reference to mega stat block

  // Dynamax
  temporary_hp?: number;
  original_size?: string;

  // Terastallization
  tera_type?: string;
  original_stab_types?: string[];

  // Z-Move (one-time use)
  z_move_used?: boolean;

  // Common
  turns_remaining?: number;
}
```

### 10. Catch Attempt (Transient)

```typescript
interface CatchAttempt {
  target_combatant_id: string;
  pokeball_id: string;           // Reference to Source/items

  // DC Calculation
  base_dc: number;               // 10 + SR + Level
  hp_modifier: number;           // -5 or -10
  pokeball_modifier: number;     // From pokeball type
  final_dc: number;

  // Roll
  roll: number;                  // Animal Handling check
  has_advantage: boolean;        // From status conditions

  // Result
  success: boolean;
}
```

## Database Schema Updates

### active_battles Table (Existing - Modify)

```sql
ALTER TABLE active_battles ADD COLUMN IF NOT EXISTS
  weather JSONB DEFAULT NULL,
  terrain JSONB DEFAULT NULL,
  format VARCHAR(10) DEFAULT '1v1';

-- Ensure combatant structure supports new fields
-- (handled via JSONB schema validation in application layer)
```

### player_pokemon Table (Existing - Verify)

No schema changes needed. Existing fields support:
- `current_hp`, `max_hp` - HP tracking
- `selected_moves` - Move IDs array
- `pp_current` - PP tracking (if exists, else add)

```sql
-- Add PP tracking if not exists
ALTER TABLE player_pokemon ADD COLUMN IF NOT EXISTS
  move_pp JSONB DEFAULT '{}';  -- { "move_id": current_pp }

-- Add bond level if not exists
ALTER TABLE player_pokemon ADD COLUMN IF NOT EXISTS
  bond_level INTEGER DEFAULT 0 CHECK (bond_level >= -3 AND bond_level <= 3);
```

## State Transitions

### Battle Lifecycle

```
[Start] --> active --> victory
                  \--> defeat
                  \--> fled
                  \--> caught
```

### Combatant Turn Flow

```
[Turn Start]
  |
  v
Check Paralysis (d4 = 1?) --> Skip Turn
  |
  v
Check Sleep (d20 >= 11?) --> Wake Up
  |
  v
Check Confusion (d8 roll) --> Modified Behavior
  |
  v
[Actions Available]
  - Move (costs PP)
  - Switch (action + bonus)
  - Use Item
  - Flee
  |
  v
[End of Turn]
  - Apply tick damage (Burn, Poison)
  - Terrain healing (Grassy)
  - Decrement status rounds
  - Check transformation duration
```

### Status Application

```
[Attempt Status]
  |
  v
Check Type Immunity --> No Effect
  |
  v
Check Grace Period --> No Effect
  |
  v
Check Existing Status (non-volatile) --> No Effect (already has one)
  |
  v
[Apply Status]
  - Record applier proficiency (for Frozen DC)
  - Set rounds remaining (volatile)
```

## Validation Rules

### Combatant Validation
- `position.x` and `position.y` must be 0-9
- `current_hp` must be >= 0 and <= `max_hp`
- `bond_level` must be -3 to +3
- `moves` array must have 1-4 entries
- Each move's `current_pp` must be >= 0 and <= `max_pp`

### Battle Validation
- `player_combatants` must have at least 1 entry
- `enemy_combatants` must have at least 1 entry
- For 1v1 format, each side has exactly 1 active combatant
- `initiative_order` must contain all combatant IDs

### Action Validation
- Move must have PP remaining (or be Struggle)
- Target must be in range (convert feet to cells: range/5)
- AoO only valid if target leaves adjacent cell without Disengage
- Catch attempt requires wild Pokemon, valid Pokeball, Pokemon not fainted

## Relationships

```
active_battles
    |
    +-- user_id --> users
    |
    +-- player_combatants[]
    |       |
    |       +-- pokemon_id --> Source/pokemon/pokemon.json
    |       +-- player_pokemon_id --> player_pokemon
    |       +-- ability_id --> Source/abilities/abilities.json
    |       +-- moves[].move_id --> Source/moves/moves.json
    |
    +-- enemy_combatants[]
            |
            +-- pokemon_id --> Source/pokemon/pokemon.json
            +-- ability_id --> Source/abilities/abilities.json
            +-- moves[].move_id --> Source/moves/moves.json
```

## Index Recommendations

```sql
-- Fast lookup of user's active battles
CREATE INDEX IF NOT EXISTS idx_active_battles_user_status
  ON active_battles(user_id, status);

-- Bond level queries for evolution requirements
CREATE INDEX IF NOT EXISTS idx_player_pokemon_bond
  ON player_pokemon(user_id, bond_level);
```
