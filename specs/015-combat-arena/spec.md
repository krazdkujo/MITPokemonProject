# Feature Specification: Combat Arena Page

**Feature Branch**: `015-combat-arena`
**Created**: 2026-01-04
**Status**: Draft
**Input**: User description: "Implement the Combat Arena page for Pokemon 5e battles with 10x10 grid, turn-based combat, and Pokemon placement"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Battle Setup and Pokemon Placement (Priority: P1)

A player enters the Combat Arena to begin a battle. They see a 10x10 grid with columns labeled A-J and rows 1-10. The player's trainer appears on the left edge (column A, row 5) and the opponent trainer appears on the right edge (column J, row 5). During the setup phase, the player selects Pokemon from their party and places them in the valid deployment zone (rows 1-2). Enemy Pokemon are automatically positioned in rows 9-10.

**Why this priority**: Core battle functionality - without the grid and Pokemon placement, no battle can occur.

**Independent Test**: Can be fully tested by loading the combat page, verifying grid renders with proper labels, and placing a Pokemon in the deployment zone.

**Acceptance Scenarios**:

1. **Given** a player with Pokemon in their party, **When** they navigate to the combat page, **Then** they see a 10x10 grid with columns A-J and rows 1-10 labeled correctly
2. **Given** a battle in setup phase, **When** the player attempts to place a Pokemon, **Then** only squares in rows 1-2 are highlighted as valid placement zones
3. **Given** a grid square already contains a Pokemon, **When** the player attempts to place another Pokemon there, **Then** the placement is rejected with feedback
4. **Given** the player has completed placement, **When** setup ends, **Then** enemy Pokemon appear in rows 9-10

---

### User Story 2 - Turn-Based Combat Execution (Priority: P1)

During combat, the player selects one of their Pokemon, chooses a move from the available move list, and selects a valid target on the grid. The battle processes turn order based on initiative. When an attack resolves, damage numbers animate on the grid, HP bars update, and the battle log records the action. Combat continues until one side has no Pokemon remaining.

**Why this priority**: Core gameplay loop - turn-based combat is the primary interaction.

**Independent Test**: Can be fully tested by executing a single attack and verifying damage calculation, animation, and state updates.

**Acceptance Scenarios**:

1. **Given** it is the player's turn, **When** they select a Pokemon and a move, **Then** valid target squares are highlighted based on move range
2. **Given** a move is executed, **When** damage is calculated, **Then** damage numbers appear animated on the target Pokemon and HP bar updates
3. **Given** a Pokemon's HP reaches zero, **When** the faint animation completes, **Then** the Pokemon is removed from active play
4. **Given** the turn completes, **When** the next combatant acts, **Then** the turn indicator updates to show current turn and initiative order

---

### User Story 3 - Wild Pokemon Capture (Priority: P2)

During a wild encounter battle, the player has the option to attempt capturing the wild Pokemon instead of defeating it. The player selects the "Throw Poke Ball" action when it is their turn, targeting the wild Pokemon they wish to capture.

**Why this priority**: Important for Pokemon collection gameplay but not required for basic combat functionality.

**Independent Test**: Can be fully tested by initiating a wild battle and attempting a capture action.

**Acceptance Scenarios**:

1. **Given** a wild Pokemon battle, **When** the player views available actions, **Then** "Throw Poke Ball" option is visible
2. **Given** the player selects capture, **When** they target a wild Pokemon, **Then** the capture attempt is processed and result is displayed
3. **Given** a trainer battle (non-wild), **When** the player views available actions, **Then** "Throw Poke Ball" option is not available

---

### User Story 4 - Status Effects Display (Priority: P2)

Pokemon affected by status conditions (poison, burn, paralysis, etc.) display visual indicators on their token. Status effects persist across turns and affect gameplay according to their rules.

**Why this priority**: Enhances battle depth but basic combat can function without status effect visualization.

**Independent Test**: Can be fully tested by applying a status effect and verifying the icon appears on the Pokemon token.

**Acceptance Scenarios**:

1. **Given** a Pokemon is affected by poison, **When** viewing the Pokemon on the grid, **Then** a poison status icon is visible on the Pokemon token
2. **Given** multiple status effects are active, **When** viewing the Pokemon token, **Then** all applicable status icons are displayed
3. **Given** a status effect is cured or expires, **When** the Pokemon token updates, **Then** the status icon is removed

---

### User Story 5 - Battle Log and History (Priority: P3)

A scrollable battle log displays all actions and outcomes during combat. Players can review what happened in previous turns for strategic planning.

**Why this priority**: Quality of life feature that improves user experience but is not required for core functionality.

**Independent Test**: Can be fully tested by executing actions and verifying they appear in the log with correct details.

**Acceptance Scenarios**:

1. **Given** an attack is executed, **When** the action resolves, **Then** an entry appears in the battle log with attacker, move, target, and damage
2. **Given** multiple actions have occurred, **When** the player scrolls the battle log, **Then** they can view the full history of the battle
3. **Given** a Pokemon faints, **When** the faint occurs, **Then** the battle log records which Pokemon fainted

---

### User Story 6 - Battle End States (Priority: P1)

When all of one side's Pokemon have fainted, the battle concludes. Victory shows a success screen with rewards. Defeat shows a loss screen and redirects the player to the Pokemon Center for healing.

**Why this priority**: Essential for completing the battle loop and providing closure to combat encounters.

**Independent Test**: Can be fully tested by reducing all enemy Pokemon HP to zero and verifying victory state triggers.

**Acceptance Scenarios**:

1. **Given** all enemy Pokemon have fainted, **When** the last enemy faints, **Then** a victory screen is displayed
2. **Given** all player Pokemon have fainted, **When** the last player Pokemon faints, **Then** a defeat screen is displayed and player is redirected to Pokemon Center
3. **Given** the player chooses to flee, **When** flee succeeds, **Then** the battle ends and player returns to previous location

---

### Edge Cases

- What happens when a player has no Pokemon with HP remaining before battle starts? Redirect to Pokemon Center with error message.
- How does the system handle network timeout during battle? Show reconnection option or graceful failure with state preservation.
- What happens if the player disconnects mid-turn? Battle state is preserved for reconnection.
- What happens when all valid placement squares are occupied during setup? Player cannot place additional Pokemon and must proceed with current placement.
- How are ties in initiative order resolved? Higher speed stat wins, then random selection.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a 10x10 battle grid with columns labeled A-J (left to right) and rows labeled 1-10 (top to bottom)
- **FR-002**: System MUST position the player trainer at column A, row 5 and opponent trainer at column J, row 5
- **FR-003**: System MUST restrict player Pokemon placement to rows 1-2 during setup phase
- **FR-004**: System MUST position enemy Pokemon in rows 9-10 when battle begins
- **FR-005**: System MUST enforce one occupant (Pokemon or trainer) per grid square
- **FR-006**: System MUST visually highlight valid movement squares when a Pokemon is selected for movement
- **FR-007**: System MUST visually highlight valid attack targets when a move is selected
- **FR-008**: System MUST display initiative order showing which combatant acts next
- **FR-009**: System MUST animate damage numbers when attacks resolve
- **FR-010**: System MUST update HP bars in real-time when damage is dealt
- **FR-011**: System MUST display status effect icons on affected Pokemon tokens
- **FR-012**: System MUST play faint animation and remove Pokemon from grid when HP reaches zero
- **FR-013**: System MUST display "Throw Poke Ball" option only during wild Pokemon encounters
- **FR-014**: System MUST redirect player to Pokemon management if they have no active Pokemon
- **FR-015**: System MUST show defeat screen and redirect to Pokemon Center when all player Pokemon faint
- **FR-016**: System MUST maintain a scrollable battle log of all actions and outcomes
- **FR-017**: System MUST show available moves with name, type, power, and PP remaining for each Pokemon
- **FR-018**: System MUST provide action buttons: Attack, Move, Use Item, Catch (wild only), and Flee

### Key Entities

- **Battle Grid**: 10x10 coordinate-based arena where combat takes place. Each cell identified by column (A-J) and row (1-10).
- **Combatant**: A Pokemon actively participating in battle with position, current HP, status effects, and available moves.
- **Turn Order**: Initiative-based sequence determining which combatant acts next.
- **Battle Log Entry**: Record of a single action including actor, action type, target, and outcome.
- **Move**: Attack or ability a Pokemon can use with name, type, power, accuracy, range, and PP cost.
- **Status Effect**: Condition affecting a Pokemon (poison, burn, paralysis, etc.) with duration and effect rules.
- **Deployment Zone**: Grid area where Pokemon can be placed (rows 1-2 for player, rows 9-10 for enemy).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can complete Pokemon placement in the deployment zone within 30 seconds
- **SC-002**: Turn execution (select Pokemon, select move, select target) completes in under 5 seconds from user action to visual feedback
- **SC-003**: Battle grid loads and displays correctly within 2 seconds of page navigation
- **SC-004**: 100% of battle actions are recorded in the battle log with accurate information
- **SC-005**: Status effects are visually indicated within 1 second of being applied
- **SC-006**: Damage animations display within 500ms of attack resolution
- **SC-007**: Players can identify whose turn it is at any point during battle (turn indicator always visible)
- **SC-008**: Wild Pokemon capture attempts provide immediate feedback on success or failure
- **SC-009**: Defeat state correctly triggers redirect to Pokemon Center 100% of the time
- **SC-010**: Grid coordinates (A-J, 1-10) are legible and unambiguous at standard viewing distance

## Assumptions

- Player has at least one Pokemon in their party before accessing the combat page (enforced by redirect)
- Battle state is managed server-side and synced to client to prevent cheating
- Standard web connection speeds (3G or better) are sufficient for real-time battle updates
- Pokemon sprites and assets are available from existing asset library
- Move ranges and targeting rules follow Pokemon 5e tabletop game conventions
- Initiative is calculated using Pokemon speed stats plus any applicable modifiers
- The flee action has a success rate based on relative speed of combatants
- Items usable in battle are limited to those in the player's inventory
