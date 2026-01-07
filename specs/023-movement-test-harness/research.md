# Research: Movement Test Harness

**Date**: 2026-01-06
**Branch**: `023-movement-test-harness`

## Overview

Research findings for extending the combat test harness with movement and range testing capabilities. Since the project already has mature movement infrastructure, this research focuses on understanding existing code and integration patterns.

---

## Research Task 1: Existing Grid Utilities

**Question**: What grid coordinate and movement utilities already exist?

**Findings**:

The `lib/gridUtils.js` module provides comprehensive grid utilities:

| Function | Purpose | Status |
|----------|---------|--------|
| `toGridNotation(col, row)` | Convert (0,0) to "A1" | Ready to use |
| `fromGridNotation(notation)` | Convert "A1" to {col:0, row:0} | Ready to use |
| `getManhattanDistance(pos1, pos2)` | Calculate movement distance | Ready to use |
| `isValidPosition(col, row)` | Check bounds (0-9) | Ready to use |
| `getValidMoveTargets(pos, maxDist, occupied)` | Get cells within range | Ready to use |
| `initializeGrid()` | Create 10x10 grid array | Ready to use |
| `getCellsInRange(pos, range)` | Get cells for attack range | Ready to use |
| `feetToCells(feet)` / `cellsToFeet(cells)` | Unit conversion (5ft = 1 cell) | Ready to use |

**Decision**: Use all existing gridUtils.js functions without modification.

**Rationale**: Complete, well-tested utilities that match 5e Pokemon rules.

---

## Research Task 2: Existing Movement Tracking in Battle Engine

**Question**: How does the battle engine track Pokemon movement state?

**Findings**:

The `buildCombatant()` and `buildOpponentCombatant()` functions in `lib/battleEngine.js` already initialize movement properties:

```javascript
// From buildCombatant (lines 344-371):
const walkingSpeed = sourcePokemon.speed?.find(s => s.type === 'walking')?.value || 30;
const movementCells = Math.floor(walkingSpeed / 5);

return {
  // ... other properties
  walking_speed: movementCells,      // Speed in cells (e.g., 6 for 30ft)
  movement_remaining: movementCells, // Remaining movement this turn
  has_moved_this_turn: false,        // Movement flag
  // ...
};
```

**Decision**: Use existing combatant properties directly.

**Rationale**: Movement state already populated from Source Pokemon data.

---

## Research Task 3: Battle State Position Management

**Question**: How are positions updated in battle state?

**Findings**:

The `lib/battleState.js` module provides:

```javascript
// updateCombatantPosition(state, combatant_id, newPosition)
// - Clears old grid cell
// - Sets new grid cell occupant
// - Updates combatant.position
// - Sets has_moved_this_turn = true
```

The `transitionToCombat()` and `advanceRound()` functions reset movement:
```javascript
// Resets has_moved_this_turn to false for all combatants at round start
```

**Decision**: Use `updateCombatantPosition()` for movement execution.

**Rationale**: Existing function handles all position state correctly.

---

## Research Task 4: Move Range Data

**Question**: How is move range information stored and accessed?

**Findings**:

Move data in Source includes a `range` field (in feet):
- Melee moves: `range: "5"` or `range: "melee"` (1 cell)
- Ranged moves: `range: "30"`, `range: "60"`, etc.
- Some moves have unlimited range or special patterns

The `lib/gridUtils.js` function `getValidAttackTargetsInRange(pos, range, opponents)` handles range checking.

**Decision**: Parse move range to cells using `feetToCells()`, default melee to 1 cell.

**Rationale**: Consistent with existing range calculation patterns.

---

## Research Task 5: Test Combat Page Structure

**Question**: How is the existing test-combat page structured?

**Findings**:

From `pages/test-combat.js`:
- Uses React state for battle management
- Components: `PokemonSelector`, `ControlPanel`, `BattleLog`
- State: `battleState`, `simulation`, `logEntries`
- Layout: Left panel (selectors, controls, HP bars) + Right panel (log)

**Decision**: Add grid to center/right area, movement panel to left panel.

**Rationale**: Maintains existing layout patterns while adding grid visualization.

---

## Research Task 6: Initial Pokemon Placement

**Question**: Where should Pokemon be initially positioned on the grid?

**Findings**:

The 5e Pokemon rules specify deployment zones:
- Player deployment: Rows 1-2 (indices 0-1)
- Opponent deployment: Rows 9-10 (indices 8-9)
- Trainers: Fixed at A5 (player) and J5 (opponent)

Standard initial positions for 1v1:
- Player Pokemon: D2 (col 3, row 1)
- Opponent Pokemon: G9 (col 6, row 8)

**Decision**: Use standard deployment positions; allow override in test config.

**Rationale**: Follows 5e Pokemon deployment rules.

---

## Research Task 7: UI Highlighting Patterns

**Question**: How should cells be highlighted for movement and range?

**Findings**:

The existing `battleState.js` has highlighting support:
```javascript
// GridCell already has:
is_highlighted: false,
highlight_type: null  // 'move', 'attack', 'placement'
```

Color patterns in existing components:
- Movement valid: Green tint (`#4CAF50` with transparency)
- Attack valid: Red tint (`#f44336` with transparency)
- Occupied: Blue/Purple for Pokemon
- Trainer: Yellow marker

**Decision**: Use existing highlight_type patterns with CSS variables.

**Rationale**: Consistent with existing battle arena styling.

---

## Summary of Decisions

| Topic | Decision | Rationale |
|-------|----------|-----------|
| Grid utilities | Use existing gridUtils.js | Complete, well-tested |
| Movement tracking | Use existing combatant properties | Already in battleEngine.js |
| Position updates | Use updateCombatantPosition() | Handles all state correctly |
| Move range | Parse with feetToCells(), default melee=1 | Consistent patterns |
| Page structure | Add grid center, movement panel left | Extends existing layout |
| Initial placement | D2 (player), G9 (opponent) | Follows 5e deployment |
| Highlighting | Use existing highlight_type system | Consistent styling |

## Unknowns Resolved

No NEEDS CLARIFICATION items remain. All technical decisions are based on existing codebase patterns.
