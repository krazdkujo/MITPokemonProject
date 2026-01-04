# Feature Specification: Game Navigation Layout

**Feature Branch**: `011-game-layout`
**Created**: 2026-01-04
**Status**: Draft
**Input**: User description: "Implement the main navigation layout for all play screens. This is a layout component used across all game pages."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate Between Game Sections (Priority: P1)

As a player, I want a consistent navigation system across all game pages so that I can easily move between different game features (Combat, PokeMart, Pokemon Center, Wild Pokemon, Inventory, Dashboard) without confusion.

**Why this priority**: Navigation is the foundational element that enables all other game features. Without reliable navigation, players cannot access any game functionality.

**Independent Test**: Can be fully tested by clicking each navigation link from any page and verifying the correct page loads. Delivers immediate value by enabling access to all game areas.

**Acceptance Scenarios**:

1. **Given** I am on any game page, **When** I click the "Combat Arena" navigation link, **Then** I am navigated to the combat page (/combat)
2. **Given** I am on any game page, **When** I click the "PokeMart" navigation link, **Then** I am navigated to the shop page (/pokemart)
3. **Given** I am on any game page, **When** I click the "Pokemon Center" navigation link, **Then** I am navigated to the healing page (/pokecenter)
4. **Given** I am on any game page, **When** I click the "Wild Pokemon" navigation link, **Then** I am navigated to the wild encounter page (/wild)
5. **Given** I am on any game page, **When** I click the "Inventory" navigation link, **Then** I am navigated to the inventory page (/inventory)
6. **Given** I am on any game page, **When** I click the "Dashboard" navigation link, **Then** I am navigated to the dashboard page (/dashboard)
7. **Given** I am on a specific page, **When** the page loads, **Then** the corresponding navigation link is visually highlighted as active

---

### User Story 2 - View Currency Balance (Priority: P1)

As a player, I want to see my current currency balance at all times so that I know how much I can spend at the PokeMart or Pokemon Center.

**Why this priority**: Currency awareness is essential for all economic decisions in the game. Players need this information constantly visible to make informed choices.

**Independent Test**: Can be tested by viewing the top navigation on any page and verifying the currency display matches the player's actual balance. Delivers value by keeping players informed of their resources.

**Acceptance Scenarios**:

1. **Given** I am logged in and on any game page, **When** the page loads, **Then** I see my current currency balance displayed in the top navigation
2. **Given** I make a purchase at the PokeMart, **When** the transaction completes, **Then** my displayed currency balance updates to reflect the new amount
3. **Given** I earn currency from a battle, **When** the reward is granted, **Then** my displayed currency balance updates accordingly

---

### User Story 3 - View Party Pokemon Status (Priority: P2)

As a player, I want to see a compact view of my party Pokemon with their health status in the sidebar so that I can quickly assess which Pokemon need healing.

**Why this priority**: Party awareness helps players make strategic decisions about when to visit the Pokemon Center versus continuing to battle. Important but secondary to basic navigation.

**Independent Test**: Can be tested by viewing the sidebar and verifying it displays up to 6 Pokemon with accurate HP indicators. Delivers value by providing at-a-glance party health information.

**Acceptance Scenarios**:

1. **Given** I am logged in with Pokemon in my party, **When** any game page loads, **Then** I see a mini display of my party Pokemon (up to 6) in the sidebar
2. **Given** I have a Pokemon with low HP (below 25% of max), **When** viewing the mini party display, **Then** that Pokemon shows a visual indicator (red HP bar or warning state)
3. **Given** I have a Pokemon with moderate HP (25-75% of max), **When** viewing the mini party display, **Then** that Pokemon shows a yellow/orange HP bar
4. **Given** I have a Pokemon with high HP (above 75% of max), **When** viewing the mini party display, **Then** that Pokemon shows a green HP bar
5. **Given** I click on a Pokemon in the mini party display, **When** the click is processed, **Then** I am navigated to the Pokemon Center page

---

### User Story 4 - View Player Identity (Priority: P3)

As a player, I want to see my player name and/or avatar in the navigation so that I can confirm I am logged in as the correct account.

**Why this priority**: Identity confirmation is useful for account verification but less critical than navigation and resource tracking for gameplay.

**Independent Test**: Can be tested by logging in and verifying the player name/avatar appears in the top navigation area.

**Acceptance Scenarios**:

1. **Given** I am logged in, **When** any game page loads, **Then** I see my player name displayed in the top navigation
2. **Given** I am logged in with an avatar, **When** any game page loads, **Then** I see my avatar image displayed in the top navigation

---

### Edge Cases

- What happens when the player has no Pokemon in their party? (Show empty party slots or a message prompting them to select a starter)
- What happens when currency balance is 0? (Display 0 with normal styling, no special treatment)
- What happens when the API fails to load player data? (Show loading state briefly, then display error state with retry option)
- What happens when a Pokemon in the party is fainted (0 HP)? (Show fainted indicator, distinct from low HP)
- What happens when navigation is accessed by an unauthenticated user? (Redirect to login page)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a persistent top navigation bar on all game pages containing the game logo/title, currency balance, and player identity
- **FR-002**: System MUST display a persistent left sidebar on all game pages containing navigation links and the mini party display
- **FR-003**: System MUST provide navigation links to: Combat Arena (/combat), PokeMart (/pokemart), Pokemon Center (/pokecenter), Wild Pokemon (/wild), Inventory (/inventory), and Dashboard (/dashboard)
- **FR-004**: Each navigation link MUST display an appropriate icon alongside the text label
- **FR-005**: System MUST highlight the currently active navigation link with a distinct visual state
- **FR-006**: System MUST display the player's current currency balance in the top navigation
- **FR-007**: System MUST update the currency display when the balance changes (purchases, rewards) without requiring a full page refresh
- **FR-008**: System MUST display up to 6 Pokemon in the mini party display with HP bars showing current health percentage
- **FR-009**: System MUST use color-coded HP bars: green (>75%), yellow/orange (25-75%), red (<25%)
- **FR-010**: System MUST display a distinct fainted indicator for Pokemon with 0 HP
- **FR-011**: Clicking a Pokemon in the mini party display MUST navigate the user to the Pokemon Center page
- **FR-012**: System MUST display the player's name in the top navigation
- **FR-013**: System MUST fetch player data (currency, party Pokemon) at the layout level and share with child pages
- **FR-014**: System MUST redirect unauthenticated users to the login page when accessing any game page
- **FR-015**: System MUST show a loading state while player data is being fetched
- **FR-016**: System MUST show an error state with retry option if player data fails to load

### Key Entities

- **Player**: The authenticated user with attributes: name, avatar, currency balance
- **Party Pokemon**: Pokemon owned by the player in their active party, with attributes: species, name/nickname, current HP, max HP, level, sprite/image
- **Navigation State**: Current active page, loading status, error status

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can navigate to any game section within 2 clicks from any page
- **SC-002**: Currency balance updates are visible within 1 second of a transaction completing
- **SC-003**: Party Pokemon HP status is accurately reflected with less than 1 second delay after HP changes
- **SC-004**: 100% of navigation links lead to the correct destination page
- **SC-005**: Layout renders consistently across all supported game pages
- **SC-006**: Players can identify injured Pokemon (low HP) at a glance without clicking or hovering
- **SC-007**: Page load time with layout does not exceed 3 seconds on standard connections

## Assumptions

- Player authentication is already implemented and provides user ID for data fetching
- The /api/player/pokemon endpoint exists and returns party Pokemon with HP information
- Currency data is available either through auth context or can be fetched with player data
- Pokemon sprites/images are available in the existing public/images/pokemon/ directory
- All target pages (/combat, /pokemart, /pokecenter, /wild, /inventory, /dashboard) exist or will be created
- Desktop-first design; responsive/mobile layouts are out of scope for initial implementation
