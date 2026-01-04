# Feature Specification: Battle API Endpoint

**Feature Branch**: `006-battle-api`
**Created**: 2026-01-03
**Status**: Draft
**Input**: User description: "Build the main battle API endpoint that students will call from their N8N workflows."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Execute Wild Pokemon Battle (Priority: P1)

A student using N8N workflow wants to battle a wild Pokemon encounter. They call the battle API with their Pokemon's ID and move choice. The system processes the battle turn, calculates damage using Pokemon 5e combat rules, updates their Pokemon's state, and returns a detailed battle log.

**Why this priority**: Core battle functionality is the primary purpose of this feature. Without battle execution, no other battle features are meaningful.

**Independent Test**: Can be fully tested by sending a POST request with a valid Pokemon ID and move choice, receiving a battle log with turn-by-turn actions, damage dealt, and outcome.

**Acceptance Scenarios**:

1. **Given** a player owns a healthy Pokemon, **When** they call the battle endpoint with that Pokemon's ID and a valid move from its moveset, **Then** the system returns a battle log with damage calculations, HP updates, and turn resolution
2. **Given** a player's Pokemon uses a move matching its type, **When** damage is calculated, **Then** STAB (Same Type Attack Bonus) is correctly applied equal to proficiency bonus
3. **Given** a player's Pokemon attacks an opponent with type weakness, **When** damage is calculated, **Then** type effectiveness doubles the damage
4. **Given** a player's Pokemon attacks an opponent with type resistance, **When** damage is calculated, **Then** type effectiveness halves the damage

---

### User Story 2 - Battle Victory and Rewards (Priority: P2)

When a player defeats a wild Pokemon, they should receive experience points and currency rewards. The system should calculate XP based on the opponent's level and SR (Species Rating), and award it to their Pokemon.

**Why this priority**: Victory rewards are essential for game progression but depend on the core battle system being functional first.

**Independent Test**: Can be tested by winning a battle and verifying XP is awarded using the formula: 200 x Pokemon Level x SR.

**Acceptance Scenarios**:

1. **Given** a player defeats a wild Pokemon, **When** the battle ends, **Then** experience is awarded using the formula (200 x opponent level x opponent SR)
2. **Given** a player's Pokemon gains enough experience to level up, **When** the battle concludes, **Then** the level-up is queued for the player to process and the response indicates pending level-up
3. **Given** a player defeats a wild Pokemon, **When** the battle ends, **Then** currency is awarded based on the opponent's level

---

### User Story 3 - Battle Defeat Handling (Priority: P2)

When a player's Pokemon faints during battle, the system should properly handle the defeat state - marking the Pokemon as fainted and returning appropriate status in the battle log.

**Why this priority**: Defeat handling is equally important as victory for game balance, but core battle mechanics must work first.

**Independent Test**: Can be tested by having a low-HP Pokemon enter battle against a stronger opponent, verify the Pokemon is marked as fainted when HP reaches 0.

**Acceptance Scenarios**:

1. **Given** a player's Pokemon HP reaches 0 during battle, **When** the turn resolves, **Then** the Pokemon is marked as fainted in the database and battle log indicates defeat
2. **Given** a player's Pokemon faints, **When** the battle ends, **Then** no experience is deducted and the fainted status persists until healed

---

### User Story 4 - PP (Power Points) Management (Priority: P3)

Each move has limited PP that decreases with use. The system should track PP consumption and prevent moves with 0 PP remaining.

**Why this priority**: PP management adds strategic depth but the core battle loop must function without it initially.

**Independent Test**: Can be tested by using a move repeatedly until PP reaches 0, then verifying the move cannot be used again.

**Acceptance Scenarios**:

1. **Given** a player uses a move, **When** the turn resolves, **Then** that move's PP decreases by 1 in the database
2. **Given** a move has 0 PP remaining, **When** a player attempts to use it, **Then** the request is rejected with a clear error message
3. **Given** all moves have 0 PP, **When** the player must act, **Then** Struggle is automatically used with recoil damage to self

---

### User Story 5 - Opponent Generation (Priority: P3)

The system generates appropriate wild Pokemon opponents from Source data based on the encounter context.

**Why this priority**: Dynamic opponent generation enhances replayability but a simple opponent can be used for initial testing.

**Independent Test**: Can be tested by calling the battle endpoint with encounter parameters and verifying a valid opponent is generated from Source data.

**Acceptance Scenarios**:

1. **Given** a battle is initiated, **When** no specific opponent is provided, **Then** the system generates a wild Pokemon from Source data with appropriate level
2. **Given** an opponent is generated, **When** the battle begins, **Then** the opponent has valid stats, moves, and HP calculated from Source data

---

### Edge Cases

- What happens when a player calls battle with a Pokemon ID they don't own? Return 403 Forbidden with clear error
- What happens when a player calls battle with a fainted Pokemon? Return validation error - Pokemon must be healed first
- What happens when the requested move is not in the Pokemon's known moveset? Return validation error with available moves
- What happens when the player's session token is invalid or expired? Return 401 Unauthorized
- What happens when the opponent and player Pokemon are both knocked out in the same turn? Player's Pokemon is checked first for victory determination
- What happens when a move targets multiple opponents in future multi-battle scenarios? Process each target separately

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST authenticate requests using the existing JWT bearer token pattern via `authenticateRequest`
- **FR-002**: System MUST validate that the requested Pokemon belongs to the authenticated user by querying `player_pokemon` table
- **FR-003**: System MUST validate that the requested Pokemon is not fainted (current_hp > 0)
- **FR-004**: System MUST validate that the requested move exists in the Pokemon's current moveset (based on level)
- **FR-005**: System MUST validate that the requested move has PP remaining
- **FR-006**: System MUST load Pokemon stats, type, and move details from Source JSON files
- **FR-007**: System MUST generate a wild Pokemon opponent from Source data with level appropriate to the player's Pokemon
- **FR-008**: System MUST calculate damage using Pokemon 5e formulas: Attack Roll Bonus = Move Power Mod + Prof. Mod
- **FR-009**: System MUST apply STAB (Same Type Attack Bonus) when move type matches Pokemon type, adding proficiency bonus to damage
- **FR-010**: System MUST apply type effectiveness (2x for weakness, 0.5x for resistance, 0x for immunity)
- **FR-011**: System MUST update player Pokemon's current_hp in the database after each battle turn
- **FR-012**: System MUST decrease the used move's PP in the database after each use
- **FR-013**: System MUST award experience on victory using formula: 200 x opponent_level x opponent_SR
- **FR-014**: System MUST award currency on victory proportional to opponent level
- **FR-015**: System MUST mark Pokemon as fainted when HP reaches 0
- **FR-016**: System MUST return a structured JSON battle log containing: turn actions, damage dealt, effects applied, HP changes, outcome, and rewards earned
- **FR-017**: System MUST follow the existing API response envelope pattern (success/data or success/error)

### Key Entities

- **Player Pokemon**: The player's owned Pokemon with mutable state (current_hp, PP, level, experience) stored in `player_pokemon` table
- **Source Pokemon**: Immutable Pokemon base data (stats, types, moves, evolution) loaded from `Source/pokemon/pokemon.json`
- **Move**: Action a Pokemon can take in battle, with type, power attribute, PP cost, and damage formula from `Source/moves/moves.json`
- **Opponent**: Wild Pokemon generated for the battle, temporary entity with HP and moveset derived from Source data
- **Battle Log**: Structured record of the battle containing turns, actions, damage, effects, outcome, and rewards

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: N8N workflows can call the battle endpoint and receive a parseable JSON response within 3 seconds
- **SC-002**: Battle damage calculations match Pokemon 5e formula expectations when manually verified
- **SC-003**: Player Pokemon HP and PP are correctly persisted after each battle
- **SC-004**: Experience and currency are correctly awarded on victory
- **SC-005**: 100% of invalid requests (wrong Pokemon, fainted Pokemon, invalid move) return appropriate error codes
- **SC-006**: Battle logs contain sufficient detail for N8N workflows to make decisions (outcome, HP remaining, rewards)
