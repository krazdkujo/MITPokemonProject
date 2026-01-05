# Feature Specification: Fix Combat System Bugs

**Feature Branch**: `019-fix-combat-bugs`
**Created**: 2026-01-04
**Status**: Draft
**Input**: User description: "Bug fixes to 018-combat-enhancements - After hitting 'end turn' Pokemon was knocked out and redirected to pokecenter screen with no description of what happened, opponent didn't move, no explanation of move used/rolled/damage/HP left. Pokecenter showed full health but couldn't heal. Combat arena shows battle in progress but player has no pokemon so fight never ended."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Combat Action Feedback (Priority: P1)

When any combatant takes an action (attack, move, pass), the player must see clear feedback showing what happened, including the move used, dice rolls, damage dealt, and resulting HP changes.

**Why this priority**: Without action feedback, players cannot understand the game state or make informed decisions. This is the core issue that makes combat unplayable.

**Independent Test**: Start a battle, perform any action, and verify that the battle log shows complete action details.

**Acceptance Scenarios**:

1. **Given** it is the opponent's turn, **When** the opponent attacks, **Then** the battle log displays: attacker name, move name, attack roll result, damage dealt, and target's HP before/after
2. **Given** it is the opponent's turn, **When** the opponent moves, **Then** the battle log displays: combatant name and destination cell
3. **Given** it is the opponent's turn, **When** the opponent passes, **Then** the battle log displays that the opponent passed their turn
4. **Given** any combatant takes damage, **When** their HP changes, **Then** the HP bar visually updates to reflect the new value

---

### User Story 2 - Proper Turn Execution (Priority: P1)

When the player ends their turn or passes, the opponent must properly execute their turn (move and/or attack) before control returns to the player.

**Why this priority**: The game loop is broken if opponent turns don't execute properly. This ties directly with Story 1 for core combat functionality.

**Independent Test**: Start a battle, end turn, and verify opponent takes visible actions before player regains control.

**Acceptance Scenarios**:

1. **Given** player passes their turn, **When** it becomes opponent's turn, **Then** the opponent executes movement and/or attack before player's next turn
2. **Given** opponent is out of attack range, **When** opponent's turn begins, **Then** opponent moves toward the player's Pokemon before attacking if possible
3. **Given** opponent is in attack range, **When** opponent's turn begins, **Then** opponent attacks without unnecessary delay
4. **Given** opponent cannot reach or attack any target, **When** opponent's turn begins, **Then** opponent passes and turn advances to next combatant

---

### User Story 3 - Battle Completion and Cleanup (Priority: P1)

When a battle ends (victory, defeat, or flee), the system must properly clean up the battle state so no stale battles remain, and HP must be correctly persisted to the database.

**Why this priority**: Stale battles block new encounters and incorrect HP persistence breaks the game economy and progression.

**Independent Test**: Complete a battle to defeat, verify HP is saved correctly, and verify no active battle remains.

**Acceptance Scenarios**:

1. **Given** player's last Pokemon faints, **When** battle ends in defeat, **Then** the battle is marked as ended in the database with no active battle remaining
2. **Given** battle ends in defeat, **When** player visits PokeCenter, **Then** Pokemon show their actual (low/zero) HP, not full health
3. **Given** battle ends in defeat, **When** player navigates to combat arena, **Then** no stale battle is loaded - player can start fresh
4. **Given** player wins a battle, **When** battle ends in victory, **Then** rewards are granted and battle is properly cleaned up

---

### User Story 4 - HP Synchronization Between Combat and PokeCenter (Priority: P2)

Pokemon HP must be accurately synchronized between combat outcomes and the PokeCenter display, allowing proper healing.

**Why this priority**: While critical for game loop, this depends on Story 3's battle cleanup working correctly first.

**Independent Test**: Take damage in combat, end battle, visit PokeCenter, verify HP matches combat result.

**Acceptance Scenarios**:

1. **Given** Pokemon took damage during battle, **When** player visits PokeCenter after battle, **Then** Pokemon displays the HP it had when battle ended
2. **Given** Pokemon has less than full HP, **When** player uses healing at PokeCenter, **Then** the healing action is available and restores HP
3. **Given** Pokemon fainted in battle, **When** player visits PokeCenter, **Then** Pokemon shows 0 HP and can be healed

---

### Edge Cases

- What happens when the opponent has no valid moves with PP remaining? (Should use Struggle)
- What happens when both player and opponent Pokemon faint on the same turn? (Defeat takes priority)
- What happens if the battle state save fails during battle end? (Retry logic, user notification)
- What happens if player refreshes page during opponent's turn? (Battle state should restore correctly)
- What happens if opponent's attack causes a knockout but state wasn't saved? (Must persist before showing defeat)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display complete attack feedback in battle log including: attacker name, move name, hit/miss status, damage dealt, and target HP change
- **FR-002**: System MUST display movement feedback in battle log including: combatant name and destination cell notation
- **FR-003**: System MUST execute opponent turns fully (move + attack if applicable) before advancing to player's next turn
- **FR-004**: System MUST mark battles as ended in database when victory/defeat/flee conditions are met
- **FR-005**: System MUST persist current HP to database when battle ends
- **FR-006**: System MUST prevent loading of completed/ended battles in combat arena
- **FR-007**: System MUST synchronize Pokemon HP between combat state and player_pokemon database table
- **FR-008**: System MUST advance turn after opponent completes all actions (or fails to act)
- **FR-009**: System MUST handle opponent turn errors gracefully by advancing turn rather than freezing
- **FR-010**: System MUST allow healing at PokeCenter when Pokemon have less than full HP
- **FR-011**: System MUST display accurate HP values in PokeCenter matching database state

### Key Entities

- **Battle State**: Tracks combatants, positions, HP, turn order, phase (setup/combat/ended), and outcome
- **Player Pokemon**: Persistent record with current_hp that must sync with combat outcomes
- **Battle Log**: Chronological record of all combat actions with full details for player review
- **Active Battle**: Record linking player to in-progress battle, must be cleared on battle end

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of opponent actions display feedback in battle log before turn advances
- **SC-002**: All battles reaching end state are properly cleaned up with no stale active_battles remaining
- **SC-003**: Pokemon HP at PokeCenter matches combat outcome HP within 1 second of battle end
- **SC-004**: Players can complete a full battle (win or lose) without encountering frozen states
- **SC-005**: 100% of completed battles allow players to start new battles without "battle in progress" errors
- **SC-006**: All damage-dealing actions show attack roll, damage roll, and HP change in battle log
