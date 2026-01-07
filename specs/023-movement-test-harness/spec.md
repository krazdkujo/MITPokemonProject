# Feature Specification: Movement Test Harness

**Feature Branch**: `023-movement-test-harness`
**Created**: 2026-01-06
**Status**: Draft
**Input**: User description: "Add movement to the combat test harness UI to test the movement and range systems."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Battle Grid with Positions (Priority: P1)

A developer testing the combat system wants to see a visual representation of the 10x10 battle grid showing where each Pokemon is positioned. This allows them to understand the spatial relationship between combatants before testing movement.

**Why this priority**: Without visual grid representation, developers cannot verify movement or range calculations. This is the foundational feature for all other movement testing.

**Independent Test**: Can be fully tested by starting a battle and observing that both Pokemon positions are displayed on a visual grid, delivering immediate spatial awareness.

**Acceptance Scenarios**:

1. **Given** a battle has started with two Pokemon, **When** the test harness displays, **Then** a 10x10 grid is shown with both Pokemon positioned at their initial deployment locations
2. **Given** the grid is displayed, **When** viewing a Pokemon's position, **Then** the grid cell shows the Pokemon's identifier and the cell coordinates are visible (A1-J10 notation)
3. **Given** the grid is displayed, **When** looking at empty cells, **Then** empty cells are clearly distinguishable from occupied cells

---

### User Story 2 - Execute Pokemon Movement (Priority: P1)

A developer wants to move a Pokemon to a different grid position during combat to test movement mechanics including movement range restrictions and position updates.

**Why this priority**: Movement execution is the core feature being tested. Without this, there is no way to verify the movement system works correctly.

**Independent Test**: Can be fully tested by selecting a Pokemon, clicking a valid destination cell, and confirming the Pokemon's position updates correctly on the grid.

**Acceptance Scenarios**:

1. **Given** a Pokemon is selected, **When** the developer clicks on a valid destination cell within movement range, **Then** the Pokemon moves to that cell and its position updates on the grid
2. **Given** a Pokemon has a walking speed of 30ft (6 cells), **When** movement targets are displayed, **Then** only cells within 6 Manhattan distance are highlighted as valid targets
3. **Given** a Pokemon tries to move to an occupied cell, **When** clicking that cell, **Then** the move is prevented and an appropriate message is shown
4. **Given** a Pokemon has moved this turn, **When** attempting to move again, **Then** the system indicates no movement remaining

---

### User Story 3 - View Move Range Indicators (Priority: P2)

A developer wants to see which cells are within attack range for a selected move to verify range calculations are working correctly.

**Why this priority**: Range verification is essential for testing ranged attacks, but movement testing is more fundamental.

**Independent Test**: Can be fully tested by selecting a Pokemon, choosing a move, and observing highlighted cells showing valid targets within range.

**Acceptance Scenarios**:

1. **Given** a Pokemon is selected and has a move with range 6 cells (30ft), **When** that move is selected, **Then** all cells within 6 cells Manhattan distance are highlighted as potential targets
2. **Given** a move with melee range (1 cell/5ft), **When** selected, **Then** only adjacent cells are highlighted
3. **Given** a move is selected, **When** an opponent Pokemon is within range, **Then** that opponent's cell is highlighted distinctly as a valid target

---

### User Story 4 - View Pokemon Speed Statistics (Priority: P2)

A developer wants to see each Pokemon's movement speed and remaining movement for the current turn to verify speed calculations.

**Why this priority**: Speed display helps debug movement issues but is less critical than actual movement execution.

**Independent Test**: Can be fully tested by viewing the Pokemon info panel and confirming speed values match expected values from Source data.

**Acceptance Scenarios**:

1. **Given** a battle is in progress, **When** viewing a Pokemon's stats, **Then** walking speed (in cells and feet) is displayed
2. **Given** a Pokemon has moved 3 cells, **When** viewing their stats, **Then** remaining movement shows correctly (total speed - 3)
3. **Given** a new round begins, **When** movement tracking resets, **Then** all Pokemon show full movement remaining

---

### User Story 5 - Step Through Movement Phase (Priority: P3)

A developer wants to manually step through movement phases to see turn-by-turn movement state changes for detailed debugging.

**Why this priority**: Detailed phase stepping is useful for debugging but builds upon the basic movement functionality.

**Independent Test**: Can be fully tested by using step controls to advance through movement, observing state changes logged after each step.

**Acceptance Scenarios**:

1. **Given** step-by-step mode is enabled, **When** clicking "Move" for a Pokemon, **Then** only the movement action is processed (not the full turn)
2. **Given** a Pokemon has moved, **When** viewing the battle log, **Then** a movement entry shows the from/to positions and distance moved
3. **Given** movement is stepped through, **When** reviewing logs, **Then** all movement calculations (speed, range, valid targets) are logged

---

### Edge Cases

- What happens when a Pokemon has 0 movement remaining (paralyzed/restrained)?
- How does the system handle movement at grid boundaries (A1, J10 corners)?
- What happens when trying to move through an occupied cell?
- How is difficult terrain represented and handled (if applicable)?
- What happens when a Pokemon faints during the opponent's turn while movement panel is open?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a visual 10x10 battle grid showing Pokemon positions
- **FR-002**: System MUST allow selecting a Pokemon to view its movement options
- **FR-003**: System MUST highlight valid movement targets based on Pokemon's walking speed
- **FR-004**: System MUST use Manhattan distance for movement calculations (matching gridUtils.js)
- **FR-005**: System MUST prevent movement to occupied cells
- **FR-006**: System MUST track and display movement remaining per turn for each Pokemon
- **FR-007**: System MUST reset movement remaining at the start of each new round
- **FR-008**: System MUST display move range indicators when a move is selected
- **FR-009**: System MUST log all movement actions to the battle log with from/to positions
- **FR-010**: System MUST prevent movement when a Pokemon has already moved this turn (has_moved_this_turn flag)
- **FR-011**: System MUST display Pokemon walking speed in both cells and feet (1 cell = 5 feet)
- **FR-012**: System MUST use grid notation (A1-J10) for position display and logging

### Key Entities

- **BattleGrid**: 10x10 visual grid representing the combat arena with cells that can be empty, contain Pokemon, or contain trainers
- **GridCell**: Individual cell with position (col, row), notation (A1-J10), occupant info, and highlight state
- **CombatantPosition**: Pokemon's current position, walking speed, movement remaining, and has_moved_this_turn status
- **MoveRange**: A move's effective range in cells, used to highlight valid attack targets

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can visually identify Pokemon positions on the grid within 2 seconds of battle start
- **SC-002**: Movement validation correctly enforces walking speed limits 100% of the time
- **SC-003**: Grid updates reflect position changes within 500ms of executing a move command
- **SC-004**: All movement actions are logged with complete position information (from, to, distance)
- **SC-005**: Range highlighting correctly identifies valid targets for all move range values
- **SC-006**: Test harness clearly indicates when movement is unavailable (already moved, no remaining movement)

## Assumptions

- The existing gridUtils.js library provides correct Manhattan distance calculations and grid notation conversion
- Pokemon walking speeds are stored in Source data and already loaded by buildCombatant/buildOpponentCombatant
- The combat test harness operates independently of Supabase persistence (in-memory only)
- Move ranges can be derived from move data (assuming standard 5e rules: melee = 1 cell, ranged varies by move)
- Grid coordinates follow existing convention: columns A-J (0-9), rows 1-10 (0-9 in zero-indexed form)
