# Feature Specification: Combat System Enhancements

**Feature Branch**: `018-combat-enhancements`
**Created**: 2026-01-04
**Status**: Draft
**Input**: User description: "enhance the combat functionality to include move ranges, pokemon movement ranges, AI to move and select moves for pokemon, fix the 'No PP' when selecting a move in combat, check the combat state is being properly saved in the DB's, and on hover show all pokemon stats."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Pokemon Stats on Hover (Priority: P1)

During combat, the player hovers over any Pokemon on the battle grid and sees a detailed stat panel showing all relevant combat information for that Pokemon.

**Why this priority**: Players need visibility into Pokemon stats to make informed tactical decisions. Without this information, combat feels like guessing rather than strategy.

**Independent Test**: Can be fully tested by hovering over any Pokemon during combat phase and verifying all stats are displayed. Delivers immediate value by improving player decision-making.

**Acceptance Scenarios**:

1. **Given** a combat is in progress, **When** the player hovers over a player-owned Pokemon, **Then** a tooltip/panel displays: name, level, HP (current/max), all six attributes (STR, DEX, CON, INT, WIS, CHA), AC, type(s), known moves with PP remaining, active status effects, and proficiency bonus.
2. **Given** a combat is in progress, **When** the player hovers over an opponent Pokemon, **Then** the same stat panel is displayed for the opponent Pokemon.
3. **Given** a Pokemon has status effects active, **When** hovering over that Pokemon, **Then** status effects are shown with their remaining duration or condition for removal.
4. **Given** the player moves the mouse away from the Pokemon, **When** hover ends, **Then** the stat panel disappears without obstructing gameplay.

---

### User Story 2 - Fix PP Display Bug in Move Selection (Priority: P1)

When selecting a move during combat, the move selector correctly displays the current PP remaining for each move instead of showing "No PP" or incorrect values.

**Why this priority**: This is a bug fix that directly impacts core combat functionality. Players cannot make informed move choices if PP information is incorrect.

**Independent Test**: Can be tested by entering combat, using moves to consume PP, and verifying the move selector always shows accurate PP values matching the actual remaining PP.

**Acceptance Scenarios**:

1. **Given** a Pokemon has moves with full PP, **When** the player opens the move selector, **Then** each move shows its correct PP value (e.g., "15/15 PP").
2. **Given** a Pokemon has used some PP on a move, **When** the player opens the move selector, **Then** that move shows the accurate remaining PP (e.g., "12/15 PP").
3. **Given** a Pokemon has exhausted a move's PP, **When** the player opens the move selector, **Then** that move is disabled and shows "0/X PP".
4. **Given** a Pokemon enters a new battle, **When** the player opens the move selector, **Then** PP values reflect the Pokemon's persisted PP state from the database.

---

### User Story 3 - Validate Combat State Database Persistence (Priority: P1)

Combat state is reliably saved to and loaded from the database, ensuring battles can be resumed after page refresh or disconnection.

**Why this priority**: Data integrity is critical. Lost battle progress creates frustration and undermines trust in the game.

**Independent Test**: Can be tested by starting a battle, performing actions, refreshing the page, and verifying the battle resumes with correct state including positions, HP, PP, turn order, and round number.

**Acceptance Scenarios**:

1. **Given** a battle is in progress, **When** an action is executed (attack, move, etc.), **Then** the updated battle state is saved to the database within 2 seconds.
2. **Given** a battle was interrupted (page refresh, browser close), **When** the player returns to the combat page, **Then** the battle resumes from the exact saved state.
3. **Given** a battle state is saved, **When** loaded from the database, **Then** all data matches: Pokemon positions, HP values, PP values, status effects, turn order, round number, and battle log.
4. **Given** a battle ends (victory/defeat/flee), **When** the outcome is processed, **Then** the active_battles record is properly closed/removed and Pokemon states are persisted.

---

### User Story 4 - Move Ranges on Grid (Priority: P2)

Each move has a defined range, and when selecting a move, the player can see which grid cells are valid targets based on the move's range from the acting Pokemon's position.

**Why this priority**: Adds tactical depth to combat. Players need to understand positioning requirements to use moves effectively.

**Independent Test**: Can be tested by selecting a move and verifying that only cells within the move's range are highlighted as valid targets.

**Acceptance Scenarios**:

1. **Given** a Pokemon is selected and a move is chosen, **When** the move has a range of N cells, **Then** all grid cells within N cells (Manhattan distance) of the Pokemon are highlighted as valid targets.
2. **Given** a melee move (range 1), **When** selected, **Then** only immediately adjacent cells (4 directions) are highlighted.
3. **Given** a ranged move (range > 1), **When** an enemy is beyond the move's range, **Then** that enemy cannot be targeted and the cell is not highlighted.
4. **Given** a move targets self only, **When** selected, **Then** only the acting Pokemon's cell is highlighted.
5. **Given** a Pokemon attempts to use a move, **When** the target is out of range, **Then** the action is rejected with a clear message explaining the range limitation.

---

### User Story 5 - Pokemon Movement Ranges (Priority: P2)

Each Pokemon has a movement range that limits how far it can move during its turn, displayed visually on the grid when movement is selected.

**Why this priority**: Movement is fundamental to grid-based tactical combat. Clear movement ranges enable strategic positioning.

**Independent Test**: Can be tested by selecting a Pokemon and choosing to move, then verifying movement range is displayed and movement is restricted to valid cells.

**Acceptance Scenarios**:

1. **Given** a Pokemon's turn begins, **When** the player selects the move action, **Then** all cells within the Pokemon's movement range are highlighted.
2. **Given** a Pokemon has a movement range of 6 cells (default), **When** movement is selected, **Then** cells up to 6 Manhattan distance away are highlighted as valid destinations.
3. **Given** a cell is occupied by another Pokemon or trainer, **When** that cell is within movement range, **Then** that cell is not highlighted as a valid destination (cannot move through or onto occupied cells).
4. **Given** a Pokemon has already moved this turn, **When** the player attempts to move again, **Then** the movement option is disabled or remaining movement is shown.
5. **Given** movement is confirmed, **When** the Pokemon moves to the new position, **Then** the grid updates to show the new position and remaining movement (if any) is tracked.

---

### User Story 6 - AI Move Selection and Positioning (Priority: P3)

Opponent Pokemon controlled by AI make tactical decisions about which moves to use and where to position themselves, rather than acting randomly.

**Why this priority**: Improves gameplay quality significantly, but requires move ranges and movement to be implemented first. Builds on P2 features.

**Independent Test**: Can be tested by observing AI behavior over multiple turns and verifying decisions show logical patterns (type advantages, range considerations, positioning).

**Acceptance Scenarios**:

1. **Given** an AI-controlled Pokemon's turn, **When** the AI selects a move, **Then** it prefers moves with type advantage against available targets.
2. **Given** an AI Pokemon is out of range of all targets, **When** its turn begins, **Then** it moves toward the nearest valid target before attacking.
3. **Given** an AI Pokemon has multiple move options, **When** selecting a move, **Then** it considers move power, PP availability, and status effect potential.
4. **Given** an AI Pokemon is at low HP, **When** deciding actions, **Then** it may prioritize defensive positioning or high-damage desperation attacks.
5. **Given** an AI Pokemon cannot reach any target this turn, **When** its turn executes, **Then** it moves optimally toward the closest enemy to prepare for future turns.
6. **Given** an AI Pokemon has status-inflicting moves, **When** the target has no status, **Then** the AI considers applying status effects as a tactical option.

---

### Edge Cases

- What happens when a Pokemon has 0 PP on all moves? (Use Struggle move as fallback - already implemented)
- How does move range interact with grid boundaries? (Cells outside the grid are not valid targets)
- What happens if a Pokemon is surrounded and cannot move? (Skip movement phase, proceed to attack or pass)
- How does the AI handle a situation where no moves can hit any target? (Move toward nearest target, or pass turn)
- What happens if database save fails mid-battle? (Retry mechanism with error notification to player)
- How are move ranges determined for moves without explicit range data? (Default to melee range of 1 for physical moves, range of 6 for special moves)

## Requirements *(mandatory)*

### Functional Requirements

**Stat Display:**
- **FR-001**: System MUST display a stat panel when hovering over any Pokemon on the combat grid.
- **FR-002**: The stat panel MUST show: name, level, current HP/max HP, all six attributes with modifiers, AC, type(s), proficiency bonus, known moves with current/max PP, and active status effects.
- **FR-003**: The stat panel MUST disappear when the hover ends.
- **FR-004**: The stat panel MUST be positioned to not obscure critical combat information.

**PP Fix:**
- **FR-005**: System MUST display accurate PP values in the move selector reflecting the Pokemon's current PP state.
- **FR-006**: System MUST source PP values from the persisted combatant state, not from static move data.
- **FR-007**: System MUST show PP in "current/max" format for clarity.
- **FR-008**: Moves with 0 PP MUST be visually disabled and unselectable.

**Database Persistence:**
- **FR-009**: System MUST save battle state to the database after each action.
- **FR-010**: System MUST load and restore complete battle state when a player returns to an active battle.
- **FR-011**: Persisted state MUST include: all combatant positions, HP, PP, status effects, initiative order, current turn, round number, and battle log.
- **FR-012**: System MUST handle database save failures gracefully with retry logic and user notification.

**Move Ranges:**
- **FR-013**: Each move MUST have an associated range value (default: 1 for physical/melee, 6 for special/ranged).
- **FR-014**: System MUST visually highlight valid target cells based on move range when a move is selected.
- **FR-015**: System MUST prevent targeting cells/Pokemon outside the move's range.
- **FR-016**: Range calculation MUST use Manhattan distance (no diagonal shortcuts).

**Movement Ranges:**
- **FR-017**: Each Pokemon MUST have a movement range (default: 6 cells per turn).
- **FR-018**: System MUST visually highlight valid movement destinations when movement is selected.
- **FR-019**: System MUST prevent movement to occupied cells.
- **FR-020**: System MUST track remaining movement within a turn if partial movement is allowed.

**AI Behavior:**
- **FR-021**: AI MUST evaluate available moves and select based on tactical criteria (type advantage, power, status potential).
- **FR-022**: AI MUST consider movement to bring targets into range before attacking.
- **FR-023**: AI MUST respect move ranges when selecting targets.
- **FR-024**: AI MUST use available PP and avoid moves with 0 PP.
- **FR-025**: AI decision-making MUST complete within a reasonable time (under 2 seconds per turn).

### Key Entities

- **Move**: Extended with `range` attribute (number of cells for targeting).
- **Combatant**: Extended with `movement_remaining` (cells left to move this turn).
- **Battle State**: Includes grid cell highlighting state for UI feedback.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can view complete stats for any Pokemon within 0.5 seconds of hovering.
- **SC-002**: PP values displayed match actual PP remaining with 100% accuracy across all game states.
- **SC-003**: Battle state survives page refresh with 100% data integrity (no lost progress).
- **SC-004**: Players can identify valid move targets visually before committing to an action.
- **SC-005**: Players can see exactly how far their Pokemon can move before selecting a destination.
- **SC-006**: AI opponents make observable tactical decisions (measurable: AI selects type-advantaged moves at least 70% of the time when available).
- **SC-007**: Combat round completion time is not noticeably impacted by new features (under 3 seconds for AI turn including movement and attack).

## Assumptions

- Move range data will be derived from existing move properties (category: physical vs special) or added as new metadata.
- The default movement range of 6 cells aligns with the existing `movement_remaining: 30` in combatant data (treating 30 as 6 cells at 5 units per cell, or adjusting as needed).
- The existing `active_battles` table schema can accommodate any additional state needed for new features.
- Source move data includes sufficient information to determine default ranges, or reasonable defaults will be applied.
- AI tactical decisions will be deterministic with weighted randomness rather than pure machine learning.
