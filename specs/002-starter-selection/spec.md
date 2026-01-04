# Feature Specification: Starter Pokemon Selection

**Feature Branch**: `002-starter-selection`
**Created**: 2026-01-03
**Status**: Draft
**Input**: User description: "Build the starter selection experience for new players. New users select from a filtered list of starter-eligible Pokemon (SR <= 0.5). They can filter by type. Selection creates a record in player_pokemon with the user's first Pokemon."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - New Player Selects Starter Pokemon (Priority: P1)

A new player logs in for the first time via JWT authentication. The system detects they have no Pokemon in their roster and redirects them to the starter selection screen. They browse available starter Pokemon (those with SR <= 0.5), view each Pokemon's sprite, name, and type(s), select one they like, and confirm their choice. The selected Pokemon is added to their roster as their first active Pokemon at level 1.

**Why this priority**: This is the core feature. Without starter selection, new players cannot begin playing. Every other feature depends on players having at least one Pokemon.

**Independent Test**: Can be fully tested by creating a new user, logging in, verifying redirect to starter selection, selecting a Pokemon, and confirming it appears in their roster as active at level 1.

**Acceptance Scenarios**:

1. **Given** a new user who just logged in for the first time, **When** the system checks their roster, **Then** they are redirected to the starter selection screen before accessing any other part of the application.

2. **Given** a user is on the starter selection screen, **When** the page loads, **Then** they see a grid/list of all Pokemon with SR <= 0.5 showing each Pokemon's sprite, name, and type(s).

3. **Given** a user is viewing starter options, **When** they click on a Pokemon and confirm selection, **Then** a record is created in player_pokemon with their user_id, the selected pokemon_id, is_active = true, slot_number = 1, and level = 1.

4. **Given** a user has just selected their starter, **When** the selection is confirmed, **Then** they are redirected to the dashboard.

---

### User Story 2 - Player Filters Starters by Type (Priority: P2)

A player on the starter selection screen wants to narrow down their choices. They use a type filter bar to select one or two types (e.g., "Fire" or "Water + Flying"). The displayed Pokemon list updates to show only starters matching the selected type(s).

**Why this priority**: Filtering improves user experience but is not essential for the core selection flow. Players can still browse all starters without filtering.

**Independent Test**: Can be tested by loading the starter selection screen, applying type filter(s), and verifying only matching Pokemon are displayed.

**Acceptance Scenarios**:

1. **Given** a user is on the starter selection screen, **When** they select one type from the filter bar, **Then** only Pokemon that have that type are displayed.

2. **Given** a user is on the starter selection screen, **When** they select two types from the filter bar, **Then** only Pokemon that have at least one of those types are displayed.

3. **Given** a user has applied type filters, **When** they clear the filters, **Then** all eligible starter Pokemon are displayed again.

---

### User Story 3 - Existing Player Bypasses Starter Selection (Priority: P3)

A returning player who already has Pokemon in their roster logs in. The system detects they have existing Pokemon and allows them to proceed directly to the dashboard without seeing the starter selection screen.

**Why this priority**: This is important for returning users but is a bypass scenario rather than core functionality.

**Independent Test**: Can be tested by logging in as a user who already has Pokemon and verifying they go directly to the dashboard.

**Acceptance Scenarios**:

1. **Given** a user with existing Pokemon in player_pokemon logs in, **When** the authentication completes, **Then** they are redirected to the dashboard without seeing starter selection.

2. **Given** a user has already selected a starter, **When** they try to navigate directly to the starter selection URL, **Then** they are redirected to the dashboard.

---

### Edge Cases

- What happens when the Source pokemon.json file is missing or corrupted?
  - The system displays an error message indicating Pokemon data could not be loaded and prevents selection until resolved.

- What happens when a user's session expires during starter selection?
  - The user is redirected to login and upon re-authentication, if they still have no Pokemon, they return to starter selection.

- What happens when the database insert fails during selection?
  - The user sees an error message indicating selection failed, and they can retry. No partial data is saved.

- What happens when a user has Pokemon but none are marked active?
  - The system treats any existing Pokemon (regardless of active status) as "has starter" and bypasses selection.

- What happens when two users try to select the same Pokemon simultaneously?
  - Both selections succeed since Pokemon are templates, not unique entities. Multiple users can have the same starter.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST check if the authenticated user has any records in player_pokemon upon login.

- **FR-002**: System MUST redirect users with zero Pokemon in their roster to the starter selection screen before allowing access to any other application feature.

- **FR-003**: System MUST load and display all Pokemon from Source/pokemon/pokemon.json where SR (species rating) is less than or equal to 0.5.

- **FR-004**: System MUST display each starter Pokemon's sprite image, name, and type(s) on the selection screen.

- **FR-005**: System MUST provide a type filter bar allowing users to filter displayed Pokemon by one or two types.

- **FR-006**: System MUST allow users to select exactly one Pokemon as their starter.

- **FR-007**: System MUST require confirmation before finalizing starter selection (preventing accidental clicks).

- **FR-008**: System MUST create a player_pokemon record upon confirmed selection with:
  - user_id: the authenticated user's ID
  - pokemon_id: reference to the selected Pokemon
  - is_active: true
  - slot_number: 1
  - level: 1

- **FR-009**: System MUST redirect users to the dashboard immediately after successful starter selection.

- **FR-010**: System MUST prevent users who already have Pokemon from accessing the starter selection screen.

- **FR-011**: Starter selection MUST be permanent - users cannot change or undo their starter choice.

- **FR-012**: System MUST use lib/pokemonData.js functions to merge database records with Source data for API responses.

### Key Entities

- **Player Pokemon (player_pokemon)**: Represents a Pokemon owned by a specific user. Key attributes:
  - user_id: Reference to the owning user
  - pokemon_id: Reference to the Pokemon species (from Source data)
  - is_active: Whether this Pokemon is in the active roster
  - slot_number: Position in the active roster (1-6)
  - level: Current level of this Pokemon instance (starts at 1 for starters)

- **Pokemon (Source data)**: Static reference data for Pokemon species. Key attributes used for starter selection:
  - id: Unique identifier for the species
  - name: Display name
  - type: Array of type strings (e.g., ["grass", "poison"])
  - sr: Species rating determining starter eligibility (SR <= 0.5)
  - sprite: Image reference for display

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: New users can complete the starter selection process (from login to dashboard) in under 60 seconds.

- **SC-002**: 100% of new users without Pokemon are redirected to starter selection before seeing any other content.

- **SC-003**: Selected starters are correctly persisted with all required fields (user_id, pokemon_id, is_active=true, slot_number=1, level=1).

- **SC-004**: Type filtering updates the displayed Pokemon list within 200ms of filter change.

- **SC-005**: 100% of users who already have Pokemon bypass starter selection and go directly to dashboard.

- **SC-006**: Zero duplicate starter records can be created for the same user (only one starter per user).

## Assumptions

- The Source/pokemon/pokemon.json file contains all Pokemon data including the "sr" field for filtering.
- Pokemon sprites are available and referenced in the Source data or can be derived from Pokemon IDs.
- The player_pokemon table will be created as part of this feature's database migration.
- JWT authentication from feature 001-env-auth-setup is functional and provides user identity.
- A "dashboard" page exists or will be created for post-selection redirect.
- All Pokemon with SR <= 0.5 are valid starter choices (no additional eligibility criteria).
