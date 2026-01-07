# Data Model: Movement Test Harness

**Date**: 2026-01-06
**Branch**: `023-movement-test-harness`

## Overview

The movement test harness extends the existing combat test harness data model with position tracking and grid state. All data structures are JavaScript objects managed through React state, building on existing patterns from `021-combat-test-harness`.

## Entities

### GridState (Extended from battleState.js)

Visual grid state for the test harness.

```javascript
{
  cells: GridCell[][],           // 10x10 array of cells
  highlightedCells: {            // Currently highlighted cells
    movement: Set<string>,       // Set of "A1" notations for valid move targets
    attack: Set<string>,         // Set of notations for valid attack targets
    selected: string | null      // Currently selected cell notation
  },
  selectedPokemon: string | null, // combatant_id of selected Pokemon
  selectedMove: string | null,    // move_id for range display
  mode: 'view' | 'move' | 'attack'  // Current interaction mode
}
```

### GridCell (From gridUtils.js initializeGrid)

Individual cell in the battle grid.

```javascript
{
  position: {
    col: number,               // 0-9
    row: number                // 0-9
  },
  notation: string,            // "A1" through "J10"
  occupant_type: 'empty' | 'pokemon' | 'trainer',
  occupant_id: string | null,  // combatant_id or trainer identifier
  is_deployment_zone: boolean, // True for rows 0-1 (player) or 8-9 (opponent)
  is_highlighted: boolean,     // Whether cell should show highlight
  highlight_type: 'move' | 'attack' | 'selected' | null
}
```

### MovementState (New)

Per-combatant movement tracking state for the current turn.

```javascript
{
  combatant_id: string,
  walking_speed: number,        // Total speed in cells (e.g., 6 for 30ft)
  movement_remaining: number,   // Cells remaining this turn
  has_moved_this_turn: boolean, // Whether any movement taken
  position: {
    col: number,
    row: number
  },
  valid_targets: Array<{        // Pre-calculated valid move destinations
    col: number,
    row: number,
    notation: string,
    distance: number
  }>
}
```

### TestCombatant (Extended)

Extends existing TestCombatant from `021-combat-test-harness` with position.

```javascript
{
  // ... all existing TestCombatant properties ...

  // Movement properties (from battleEngine.js buildCombatant):
  walking_speed: number,        // Speed in cells
  movement_remaining: number,   // Remaining this turn
  has_moved_this_turn: boolean,

  // Position properties (new for grid display):
  position: {
    col: number,
    row: number
  } | null,                     // null until placed on grid

  // For range display:
  known_moves: Array<{
    id: string,
    name: string,
    range: number | null,       // Range in feet, null for melee
    type: string
  }>
}
```

### MovementLogEntry (New)

Log entry for movement actions.

```javascript
{
  turn_number: number,
  timestamp: number,
  type: 'movement',
  actor: string,                // Pokemon name
  target: null,                 // No target for movement
  details: {
    from_position: {
      col: number,
      row: number,
      notation: string
    },
    to_position: {
      col: number,
      row: number,
      notation: string
    },
    distance_moved: number,     // Cells traveled
    movement_before: number,    // movement_remaining before move
    movement_after: number      // movement_remaining after move
  },
  formatted_message: string
}
```

### RangeDisplayState (New)

State for showing move attack range.

```javascript
{
  active: boolean,
  move_id: string | null,
  attacker_position: {
    col: number,
    row: number
  } | null,
  range_cells: number,          // Range in cells
  valid_targets: Array<{        // Opponent cells in range
    combatant_id: string,
    name: string,
    position: {
      col: number,
      row: number
    },
    notation: string,
    distance: number
  }>,
  all_cells_in_range: Array<{   // All cells in range (for highlight)
    col: number,
    row: number,
    notation: string
  }>
}
```

## State Transitions

### Grid Interaction States

```
VIEW_MODE → MOVE_MODE → EXECUTING_MOVE → VIEW_MODE
         ↘ ATTACK_MODE → VIEW_MODE
```

**VIEW_MODE**: Default state, grid shows positions only
**MOVE_MODE**: Pokemon selected, showing valid move targets
**ATTACK_MODE**: Move selected, showing attack range
**EXECUTING_MOVE**: Processing movement (brief transition state)

### Movement Flow

1. **Select Pokemon**
   - User clicks Pokemon on grid
   - Calculate valid move targets via `getValidMoveTargets()`
   - Highlight valid cells
   - Show movement stats in MovementPanel

2. **Execute Movement**
   - User clicks valid destination cell
   - Call `updateCombatantPosition()` from battleState.js
   - Update `movement_remaining` (subtract distance)
   - Set `has_moved_this_turn = true`
   - Log movement to battle log
   - Clear highlights, return to VIEW_MODE

3. **Cancel Movement**
   - User clicks elsewhere or presses Escape
   - Clear highlights, return to VIEW_MODE

### Round Reset

When a new round begins:
- Reset `movement_remaining = walking_speed` for all combatants
- Reset `has_moved_this_turn = false` for all combatants
- Log round start to battle log

## Validation Rules

### Movement Validation

- `movement_remaining` must be >= distance to target
- Target cell must not be occupied
- Pokemon must not have `has_moved_this_turn = true`
- Target must be within grid bounds (0-9, 0-9)

### Range Validation

- Move must have a valid range value
- Target must be within range distance (Manhattan)
- Target must be an opponent (not self or ally)
- Target must have HP > 0

### Position Validation

- Initial positions must be in deployment zones
- Player Pokemon: rows 0-1
- Opponent Pokemon: rows 8-9
- No two Pokemon can occupy same cell

## Integration with Existing Models

This data model extends, not replaces, the existing models:

| Existing Model | Integration |
|----------------|-------------|
| `TestCombatant` (021) | Add position, walking_speed properties |
| `CombatLogEntry` (021) | Add 'movement' type |
| `SimulationConfig` (021) | Add optional initial positions |
| `battleState.js` | Use grid and position update functions |
| `gridUtils.js` | Use all coordinate and range utilities |
