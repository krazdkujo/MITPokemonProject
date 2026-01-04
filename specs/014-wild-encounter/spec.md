# Feature Specification: Wild Pokemon Encounter Page

**Feature Branch**: `014-wild-encounter`
**Created**: 2026-01-04
**Status**: Draft
**Input**: User description: "Implement the Wild Pokemon encounter page. This is a Next.js page at pages/wild.js that lets players find and encounter wild Pokemon."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse and Select Location (Priority: P1)

As a player, I want to browse available encounter locations and select one so that I can search for wild Pokemon in that area.

**Why this priority**: Location selection is the entry point for the entire wild encounter feature. Without being able to view and select a location, no encounters can happen.

**Independent Test**: Can be fully tested by displaying the location grid and allowing selection. Delivers value by showing players what areas are available for exploration.

**Acceptance Scenarios**:

1. **Given** I am on the wild encounter page, **When** the page loads, **Then** I see a grid/list of available encounter locations
2. **Given** I am viewing the location list, **When** I view a location card, **Then** I see the area name, Pokemon species available, and level range
3. **Given** I am viewing locations, **When** I click on a location, **Then** that location becomes visually highlighted/selected
4. **Given** no location is selected, **When** I view the Search button, **Then** it is disabled
5. **Given** a location is selected, **When** I view the Search button, **Then** it is enabled

---

### User Story 2 - Search for Wild Pokemon (Priority: P1)

As a player, I want to search for wild Pokemon in my selected location so that I can encounter random Pokemon from that area.

**Why this priority**: Encounter generation is the core functionality that connects location selection to the actual gameplay experience.

**Independent Test**: Can be fully tested by selecting a location and clicking search. Delivers value by creating the excitement of discovering which Pokemon appears.

**Acceptance Scenarios**:

1. **Given** I have selected a location, **When** I click "Search for Pokemon", **Then** a random wild Pokemon from that location's pool appears
2. **Given** a wild encounter is generated, **When** I view the encounter display, **Then** I see the Pokemon's sprite, name, level, and type(s)
3. **Given** a wild Pokemon has appeared, **When** I view the action buttons, **Then** I see "Battle" and "Flee" options

---

### User Story 3 - Battle or Flee Decision (Priority: P1)

As a player, I want to choose whether to battle or flee from an encountered Pokemon so that I have control over my gameplay experience.

**Why this priority**: Player agency in deciding to engage or retreat is essential for the core game loop and risk management.

**Independent Test**: Can be fully tested after an encounter appears. Delivers value by giving players meaningful choice in their adventure.

**Acceptance Scenarios**:

1. **Given** a wild Pokemon is displayed, **When** I click "Battle", **Then** I am navigated to the combat arena with the wild Pokemon as my opponent
2. **Given** a wild Pokemon is displayed, **When** I click "Flee", **Then** the encounter is cleared and I return to location selection
3. **Given** I navigate to battle, **When** the combat page loads, **Then** it has access to the wild Pokemon data and battle session information

---

### User Story 4 - Party Validation (Priority: P2)

As a player, I should be prevented from searching for wild Pokemon if I don't have a valid party, so that I am guided to prepare properly before adventuring.

**Why this priority**: Error handling for invalid game states protects player experience but is secondary to core functionality.

**Independent Test**: Can be tested by attempting to access wild encounters without a party. Delivers value by preventing confusing error states.

**Acceptance Scenarios**:

1. **Given** I have no Pokemon in my party, **When** I attempt to search for Pokemon, **Then** I see an error message and am guided to select a starter
2. **Given** all my party Pokemon are fainted, **When** I attempt to search for Pokemon, **Then** I see a message guiding me to the Pokemon Center

---

### Edge Cases

- What happens when the encounter generation request fails due to network issues?
  - System displays an error message with a "Retry" option
- What happens if a player rapidly clicks the search button?
  - Button becomes disabled during the search request to prevent duplicate encounters
- What happens if the player navigates away during encounter generation?
  - Any in-progress request is cancelled; no partial state is saved
- What happens if location data fails to load?
  - System displays an error state with option to refresh

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a collection of available encounter locations on page load
- **FR-002**: Each location card MUST show the area name, list of Pokemon species that can be found there, and the level range
- **FR-003**: System MUST allow users to select exactly one location at a time
- **FR-004**: System MUST visually indicate the currently selected location
- **FR-005**: The search button MUST be disabled when no location is selected
- **FR-006**: System MUST generate a random wild Pokemon encounter based on the selected location's Pokemon pool and level range when search is triggered
- **FR-007**: System MUST display the encountered wild Pokemon with its sprite image, name, level, and type(s)
- **FR-008**: System MUST provide "Battle" and "Flee" action buttons when a wild Pokemon is displayed
- **FR-009**: Clicking "Battle" MUST navigate the user to the combat page with the encounter data (opponent Pokemon and battle session ID)
- **FR-010**: Clicking "Flee" MUST clear the current encounter and return the user to location selection view
- **FR-011**: System MUST validate that the player has at least one non-fainted Pokemon before allowing a search
- **FR-012**: System MUST display appropriate error messages when the player has no party or all party Pokemon are fainted
- **FR-013**: System MUST provide a retry option when encounter generation fails
- **FR-014**: Initial MVP MUST include 3-5 encounter locations with distinct Pokemon pools

### Key Entities

- **Location**: Represents an explorable area where wild Pokemon can be found. Contains area name, description, list of available Pokemon species, and level range for encounters.
- **Wild Encounter**: Represents a generated encounter with a wild Pokemon. Contains the Pokemon's identity, level, stats, and reference to the battle session.
- **Pokemon Pool**: The collection of Pokemon species that can appear in a specific location, each with relative encounter rates.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can view and select from available locations within 2 seconds of page load
- **SC-002**: Wild Pokemon encounters generate and display within 3 seconds of clicking search
- **SC-003**: 95% of players successfully complete the location selection to battle/flee flow on first attempt
- **SC-004**: Transition from clicking "Battle" to combat page ready state occurs within 2 seconds
- **SC-005**: All error states (no party, fainted party, network failure) display clear guidance messages
- **SC-006**: Players can flee from an encounter and start a new search within 5 seconds

## Assumptions

- Location data will be defined in a static data file (e.g., Source/locations.json) for MVP, rather than fetched from a database
- The existing `/api/battle/start` endpoint accepts an `encounter_type: "wild"` parameter and returns appropriate wild Pokemon data
- Pokemon sprites are already available in the `public/images/pokemon/` directory as established in feature 004
- The combat page (`/combat`) already exists and can receive encounter data via navigation state or query parameters
- Player party data is accessible via the existing authentication and Supabase integration
- Level ranges are inclusive (e.g., "Levels 2-5" means the wild Pokemon can be level 2, 3, 4, or 5)
