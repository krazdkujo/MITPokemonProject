# Feature Specification: Pokemon Center Page

**Feature Branch**: `012-pokecenter-page`
**Created**: 2026-01-04
**Status**: Draft
**Input**: User description: "Implement the Pokemon Center page for healing Pokemon. This is a Next.js page at pages/pokecenter.js that displays the party and healing interface."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Heal Damaged Pokemon Party (Priority: P1)

As a player with Pokemon that have taken damage in battles, I want to visit the Pokemon Center to restore all my Pokemon to full health so I can continue playing without weakened team members.

**Why this priority**: This is the core functionality of the Pokemon Center - healing is the primary reason players visit this location. Without healing, the page serves no purpose.

**Independent Test**: Can be fully tested by visiting the page with damaged Pokemon, clicking "Heal All", and verifying all Pokemon HP and move PP are restored to maximum values.

**Acceptance Scenarios**:

1. **Given** I have Pokemon with reduced HP, **When** I visit the Pokemon Center page, **Then** I see all my active party Pokemon displayed with their current health status
2. **Given** I have damaged Pokemon and click "Heal All", **When** the healing completes, **Then** all Pokemon HP are restored to maximum and all move PP are restored
3. **Given** I have damaged Pokemon and click "Heal All", **When** the healing completes, **Then** I see a success message confirming healing and the HP bars visually update

---

### User Story 2 - View Party Health Status (Priority: P2)

As a player, I want to see my entire party's health status at a glance when visiting the Pokemon Center so I can understand which Pokemon need healing and their current condition.

**Why this priority**: Viewing health status is essential for the user experience but is secondary to the actual healing functionality. Players need to see status before deciding to heal.

**Independent Test**: Can be tested by visiting the page with Pokemon at various health levels and verifying all information displays correctly without performing any healing action.

**Acceptance Scenarios**:

1. **Given** I have active Pokemon in my party, **When** I visit the Pokemon Center, **Then** I see each Pokemon displayed with sprite, name, level, and HP bar
2. **Given** I have Pokemon at different health levels, **When** I view the party display, **Then** HP bars are color-coded (green >50%, yellow 25-50%, red <25%)
3. **Given** I have Pokemon in my party, **When** I click on a Pokemon, **Then** I can see detailed information including move PP status

---

### User Story 3 - Handle Already Healthy Party (Priority: P3)

As a player with a fully healed party, I want clear feedback that my Pokemon don't need healing so I don't waste time or become confused about whether healing worked.

**Why this priority**: This is an edge case that improves user experience but isn't part of the primary healing flow. Most visits will involve damaged Pokemon.

**Independent Test**: Can be tested by visiting the page with all Pokemon at full HP and verifying the appropriate messaging and disabled button state.

**Acceptance Scenarios**:

1. **Given** all my Pokemon are at full HP and PP, **When** I visit the Pokemon Center, **Then** the "Heal All" button is disabled
2. **Given** all my Pokemon are healthy, **When** I view the page, **Then** I see a message indicating "Your Pokemon are already healthy!"

---

### User Story 4 - Handle Empty Party (Priority: P3)

As a new player without any Pokemon, I want helpful guidance when visiting the Pokemon Center so I understand I need to get a starter Pokemon first.

**Why this priority**: This is an edge case for new users who haven't selected a starter yet. Low frequency but important for onboarding experience.

**Independent Test**: Can be tested by visiting the page with no active Pokemon in party and verifying the appropriate empty state message.

**Acceptance Scenarios**:

1. **Given** I have no active Pokemon in my party, **When** I visit the Pokemon Center, **Then** I see a message "You have no Pokemon! Select a starter first."

---

### Edge Cases

- What happens when healing fails due to network error? System shows error message with retry option.
- What happens when user rapidly clicks "Heal All" multiple times? Button is disabled during healing to prevent duplicate requests.
- What happens if Pokemon data fails to load? System shows error state with option to retry loading.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a themed welcome message from Nurse Joy when user visits the Pokemon Center
- **FR-002**: System MUST fetch and display all active party Pokemon (up to 6) on page load
- **FR-003**: System MUST display each Pokemon with sprite image, name, level, current HP, max HP, and HP bar
- **FR-004**: System MUST color-code HP bars: green (>50%), yellow (25-50%), red (<25%)
- **FR-005**: System MUST provide a "Heal All" button to initiate healing for all party Pokemon
- **FR-006**: System MUST call the healing endpoint when "Heal All" is clicked
- **FR-007**: System MUST show loading state while healing is in progress
- **FR-008**: System MUST update displayed HP and PP values after successful healing
- **FR-009**: System MUST display success message "Your Pokemon have been healed!" after healing completes
- **FR-010**: System MUST disable "Heal All" button when all Pokemon are at full HP and PP
- **FR-011**: System MUST display "Your Pokemon are already healthy!" message when party is fully healed
- **FR-012**: System MUST display "You have no Pokemon! Select a starter first." when party is empty
- **FR-013**: System MUST display error message with retry option if healing fails
- **FR-014**: System MUST allow users to view move PP status for each Pokemon (on click or detail view)

### Key Entities

- **Party Pokemon**: Player's active Pokemon (up to 6), including sprite reference, name, level, current HP, max HP, and move data with PP values
- **Move**: Pokemon's learned moves with current PP and maximum PP
- **Health Status**: Derived state indicating whether Pokemon needs healing (current HP < max HP or any move PP < max PP)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view their party health status within 2 seconds of page load
- **SC-002**: Users can complete the full healing flow (view party, click heal, see confirmation) within 5 seconds
- **SC-003**: 100% of damaged Pokemon in party are healed (HP and PP restored) after successful heal action
- **SC-004**: Users receive clear visual feedback (HP bar animation) showing healing progress
- **SC-005**: Empty and fully-healed party states are immediately recognizable to users without confusion
- **SC-006**: Users can retry healing if an error occurs without needing to refresh the page

## Assumptions

- The healing API endpoint (POST /api/heal) already exists and handles HP and PP restoration
- The player Pokemon API endpoint (GET /api/player/pokemon) already exists and returns party data including HP, max HP, and move PP
- Pokemon sprite images are available at /images/pokemon/{number}.png
- Users must be authenticated to access the Pokemon Center page
- Healing is free of charge (no currency cost based on provided requirements)
