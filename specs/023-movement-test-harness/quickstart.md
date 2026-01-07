# Quickstart: Movement Test Harness

**Date**: 2026-01-06
**Branch**: `023-movement-test-harness`

## Prerequisites

- Node.js 18+
- Existing combat test harness from feature 021 (`pages/test-combat.js`)
- Source Pokemon data files

## Quick Test

1. Start development server:
   ```bash
   npm run dev
   ```

2. Navigate to test page:
   ```
   http://localhost:3000/test-combat
   ```

3. Select two Pokemon and start a battle

4. Use the new grid panel to:
   - View Pokemon positions on 10x10 grid
   - Click a Pokemon to see valid move targets (green highlights)
   - Click a highlighted cell to move the Pokemon
   - Select a move to see attack range (red highlights)

## New Features

### Battle Grid

The grid displays:
- Pokemon positions (green = player, red = opponent)
- Grid coordinates (A-J columns, 1-10 rows)
- Movement range highlights
- Attack range highlights

### Movement Controls

In the left panel, new movement section shows:
- Walking speed (cells and feet)
- Remaining movement this turn
- "Move Pokemon" button to enter movement mode

### Range Display

When a move is selected:
- Red overlay shows all cells in range
- Bright border on cells with valid targets
- Range info displayed in stats panel

## Key Files Modified

| File | Changes |
|------|---------|
| `pages/test-combat.js` | Add grid integration, movement state |
| `lib/combatSimulator.js` | Add position initialization |
| `components/TestCombat/BattleLog.js` | Add movement log formatting |
| `components/TestCombat/MovementPanel.js` | Add movement stats and controls |

## Key Files Added

| File | Purpose |
|------|---------|
| `components/TestCombat/BattleGrid.js` | 10x10 visual grid |
| `components/TestCombat/GridCell.js` | Individual cell component |
| `components/TestCombat/MovementPanel.js` | Movement stats display |
| `components/TestCombat/RangeIndicator.js` | Attack range overlay |

## Testing Movement

1. **Basic Movement**:
   - Start battle
   - Click Pokemon on grid
   - Observe green highlighted cells (valid destinations)
   - Click destination to move
   - Verify battle log shows movement entry

2. **Movement Limits**:
   - Move Pokemon partially (e.g., 3 cells with 6 speed)
   - Verify remaining movement shows 3/6
   - Attempt to move again
   - Verify can only move up to 3 more cells

3. **Occupied Cells**:
   - Try to move to opponent's cell
   - Verify move is blocked

4. **Range Display**:
   - Select a move from Pokemon's move list
   - Observe red highlighted cells showing range
   - Verify opponent in range shows bright border

## Existing Utilities Used

From `lib/gridUtils.js`:
- `toGridNotation()` / `fromGridNotation()` - Coordinate conversion
- `getManhattanDistance()` - Distance calculation
- `getValidMoveTargets()` - Valid move destinations
- `getCellsInRange()` - Cells within attack range
- `initializeGrid()` - Grid initialization

From `lib/battleEngine.js`:
- `buildCombatant()` - Includes `walking_speed`, `movement_remaining`

From `lib/battleState.js`:
- `updateCombatantPosition()` - Position state management
