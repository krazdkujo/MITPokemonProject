# Research Document: Combat Arena Page

**Feature Branch**: `015-combat-arena`
**Created**: 2026-01-04
**Status**: Complete

## Research Summary

This document resolves all technical unknowns identified during planning for the Combat Arena feature. Each section documents the decision, rationale, and alternatives considered.

---

## R1: Grid Coordinate System Design

**Decision**: Use column-first notation (e.g., "A5") with columns A-J (left-to-right) and rows 1-10 (top-to-bottom). Internal representation uses zero-indexed `{col: 0-9, row: 0-9}` objects.

**Rationale**: Chess-style coordinate notation (A1-J10) is familiar to players. Zero-indexed internal representation simplifies array operations and grid calculations.

**Alternatives Considered**:
- Zero-indexed string coordinates ("0,0" to "9,9"): Less readable, unfamiliar to players
- Row-first notation (e.g., "5A"): Non-standard, confusing
- Pixel-based positioning: Over-engineered for turn-based grid game

**Implementation Details**:
```javascript
// Grid coordinate utilities (lib/gridUtils.js)
const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

function toGridNotation(col, row) {
  return `${COLUMNS[col]}${row + 1}`;
}

function fromGridNotation(notation) {
  const col = COLUMNS.indexOf(notation[0].toUpperCase());
  const row = parseInt(notation.slice(1), 10) - 1;
  return { col, row };
}
```

---

## R2: Battle State Management Approach

**Decision**: Client-side React state with server synchronization on each action. Use `useState` with a centralized battle state object. Server validates all actions and returns authoritative state.

**Rationale**: Constitution mandates server-side state management to prevent cheating (V. Serverless Architecture). Client state provides responsive UI while server state remains authoritative.

**Alternatives Considered**:
- Full server-side rendering: High latency, poor UX for real-time combat
- WebSocket live sync: Over-engineered for turn-based system, incompatible with Vercel serverless
- Redux/Zustand: Additional dependency not justified for single-page state

**State Structure**:
```javascript
const battleState = {
  battle_id: string,
  phase: 'setup' | 'combat' | 'ended',
  grid: Array<Array<GridCell>>,  // 10x10 grid of cells
  combatants: {
    player: Array<Combatant>,    // Player's Pokemon with positions
    opponent: Array<Combatant>   // Enemy Pokemon with positions
  },
  trainers: {
    player: { position: { col: 0, row: 4 } },    // A5
    opponent: { position: { col: 9, row: 4 } }   // J5
  },
  initiative_order: Array<string>,  // combatant_ids in turn order
  current_turn_index: number,
  round_number: number,
  selected: {
    pokemon: string | null,      // combatant_id
    move: string | null,         // move_id
    action: 'attack' | 'move' | 'catch' | 'flee' | null
  },
  battle_log: Array<LogEntry>,
  outcome: 'ongoing' | 'victory' | 'defeat' | 'fled'
};
```

---

## R3: Deployment Zone and Placement Rules

**Decision**: Player deployment zone is rows 1-2 (grid rows 0-1). Enemy deployment zone is rows 9-10 (grid rows 8-9). Maximum 6 Pokemon per side (party limit).

**Rationale**: Two rows provide strategic placement options while keeping enemies at a meaningful distance. Matches Pokemon 5e tabletop conventions for tactical combat.

**Placement Rules**:
1. During setup phase, player clicks party Pokemon then clicks valid grid square
2. Valid squares are rows 1-2, excluding occupied squares
3. Player must place at least 1 Pokemon to start combat
4. Enemy Pokemon are auto-placed in rows 9-10 based on encounter data

**Visual Feedback**:
- Deployment zone squares highlighted during setup phase
- Invalid placement attempts show error feedback
- Placed Pokemon display sprite + HP bar immediately

---

## R4: Move Range and Targeting System

**Decision**: All moves have unlimited range for initial implementation. Targeting highlights all enemy Pokemon when attack is selected.

**Rationale**: Pokemon 5e source data does not consistently specify move ranges. Implementing range calculations would require significant Source data augmentation. Unlimited range provides functional combat while range can be added in future iteration.

**Alternatives Considered**:
- Grid-based range calculation: Requires move-by-move range data not in Source
- Melee vs ranged categories: Partially supported but inconsistent in Source
- Line-of-sight calculations: Over-engineered for initial MVP

**Targeting Flow**:
1. Player selects owned Pokemon
2. Player selects "Attack" action
3. Player selects move from MoveSelector
4. All valid targets (enemy Pokemon with HP > 0) are highlighted
5. Player clicks target to execute attack

---

## R5: Movement System Design

**Decision**: Pokemon can move up to 6 squares (30 feet in D&D 5e terms) per turn as a movement action. Movement is orthogonal only (no diagonal).

**Rationale**: Standard D&D 5e movement rules for medium creatures. Orthogonal movement simplifies distance calculation and matches chess-like expectations.

**Movement Rules**:
1. Movement action is separate from attack action
2. Can move before or after attacking (but not split)
3. Cannot move through occupied squares
4. Cannot move through trainer squares
5. Movement highlights valid destination squares within range

**Distance Calculation**:
```javascript
function getManhattanDistance(pos1, pos2) {
  return Math.abs(pos1.col - pos2.col) + Math.abs(pos1.row - pos2.row);
}

function getValidMoveSquares(position, maxDistance, occupiedSquares) {
  const valid = [];
  for (let col = 0; col < 10; col++) {
    for (let row = 0; row < 10; row++) {
      const distance = getManhattanDistance(position, { col, row });
      if (distance > 0 && distance <= maxDistance && !isOccupied(col, row, occupiedSquares)) {
        valid.push({ col, row });
      }
    }
  }
  return valid;
}
```

---

## R6: Initiative and Turn Order Display

**Decision**: Use existing `lib/initiativeUtils.js` for initiative rolls. Display turn order as horizontal list of Pokemon portraits, with current actor highlighted.

**Rationale**: Existing initiative system follows Pokemon 5e rules (d20 + DEX modifier). Horizontal portrait display is familiar from RPG games and provides quick visual reference.

**Turn Order Implementation**:
- Initiative rolled at battle start via `/api/battle/start`
- TurnIndicator component shows all combatants sorted by initiative
- Current turn highlighted with border/glow effect
- Fainted Pokemon shown greyed out in order

---

## R7: Damage Animation and Visual Feedback

**Decision**: Use CSS animations for damage numbers (float up and fade), HP bar transitions (smooth width decrease), and status effect icons (pulse on apply).

**Rationale**: CSS animations are performant, require no additional dependencies, and work across all browsers. React state updates trigger re-renders that apply animation classes.

**Animation Specifications**:
- Damage number: Red text, float up 30px over 1s, fade out
- Critical hit: Larger font, "CRITICAL!" prefix
- HP bar: 0.5s width transition, color changes at 50% (yellow) and 25% (red)
- Status icon: Pulse animation on apply, steady display while active
- Faint: 1s fade to grayscale, then remove from grid

**CSS Example**:
```css
.damage-number {
  animation: floatUp 1s ease-out forwards;
}

@keyframes floatUp {
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-30px); }
}
```

---

## R8: Status Effect Visualization

**Decision**: Status effects displayed as small icon badges on PokemonToken component. Use simple colored circles with abbreviations (PSN, BRN, PAR, SLP, FRZ, CNF).

**Rationale**: Status effect system already implemented in `lib/statusEffects.js`. Icon badges provide at-a-glance status awareness without cluttering the grid.

**Status Icon Mapping**:
| Status | Abbreviation | Color |
|--------|--------------|-------|
| POISONED | PSN | Purple |
| BURNED | BRN | Orange |
| PARALYZED | PAR | Yellow |
| ASLEEP | SLP | Gray |
| FROZEN | FRZ | Cyan |
| CONFUSED | CNF | Pink |
| BADLY_POISONED | TOX | Dark Purple |
| FLINCHED | FLN | White |

---

## R9: Battle Log Format

**Decision**: Scrollable text log with structured entries. Each entry includes timestamp, actor, action, target, and result. Auto-scroll to latest entry.

**Rationale**: Text-based log is familiar from Pokemon games and provides permanent record of battle events for strategic review.

**Log Entry Structure**:
```javascript
{
  id: string,
  timestamp: Date,
  type: 'attack' | 'damage' | 'faint' | 'status' | 'catch' | 'flee' | 'turn_start',
  actor: string,           // Pokemon name
  target?: string,         // Target Pokemon name
  move?: string,           // Move name
  result: string,          // Human-readable result
  details: {
    roll?: number,
    damage?: number,
    hit?: boolean,
    critical?: boolean,
    effectiveness?: string
  }
}
```

**Example Entries**:
- "Bulbasaur used Tackle on Rattata - Hit! 12 damage (super effective)"
- "Rattata used Quick Attack on Bulbasaur - Critical hit! 18 damage"
- "Rattata fainted!"
- "Bulbasaur was poisoned!"

---

## R10: API Endpoint Design for Grid Actions

**Decision**: Extend existing `/api/battle/` namespace with new endpoints for grid-specific actions. Battle state passed in request body (stateless serverless requirement).

**Rationale**: Constitution requires serverless architecture (V). Passing battle state in request body allows stateless validation. Existing pattern from `/api/battle/start` and `/api/battle/catch`.

**New Endpoints**:

### POST /api/battle/action
Execute any battle action (attack, move, use item)
```javascript
Request: {
  battle_id: string,
  battle_state: object,     // Current client state
  action_type: 'attack' | 'move' | 'item',
  actor_id: string,         // combatant_id taking action
  move_id?: string,         // For attack actions
  target_id?: string,       // Target combatant_id
  target_position?: { col: number, row: number },  // For move actions
  item_id?: string          // For item actions
}

Response: {
  success: boolean,
  data: {
    action_result: object,  // Detailed action outcome
    updated_state: object,  // Authoritative battle state
    battle_continues: boolean,
    outcome?: 'victory' | 'defeat' | 'ongoing'
  }
}
```

### POST /api/battle/flee
Attempt to flee from battle
```javascript
Request: {
  battle_id: string,
  battle_state: object
}

Response: {
  success: boolean,
  data: {
    fled: boolean,
    flee_roll?: number,
    flee_threshold?: number
  }
}
```

---

## R11: Error Handling and Edge Cases

**Decision**: Follow existing apiResponse.js patterns. All errors return JSON with error code, message, and details. Battle-specific errors redirect to appropriate pages.

**Error Scenarios**:

| Scenario | Error Code | Action |
|----------|------------|--------|
| No active Pokemon | NO_ACTIVE_POKEMON | Redirect to /pokecenter |
| Pokemon fainted mid-battle | POKEMON_FAINTED | Prompt to switch or end if all fainted |
| Invalid move (no PP) | NO_PP_REMAINING | Show error, keep turn active |
| Network timeout | NETWORK_ERROR | Show retry option |
| All player Pokemon fainted | BATTLE_LOST | Show defeat screen, redirect |
| All enemy Pokemon fainted | BATTLE_WON | Show victory screen with rewards |

---

## R12: Responsive Design Considerations

**Decision**: Grid squares scale based on viewport. Minimum touch target of 44x44px on mobile. Side panel (moves, log) collapses to bottom sheet on narrow screens.

**Rationale**: Constitution emphasizes educational use - students may access on various devices. Responsive design ensures playability across screen sizes.

**Breakpoints**:
- Desktop (>1024px): Full layout with side panels
- Tablet (768-1024px): Compact side panels
- Mobile (<768px): Grid takes full width, panels become bottom sheets

---

## Dependencies Summary

**Existing (no changes)**:
- lib/battleEngine.js - Combat calculations
- lib/combatUtils.js - Attribute modifiers
- lib/statusEffects.js - Status management
- lib/initiativeUtils.js - Turn order
- lib/diceRoller.js - Random number generation
- lib/pokemonData.js - Source data access
- lib/apiResponse.js - API response helpers

**New Libraries Required**:
- None - all functionality achievable with React and existing utilities

**New Files to Create**:
- lib/gridUtils.js - Grid coordinate helpers
- lib/battleState.js - Client state management
- components/Combat/* - All combat UI components
- pages/api/battle/action.js - Grid action endpoint
- pages/api/battle/flee.js - Flee action endpoint
