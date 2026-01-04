# Feature Specification: Healing API

**Feature Branch**: `008-healing-api`
**Created**: 2026-01-03
**Status**: Draft
**Input**: User description: "Create the healing API endpoint that restores party Pokemon to full health."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Heal Party After Battle (Priority: P1)

A student completes a battle and their Pokemon have taken damage. They need to restore their active party to full health before starting the next encounter. They call the healing endpoint from their N8N workflow to prepare for the next battle.

**Why this priority**: This is the core use case - students need a simple, reliable way to heal their Pokemon between battles to continue their learning journey without frustration from accumulated damage.

**Independent Test**: Can be fully tested by calling the heal endpoint after any battle and verifying all active Pokemon return to full HP with restored PP.

**Acceptance Scenarios**:

1. **Given** a player has 3 active Pokemon with varying HP (10/30, 20/25, 5/40), **When** they call the heal endpoint, **Then** all three Pokemon are restored to full HP (30/30, 25/25, 40/40).

2. **Given** a player has Pokemon with depleted PP on multiple moves, **When** they call the heal endpoint, **Then** all move PP is restored to maximum values.

3. **Given** a player has a fainted Pokemon (0 HP) in their active party, **When** they call the heal endpoint, **Then** the fainted Pokemon is revived to full HP.

---

### User Story 2 - Immediate Response for Workflow Integration (Priority: P2)

The N8N workflow needs a fast, predictable response so it can immediately present the healed party state to the student without delays or complex parsing.

**Why this priority**: Workflow integration depends on consistent, fast responses. If healing is slow or unpredictable, it creates a poor experience for students waiting between battles.

**Independent Test**: Can be verified by calling the endpoint and measuring response time, confirming it returns within acceptable latency with a predictable response format.

**Acceptance Scenarios**:

1. **Given** a player with a full party of 6 active Pokemon, **When** they call the heal endpoint, **Then** the response is returned within 2 seconds and includes all healed Pokemon data.

2. **Given** a successful heal operation, **When** the response is returned, **Then** it includes the complete updated Pokemon data merged with Source details (name, type, sprite, etc.) for easy display.

---

### Edge Cases

- What happens when a player has no Pokemon? System returns success with empty array.
- What happens when all Pokemon are already at full HP? System still returns success with current data (idempotent operation).
- What happens when the player has no active roster (only box Pokemon)? System heals only active Pokemon (is_active = true), returns empty if none are active.
- How does the system handle authentication failures? Returns standard 401 unauthorized error.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST authenticate requests using JWT from the Authorization header, extracting player_id from the token.
- **FR-002**: System MUST query only Pokemon belonging to the authenticated user with is_active = true.
- **FR-003**: System MUST update current_hp to equal max_hp for all active Pokemon in a single database transaction.
- **FR-004**: System MUST restore all move PP to maximum values by reinitializing the move_pp object using the Pokemon's selected moves.
- **FR-005**: System MUST return the updated Pokemon data merged with Source details (name, type, sprite/artwork paths) using lib/pokemonData.js utilities.
- **FR-006**: System MUST be free to use - no currency deduction or cost check required.
- **FR-007**: System MUST only accept POST method (healing is an action, not a query).
- **FR-008**: System MUST return appropriate error responses for unauthenticated requests.
- **FR-009**: System MUST handle the case of no active Pokemon gracefully, returning success with an empty healed array.

### Key Entities *(include if feature involves data)*

- **Player Pokemon Record**: Database record containing user_id, pokemon_id, current_hp, max_hp, is_active, move_pp, selected_moves, and other battle state.
- **Source Pokemon Data**: Static reference data containing Pokemon name, types, sprite paths, and move information.
- **Merged Response**: Combined object with database state and Source details for client display.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Students can heal their entire active party in a single API call without any cost.
- **SC-002**: Healed Pokemon are immediately battle-ready with full HP and restored PP.
- **SC-003**: The endpoint responds quickly enough for workflow integration (under 2 seconds for a full party).
- **SC-004**: N8N workflows can parse the response without additional transformation to display healed Pokemon to students.
- **SC-005**: The endpoint is idempotent - calling it multiple times produces the same result without side effects.

## Assumptions

- Status effects are not persisted in the database (they are tracked in-memory during battle sessions only), so there is no status_effects column to clear.
- The endpoint follows existing API patterns in the codebase (pages/api/*.js structure).
- Authentication uses the existing authenticateRequest helper from lib/authHelper.js.
- Response formatting uses existing apiResponse helpers (sendSuccess, sendUnauthorizedError, etc.).
- Pokemon Source data is accessed via lib/pokemonData.js utilities (buildPlayerPokemonListResponse).
- PP restoration uses initializeMovePP to rebuild PP from the Pokemon's selected_moves.
