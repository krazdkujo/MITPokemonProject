# Data Model: Combat Test Harness

**Date**: 2026-01-06
**Branch**: `021-combat-test-harness`

## Overview

The combat test harness operates entirely in-memory with no database persistence. All data structures are JavaScript objects managed through React state (UI) or local variables (CLI).

## Entities

### TestCombatant

A Pokemon configured for testing, derived from Source data.

```javascript
{
  combatant_id: string,       // UUID for this test instance
  pokemon_id: string,         // Source ID (e.g., "pikachu")
  name: string,               // Display name (e.g., "Pikachu")
  level: number,              // 1-20
  type: string[],             // Type array (e.g., ["Electric"])
  attributes: {               // D&D-style stats
    str: number,
    dex: number,
    con: number,
    int: number,
    wis: number,
    cha: number
  },
  ac: number,                 // Armor class
  max_hp: number,             // Maximum hit points
  current_hp: number,         // Current hit points
  known_moves: Move[],        // Array of move objects (max 4)
  move_pp: { [moveId]: number }, // PP tracking per move
  status_effects: StatusEffect[], // Active status effects
  owner: 'player' | 'opponent'    // Which side this combatant is on
}
```

### CombatLogEntry

A single log entry recording one combat event.

```javascript
{
  turn_number: number,        // Which turn this occurred
  timestamp: number,          // Date.now() for ordering
  type: 'attack' | 'damage' | 'status' | 'turn_start' | 'turn_end' | 'summary',
  actor: string,              // Pokemon name performing action
  target: string | null,      // Pokemon name receiving action
  details: {
    // For attack type:
    move_name: string,
    attack_roll: {
      natural: number,        // d20 result
      modifier: number,       // Attack bonus
      total: number,          // natural + modifier
      crit_threshold: number, // Usually 20
      is_crit: boolean,
      is_miss: boolean,       // Natural 1
      rolls: number[],        // All dice rolled (for advantage/disadvantage)
      had_advantage: boolean,
      had_disadvantage: boolean
    },
    target_ac: number,
    hit: boolean,

    // For damage type:
    damage: {
      dice_expression: string,  // e.g., "2d6"
      dice_rolls: number[],     // Individual dice results
      base_total: number,       // Sum of dice
      power_modifier: number,
      stab_bonus: number,       // 0 if no STAB
      type_multiplier: number,  // 0.25, 0.5, 1, 2, or 4
      type_effectiveness: string, // "immune", "resistant", "normal", etc.
      final_damage: number
    },
    hp_before: number,
    hp_after: number,
    fainted: boolean,

    // For status type:
    status_type: string,        // "BURNED", "POISONED", etc.
    applied: boolean,
    blocked_reason: string | null,

    // For save moves:
    save: {
      type: string,             // "DEX", "CON", etc.
      dc: number,
      roll: number,
      modifier: number,
      total: number,
      saved: boolean
    }
  },
  formatted_message: string    // Pre-formatted log line for display
}
```

### SimulationConfig

Configuration for a combat simulation run.

```javascript
{
  pokemon1: {
    id: string,               // Pokemon ID from Source
    level: number,            // 1-20, default 5
    moves: string[] | null    // Specific move IDs, or null for default
  },
  pokemon2: {
    id: string,
    level: number,
    moves: string[] | null
  },
  seed: number | null,        // RNG seed for reproducibility
  max_turns: number,          // Default 100
  auto_run: boolean,          // For UI: run automatically
  speed_ms: number            // For UI: delay between turns in auto-run (100-2000ms)
}
```

### SimulationResult

Final result after combat completes.

```javascript
{
  winner: 'player' | 'opponent' | 'draw',
  total_turns: number,
  seed_used: number,          // For reproduction
  combatant1_summary: {
    name: string,
    final_hp: number,
    max_hp: number,
    total_damage_dealt: number,
    total_damage_received: number,
    attacks_made: number,
    attacks_hit: number,
    critical_hits: number
  },
  combatant2_summary: {
    // Same structure
  },
  log: CombatLogEntry[],      // Full combat log
  duration_ms: number         // How long simulation took
}
```

## State Transitions

### Simulation Lifecycle

```
IDLE → CONFIGURING → RUNNING → COMPLETED
                  ↖          ↙
                    PAUSED (step-by-step mode)
```

**IDLE**: No simulation active, ready to configure
**CONFIGURING**: User selecting Pokemon/levels
**RUNNING**: Combat simulation in progress (auto-run mode)
**PAUSED**: Waiting for user to click "Next Turn" (step-by-step mode)
**COMPLETED**: Battle finished, showing results

### Turn Flow

Each turn follows this sequence:

1. **Start of Turn**
   - Process start-of-turn status effects
   - Check if combatant can act (paralyzed, frozen, etc.)
   - Log any status effects that trigger

2. **Action Phase**
   - AI selects move (random from available PP moves)
   - Execute attack roll or save
   - Calculate and apply damage
   - Check for status effect application
   - Log all calculations

3. **End of Turn**
   - Process end-of-turn status effects (poison damage, etc.)
   - Check for faint conditions
   - Log HP changes and status updates

4. **Victory Check**
   - If either Pokemon HP ≤ 0, battle ends
   - Log final summary

## Validation Rules

### Pokemon Selection
- `pokemon_id` must exist in Source/pokemon/pokemon.json
- `level` must be integer 1-20

### Move Selection
- If `moves` specified, each must be valid for that Pokemon at that level
- If null, use first 4 available moves from Pokemon's move list

### Combat Rules
- Minimum damage is 0 (no healing from negative damage)
- PP cannot go below 0
- HP cannot exceed max_hp or go below 0
- Maximum 100 turns to prevent infinite loops
