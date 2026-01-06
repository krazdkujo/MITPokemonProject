# Feature Specification: Fix Combat Encounter Bugs

**Feature Branch**: `020-fix-combat-encounter-bugs`
**Created**: 2026-01-06
**Status**: Implementation Complete (Pending Manual Verification)
**Input**: User description: "When I go to encounters I see an encounter in progress but I have no pokemon showing as able to join, then it says my pokemon are knocked out and sends me to the pokecenter but heal is greyed out and my health bar is full."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Join Active Encounter with Healthy Pokemon (Priority: P1)

As a player with healthy Pokemon in my party, when I navigate to the zones/encounters page and there is an active encounter, I should see my healthy Pokemon available to join the battle. Currently, the system shows "encounter in progress" but displays no Pokemon as available to place, creating a soft-lock where I cannot participate in my own battle.

**Why this priority**: This is the critical entry point for combat. Without being able to join encounters with available Pokemon, players cannot engage with the core combat system at all. This is a complete blocker for gameplay.

**Independent Test**: Can be fully tested by creating a new encounter with a party of healthy Pokemon and verifying all healthy Pokemon appear in the placement selection.

**Acceptance Scenarios**:

1. **Given** I have 3 healthy Pokemon in my party and an active encounter exists, **When** I navigate to the encounter page, **Then** I see all 3 Pokemon available to place on the battle grid
2. **Given** I have 3 Pokemon where 2 are healthy and 1 is fainted, **When** I navigate to the encounter page, **Then** I see only the 2 healthy Pokemon available to place
3. **Given** I have healthy Pokemon and no active encounter, **When** I start a new encounter, **Then** all my healthy Pokemon are immediately available to place

---

### User Story 2 - Accurate Knockout Detection (Priority: P1)

As a player, the system should only declare my Pokemon as "knocked out" when they have actually been defeated in battle (0 HP). Currently, healthy Pokemon with full HP are incorrectly detected as knocked out, leading to false redirection to the Pokemon Center.

**Why this priority**: Incorrect knockout detection breaks the core combat loop and sends players to the wrong screen. This is equally critical as Story 1 since it creates the false impression that Pokemon are fainted when they are healthy.

**Independent Test**: Can be fully tested by verifying that Pokemon with any HP greater than 0 are never classified as knocked out.

**Acceptance Scenarios**:

1. **Given** I have Pokemon with full HP, **When** the system checks knockout status, **Then** they are not marked as knocked out
2. **Given** I have Pokemon with 1 HP remaining, **When** the system checks knockout status, **Then** they are not marked as knocked out
3. **Given** I have Pokemon with exactly 0 HP, **When** the system checks knockout status, **Then** they are correctly marked as knocked out
4. **Given** I have a mix of healthy and fainted Pokemon, **When** at least one Pokemon has HP > 0, **Then** the system does not redirect to Pokemon Center with "all knocked out" message

---

### User Story 3 - Functional Pokemon Center Healing (Priority: P2)

As a player at the Pokemon Center, when I have Pokemon that need healing (HP below maximum), the heal button should be enabled. Currently, the heal button appears greyed out even when Pokemon need healing, or it appears correctly but the visual health bar shows conflicting information.

**Why this priority**: While frustrating, players with this bug can potentially work around it by catching new Pokemon or other means. The first two stories are blockers; this one is a significant usability issue.

**Independent Test**: Can be fully tested by navigating to Pokemon Center with damaged Pokemon and verifying the heal button is enabled and functional.

**Acceptance Scenarios**:

1. **Given** I have Pokemon with HP below their maximum, **When** I visit the Pokemon Center, **Then** the heal button is enabled
2. **Given** all my Pokemon have full HP, **When** I visit the Pokemon Center, **Then** the heal button is greyed out (correct behavior)
3. **Given** I have Pokemon that need healing and I click heal, **When** the healing completes, **Then** all Pokemon HP is restored to maximum and displayed correctly
4. **Given** I have Pokemon with missing HP data, **When** I visit the Pokemon Center, **Then** the system treats them as needing healing (defaulting to max HP as the target)

---

### Edge Cases

- What happens when a player's Pokemon have NULL or undefined HP values in the database? System should treat NULL current_hp as equal to max_hp (healthy).
- How does the system handle Pokemon that were partially placed in an abandoned battle? The battle state should be cleaned up so Pokemon return to available status.
- What happens when max_hp is also NULL or missing? System should calculate max_hp from the Pokemon's base stats.
- How does the system handle a player navigating away mid-battle and returning later? The active battle should maintain consistent state and Pokemon availability.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display all healthy Pokemon (current_hp > 0) as available to join an active encounter
- **FR-002**: System MUST treat Pokemon with NULL or undefined current_hp values as having full HP (current_hp = max_hp)
- **FR-003**: System MUST only classify Pokemon as "knocked out" when current_hp equals exactly 0
- **FR-004**: System MUST enable the heal button when any Pokemon has current_hp less than max_hp
- **FR-005**: System MUST disable the heal button only when all Pokemon have current_hp equal to max_hp
- **FR-006**: System MUST synchronize Pokemon HP data consistently between encounters, battles, and the Pokemon Center
- **FR-007**: System MUST correctly calculate max_hp from Pokemon base stats when max_hp is NULL or undefined
- **FR-008**: System MUST not redirect players to Pokemon Center unless all party Pokemon have 0 HP
- **FR-009**: System MUST clean up stale battle state when an encounter is abandoned or times out, returning Pokemon to available status
- **FR-010**: System MUST ensure the visual HP bar display matches the underlying HP data used for button enable/disable logic

### Key Entities

- **Player Pokemon**: Pokemon owned by the player; key attributes include current_hp (current health), max_hp (maximum health), and party position
- **Active Battle**: A combat encounter in progress; contains the battle state including which Pokemon are placed, their positions, and their combat HP
- **Battle State**: The in-memory/persisted state of a battle; tracks combatants, their positions, HP, and battle progress
- **Party**: The collection of Pokemon a player can use; determines which Pokemon are available for encounters

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of healthy Pokemon (current_hp > 0) appear as available when viewing an active encounter
- **SC-002**: 0% false positive rate for knockout detection (no healthy Pokemon incorrectly marked as knocked out)
- **SC-003**: Heal button state matches Pokemon health status with 100% accuracy (enabled when healing needed, disabled when all at full HP)
- **SC-004**: Players can complete the combat flow (start encounter → place Pokemon → battle → return) without encountering soft-locks
- **SC-005**: HP display bar and heal button logic show consistent information (no visual vs. functional conflicts)
- **SC-006**: Pokemon with NULL/missing HP data are handled gracefully with sensible defaults (treated as full health)

## Assumptions

- The existing database schema for player_pokemon includes current_hp and max_hp fields that may contain NULL values
- The existing active_battles table stores battle state that may become stale if players abandon encounters
- The fix should be backward-compatible and automatically correct existing data issues without requiring manual database cleanup
- The Pokemon base stats are available to calculate max_hp when needed
