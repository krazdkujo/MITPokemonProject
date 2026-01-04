# Feature Specification: Player Dashboard

**Feature Branch**: `003-player-dashboard`
**Created**: 2026-01-03
**Status**: Draft
**Input**: User description: "Build the main dashboard that shows the player's current state. Version 2 needs to show active roster (up to 6 Pokemon), badges earned, box count, and Pokedex progress with HP bars and level displays."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Active Party (Priority: P1)

As a player, I want to see my active party of up to 6 Pokemon prominently displayed on the dashboard so I can quickly assess my team's status.

**Why this priority**: The active party is the core gameplay element that players interact with most frequently. Without this, the dashboard has no primary purpose.

**Independent Test**: Can be fully tested by logging in with a user who has 1-6 active Pokemon and verifying each displays correctly with sprite, name, types, level, and HP bar.

**Acceptance Scenarios**:

1. **Given** a player with 1 active Pokemon, **When** they view the dashboard, **Then** they see that Pokemon displayed with sprite, name, types, level, and HP bar showing current_hp/max_hp.
2. **Given** a player with 6 active Pokemon, **When** they view the dashboard, **Then** they see all 6 Pokemon ordered by slot_number (1-6), each with complete information.
3. **Given** a player with a Pokemon that has reduced HP, **When** they view the dashboard, **Then** the HP bar visually reflects the proportion of current_hp to max_hp.
4. **Given** a player with no active Pokemon, **When** they view the dashboard, **Then** they see an appropriate empty state message indicating no party members.

---

### User Story 2 - View Box Summary (Priority: P2)

As a player, I want to see a count of my stored Pokemon (box count) so I know how many total Pokemon I have caught.

**Why this priority**: Box count provides important game progress feedback but is secondary to the active party display.

**Independent Test**: Can be tested by logging in with a user who has various Pokemon in storage and verifying the count displays correctly.

**Acceptance Scenarios**:

1. **Given** a player with 0 Pokemon in storage, **When** they view the dashboard, **Then** the box count shows 0.
2. **Given** a player with 15 Pokemon in storage (is_active = false), **When** they view the dashboard, **Then** the box count shows 15.
3. **Given** a player who catches a new Pokemon, **When** they return to the dashboard, **Then** the box count reflects the updated total.

---

### User Story 3 - View Pokedex Progress (Priority: P2)

As a player, I want to see my Pokedex progress so I can track how many unique Pokemon species I have caught.

**Why this priority**: Pokedex progress is a core progression metric that motivates gameplay, equal in importance to box count.

**Independent Test**: Can be tested by verifying the count of distinct pokemon_id values from the player's collection matches the displayed progress.

**Acceptance Scenarios**:

1. **Given** a player with 0 Pokemon, **When** they view the dashboard, **Then** the Pokedex shows 0 caught.
2. **Given** a player with 5 distinct Pokemon species, **When** they view the dashboard, **Then** the Pokedex shows 5 caught.
3. **Given** a player with multiple instances of the same Pokemon, **When** they view the dashboard, **Then** that species counts only once toward Pokedex progress.

---

### User Story 4 - View Badges (Priority: P3)

As a player, I want to see my earned badges so I can track my progress through gym challenges.

**Why this priority**: Badges represent longer-term progression. The feature depends on gym battle implementation which may not exist yet.

**Independent Test**: Can be tested by displaying badge count or icons for a player with various badge states.

**Acceptance Scenarios**:

1. **Given** a player with 0 badges, **When** they view the dashboard, **Then** they see an indicator showing no badges earned.
2. **Given** a player with 3 badges, **When** they view the dashboard, **Then** they see 3 badges displayed (either as icons or count).
3. **Given** a player who earns a new badge, **When** they return to the dashboard, **Then** the badge display reflects the new total.

---

### User Story 5 - Navigate to Detailed Stats (Priority: P3)

As a player, I want a button or link to access a detailed stats page so I can view more comprehensive information about my Pokemon.

**Why this priority**: This is navigation functionality that depends on having a stats page to navigate to.

**Independent Test**: Can be tested by verifying the link/button is present and navigates to the correct destination.

**Acceptance Scenarios**:

1. **Given** a player on the dashboard, **When** they look for stats access, **Then** they see a clearly labeled button or link.
2. **Given** a player who clicks the stats button, **When** the navigation completes, **Then** they are taken to the detailed stats page.

---

### Edge Cases

- What happens when a Pokemon has no sprite image available in Source data?
- How does the HP bar display when current_hp equals max_hp (full health)?
- How does the HP bar display when current_hp is 0 (fainted)?
- What happens when the dashboard loads but the database query fails?
- How does the dashboard behave when data is loading?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display the player's active party (up to 6 Pokemon) ordered by slot_number.
- **FR-002**: System MUST show each active Pokemon's sprite, name, types, level, and HP bar.
- **FR-003**: HP bars MUST visually represent the ratio of current_hp to max_hp.
- **FR-004**: System MUST display the box count (total Pokemon with is_active = false).
- **FR-005**: System MUST display Pokedex progress as a count of distinct pokemon_id values the player has caught.
- **FR-006**: System MUST display badge information (count or icons).
- **FR-007**: System MUST provide navigation to a detailed stats page.
- **FR-008**: Dashboard MUST update when party composition changes (slot reassignment, Pokemon added/removed from active party).
- **FR-009**: Dashboard MUST update when Pokemon level up.
- **FR-010**: System MUST merge database records with Source data (from lib/pokemonData.js) to display complete Pokemon information.
- **FR-011**: System MUST show appropriate loading states while data is being fetched.
- **FR-012**: System MUST show appropriate error states if data fetching fails.
- **FR-013**: System MUST show a fallback display for Pokemon without sprite images.

### Key Entities

- **Player Pokemon (player_pokemon table)**: Individual Pokemon owned by a player, includes pokemon_id, level, current_hp, max_hp, is_active, slot_number, user_id.
- **Source Pokemon Data (Source/pokemon/pokemon.json)**: Static game data including name, type, sprite, artwork, base stats.
- **Player Badges**: Represents gym victories. Note: Badge storage mechanism may need to be defined if not already in database schema.
- **Pokedex Entry**: Derived from distinct pokemon_id values across all player_pokemon records for a user.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can view their complete active party status (all 6 slots) in under 2 seconds from page load.
- **SC-002**: 100% of active Pokemon display correct sprite, name, types, level, and HP information matching database and Source data.
- **SC-003**: HP bars accurately reflect the current_hp/max_hp ratio within 1% visual accuracy.
- **SC-004**: Box count accurately reflects the total number of stored Pokemon (is_active = false).
- **SC-005**: Pokedex count accurately reflects distinct caught species (no duplicates counted).
- **SC-006**: Dashboard updates reflect changes within 1 second of data modification (party changes, level ups).
- **SC-007**: 95% of users can locate and use the stats page navigation on first attempt.

## Assumptions

- The player_pokemon table already exists with user_id, pokemon_id, level, is_active, slot_number fields (confirmed from sql/002_create_player_pokemon.sql).
- The current_hp and max_hp fields may need to be added to player_pokemon if not present (the existing schema shows level but not HP fields).
- Badge tracking mechanism is not yet implemented. The feature will display a placeholder or 0 count until badges are available.
- The "seen" Pokemon tracking (as opposed to "caught") is deferred; Pokedex will initially only show caught count.
- lib/pokemonData.js provides buildPlayerPokemonResponse() and buildPlayerPokemonListResponse() for merging database records with Source data.
- Component organization should follow existing pattern in components/ directory (e.g., components/Dashboard/ or components/Roster/).

## Out of Scope

- Individual Pokemon detail/stats page (navigation link provided, but page itself is separate feature)
- Pokemon party reordering functionality
- Pokemon box/storage management interface
- "Seen" Pokemon tracking for Pokedex
- Real-time updates via websockets (polling or page refresh is acceptable)
- Badge earning logic (gym battles)
