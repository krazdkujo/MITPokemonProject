# Component API Contracts: Movement Test Harness

**Date**: 2026-01-06
**Branch**: `023-movement-test-harness`

## Overview

This document defines the React component interfaces for the movement test harness. All components follow existing patterns from `components/TestCombat/` and integrate with the existing test-combat page.

---

## Component: `BattleGrid`

Visual 10x10 grid showing Pokemon positions and highlights.

### Props

```typescript
interface BattleGridProps {
  // Grid state
  cells: GridCell[][];              // 10x10 grid from gridUtils.initializeGrid()

  // Combatant positions
  combatants: {
    player: TestCombatant[];        // Player Pokemon with positions
    opponent: TestCombatant[];      // Opponent Pokemon with positions
  };

  // Highlighting
  highlightedCells: {
    movement: Set<string>;          // Cells valid for movement (green)
    attack: Set<string>;            // Cells valid for attack (red)
  };
  selectedCombatantId: string | null;  // Currently selected Pokemon

  // Interaction
  onCellClick: (col: number, row: number, notation: string) => void;
  onCellHover: (col: number, row: number, notation: string) => void;
  onCellLeave: () => void;

  // Display options
  showCoordinates: boolean;         // Show A-J and 1-10 labels (default: true)
  showDeploymentZones: boolean;     // Highlight deployment zones (default: false)
  disabled: boolean;                // Disable interactions (default: false)
}
```

### Events

- `onCellClick(col, row, notation)` - Fired when user clicks a cell
- `onCellHover(col, row, notation)` - Fired when mouse enters a cell
- `onCellLeave()` - Fired when mouse leaves grid

### Styling

- Grid size: Fixed 400x400px (40px per cell)
- Colors follow existing test harness theme (dark background)
- Cell backgrounds:
  - Empty: `#1a1a1a`
  - Movement highlight: `rgba(76, 175, 80, 0.3)` (green)
  - Attack highlight: `rgba(244, 67, 54, 0.3)` (red)
  - Selected: `rgba(33, 150, 243, 0.5)` (blue)
  - Pokemon (player): `#4CAF50` (green)
  - Pokemon (opponent): `#f44336` (red)

---

## Component: `GridCell`

Individual cell in the battle grid.

### Props

```typescript
interface GridCellProps {
  col: number;                      // 0-9
  row: number;                      // 0-9
  notation: string;                 // "A1" through "J10"

  // Occupant
  occupantType: 'empty' | 'pokemon' | 'trainer';
  occupantData: {
    name: string;
    owner: 'player' | 'opponent';
    spriteUrl?: string;             // Optional Pokemon sprite
  } | null;

  // Highlighting
  isHighlighted: boolean;
  highlightType: 'move' | 'attack' | 'selected' | null;
  isSelected: boolean;
  isDeploymentZone: boolean;

  // Interaction
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  disabled: boolean;
}
```

### Visual States

| State | Background | Border |
|-------|------------|--------|
| Empty | `#1a1a1a` | `#333` |
| Empty + Hovered | `#2a2a2a` | `#444` |
| Move highlight | `rgba(76, 175, 80, 0.3)` | `#4CAF50` |
| Attack highlight | `rgba(244, 67, 54, 0.3)` | `#f44336` |
| Selected | `rgba(33, 150, 243, 0.5)` | `#2196F3` |
| Player Pokemon | `#4CAF50` | `#66BB6A` |
| Opponent Pokemon | `#f44336` | `#EF5350` |
| Deployment zone | `rgba(255, 255, 255, 0.05)` | `#333` |

---

## Component: `MovementPanel`

Displays movement statistics for selected Pokemon.

### Props

```typescript
interface MovementPanelProps {
  // Selected Pokemon
  selectedCombatant: TestCombatant | null;

  // Movement state
  movementState: {
    walking_speed: number;          // Total speed in cells
    movement_remaining: number;     // Remaining this turn
    has_moved_this_turn: boolean;
    walking_speed_feet: number;     // Speed in feet (for display)
  } | null;

  // Valid targets info
  validMoveTargets: number;         // Count of valid move destinations

  // Controls
  onMoveClick: () => void;          // Enter move mode
  onCancelMove: () => void;         // Exit move mode
  moveMode: boolean;                // Currently in move mode

  // Display
  disabled: boolean;                // Disable during battle execution
}
```

### Display Format

```
┌─────────────────────────────────────────┐
│ Movement                                │
├─────────────────────────────────────────┤
│ [Pokemon Name]                          │
│ Walking Speed: 6 cells (30 ft)          │
│ Remaining: 6/6 cells                    │
│ Status: Ready to move                   │
│                                         │
│ [ Move Pokemon ]     [ Cancel ]         │
└─────────────────────────────────────────┘
```

---

## Component: `RangeIndicator`

Overlay showing attack range for a selected move.

### Props

```typescript
interface RangeIndicatorProps {
  // Move information
  selectedMove: {
    id: string;
    name: string;
    range_cells: number;            // Range in cells (melee = 1)
    type: string;                   // Move type for color coding
  } | null;

  // Attacker position
  attackerPosition: {
    col: number;
    row: number;
  } | null;

  // Valid targets
  validTargets: Array<{
    combatant_id: string;
    name: string;
    position: { col: number; row: number };
    distance: number;
  }>;

  // All cells in range (for area display)
  cellsInRange: Array<{ col: number; row: number }>;

  // Visibility
  visible: boolean;

  // Interaction
  onTargetClick: (combatant_id: string) => void;
}
```

### Display

- Light red overlay on all cells within range
- Bright red border on cells with valid targets
- Range info displayed: "Range: 6 cells (30 ft)"
- Target count: "2 targets in range"

---

## Extended Component: `ControlPanel`

Add movement mode toggle to existing control panel.

### New Props (Added to Existing)

```typescript
interface ControlPanelPropsExtension {
  // ... existing props ...

  // Movement mode controls
  showMovementControls: boolean;    // Show movement section
  movementEnabled: boolean;         // Can enter movement mode
  inMovementMode: boolean;          // Currently in movement mode
  onToggleMovement: () => void;     // Toggle movement mode

  // Range display controls
  showRangeControls: boolean;       // Show range display section
  rangeDisplayActive: boolean;      // Range overlay visible
  selectedMoveForRange: string | null;  // Move ID for range display
  onToggleRangeDisplay: () => void; // Toggle range overlay
}
```

---

## Extended Component: `BattleLog`

Add movement log entry formatting.

### New Log Entry Types

```typescript
// Add to existing log entry types:
type LogEntryType =
  | 'attack'
  | 'damage'
  | 'status'
  | 'turn_start'
  | 'turn_end'
  | 'summary'
  | 'movement'      // NEW
  | 'range_check';  // NEW

interface MovementLogEntry {
  type: 'movement';
  actor: string;
  details: {
    from_notation: string;
    to_notation: string;
    distance: number;
    movement_remaining: number;
  };
}
```

### Movement Log Format

```
▶ PIKACHU moves D2 → F4
  ├─ Distance: 4 cells (20 ft)
  └─ Movement remaining: 2/6 cells
```

---

## Integration Points

### With Existing `test-combat.js`

```javascript
// Add to state:
const [gridMode, setGridMode] = useState('view'); // 'view' | 'move' | 'attack'
const [highlightedCells, setHighlightedCells] = useState({ movement: new Set(), attack: new Set() });

// Add to layout (between left panel and right panel):
<div style={styles.centerPanel}>
  <BattleGrid
    cells={gridCells}
    combatants={simulation ? { player: [simulation.combatant1], opponent: [simulation.combatant2] } : { player: [], opponent: [] }}
    highlightedCells={highlightedCells}
    selectedCombatantId={selectedPokemon}
    onCellClick={handleCellClick}
    onCellHover={handleCellHover}
    onCellLeave={handleCellLeave}
    showCoordinates={true}
    disabled={battleState !== 'running'}
  />
</div>
```

### With Existing `combatSimulator.js`

```javascript
// Add position initialization in createSimulation():
combatant1.position = config.pokemon1.position || { col: 3, row: 1 }; // D2
combatant2.position = config.pokemon2.position || { col: 6, row: 8 }; // G9

// Add movement execution function:
export function executeMovement(simulation, combatant_id, targetPosition) {
  // Uses gridUtils.getManhattanDistance() for distance
  // Uses battleState.updateCombatantPosition() for state update
  // Returns log entry
}
```
