# Feature Specification: Player Statistics Page

**Feature Branch**: `005-player-statistics`
**Created**: 2026-01-03
**Status**: Draft
**Input**: User description: "Create a detailed statistics page accessible from the dashboard showing comprehensive player analytics including battle records, Pokemon collection by type, badge progression, and performance visualizations."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Collection Statistics (Priority: P1)

A player navigates to the statistics page from the dashboard to see a comprehensive breakdown of their Pokemon collection. They want to understand what types of Pokemon they have captured and identify gaps in their collection strategy.

**Why this priority**: Collection statistics form the foundation of all analytics. Players need to understand what Pokemon they have before analyzing battle performance. This directly queries existing `player_pokemon` data without requiring new tables.

**Independent Test**: Can be fully tested by navigating to /stats and verifying the collection breakdown displays correctly with accurate type counts based on player's actual Pokemon records.

**Acceptance Scenarios**:

1. **Given** a player with 10 Pokemon in their collection, **When** they navigate to the statistics page, **Then** they see a breakdown showing total Pokemon count and distribution by type.
2. **Given** a player with Pokemon of multiple types (e.g., 5 Water, 3 Fire, 2 Grass), **When** they view the type breakdown, **Then** each type shows the correct count and percentage of their collection.
3. **Given** a player with dual-type Pokemon (e.g., Bulbasaur is Grass/Poison), **When** viewing type statistics, **Then** the Pokemon is counted in both relevant type categories.
4. **Given** a player with no Pokemon, **When** they navigate to the statistics page, **Then** they see a friendly message indicating no collection data is available yet.

---

### User Story 2 - View Pokemon Level Distribution (Priority: P2)

A player wants to see which of their Pokemon have the highest levels and understand the overall level distribution of their collection to plan training strategies.

**Why this priority**: Level data already exists in `player_pokemon` and provides actionable insights for players to identify which Pokemon need more training attention.

**Independent Test**: Can be fully tested by displaying a ranked list of Pokemon by level and a distribution chart showing level ranges.

**Acceptance Scenarios**:

1. **Given** a player with multiple Pokemon at various levels, **When** they view the statistics page, **Then** they see a "Top Pokemon" section showing their highest-level Pokemon ranked in descending order.
2. **Given** a player with 15 Pokemon at levels ranging from 1 to 20, **When** they view level distribution, **Then** they see a visual representation (chart/graph) of how many Pokemon fall into each level range.
3. **Given** a player with only one Pokemon, **When** viewing the statistics page, **Then** that Pokemon is displayed as their top Pokemon with its current level.

---

### User Story 3 - View Battle Statistics (Priority: P3)

A player wants to review their battle history to understand their win/loss record and identify which Pokemon contribute most to their victories.

**Why this priority**: Battle statistics require new database tables (battles, battle_participants) that do not currently exist. This story depends on battle system implementation but is valuable for understanding player strategy effectiveness.

**Independent Test**: Can be tested once battle tracking tables exist by displaying win/loss counts and most-used Pokemon in battles.

**Acceptance Scenarios**:

1. **Given** a player with 20 battles recorded (15 wins, 5 losses), **When** they view battle statistics, **Then** they see their total battles, wins, losses, and win percentage.
2. **Given** a player with battle history, **When** they view "Most Used Pokemon", **Then** they see a ranked list of Pokemon by battle participation count.
3. **Given** a player with no battle history, **When** they view battle statistics, **Then** they see a message indicating no battles have been recorded yet.

---

### User Story 4 - View Badge Progression (Priority: P4)

A player wants to track their badge collection progress over time, seeing when they earned each badge and how many remain to collect.

**Why this priority**: Badge tracking requires new database tables (badges, player_badges with timestamps) that do not currently exist. This provides long-term goal visualization but depends on gym/badge system implementation.

**Independent Test**: Can be tested once badge tables exist by displaying earned badges with timestamps and remaining badges to collect.

**Acceptance Scenarios**:

1. **Given** a player with 3 of 8 gym badges earned, **When** they view badge progression, **Then** they see earned badges highlighted with acquisition dates and remaining badges shown as unearned.
2. **Given** a player with badges earned over time, **When** viewing the timeline, **Then** badges are displayed chronologically showing progression over their journey.
3. **Given** a player with no badges, **When** viewing badge progression, **Then** all 8 badges appear as unearned with encouragement to challenge gyms.

---

### Edge Cases

- What happens when the player has dual-type Pokemon that are counted in multiple type categories? (Counts toward both types, with clear labeling)
- How does the system handle Pokemon with unknown or invalid pokemon_id values? (Displays as "Unknown Pokemon" with placeholder image per existing pattern)
- What happens when Source data is unavailable for type information? (Graceful fallback showing ID only, logging error for debugging)
- How are statistics displayed on mobile devices with limited screen space? (Responsive design with stacked layouts and scrollable charts)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a dedicated statistics page accessible from the dashboard via the existing "View Detailed Stats" link.
- **FR-002**: System MUST show total Pokemon count with breakdown by type, merging `player_pokemon` records with Source data to determine types.
- **FR-003**: System MUST correctly count dual-type Pokemon in both relevant type categories.
- **FR-004**: System MUST display a ranked list of the player's highest-level Pokemon (top 5-10).
- **FR-005**: System MUST show level distribution visualization (histogram or bar chart) grouping Pokemon by level ranges.
- **FR-006**: System MUST handle empty data states gracefully with informative messages rather than empty displays.
- **FR-007**: System MUST use the existing `lib/pokemonData.js` utilities for merging database IDs with Source data.
- **FR-008**: System MUST follow existing component architecture by creating components in a `components/Stats/` directory.
- **FR-009**: System MUST protect the statistics page with authentication using the existing AuthGuard pattern.
- **FR-010**: System MUST display battle win/loss statistics when battle tracking data is available (requires battles table).
- **FR-011**: System MUST display badge progression timeline when badge data is available (requires badges tables).
- **FR-012**: System MUST render visualizations (charts/graphs) for progress tracking that help students understand automation strategy performance.
- **FR-013**: System MUST be responsive and display appropriately on mobile, tablet, and desktop viewports.

### Key Entities

- **Player Statistics**: Aggregated view combining collection metrics, level distribution, and optionally battle/badge data for a single player.
- **Type Distribution**: Count and percentage of Pokemon by type, derived by joining `player_pokemon` with Source Pokemon data.
- **Level Distribution**: Histogram data showing count of Pokemon in each level range (1-5, 6-10, 11-15, 16-20).
- **Battle Record**: (Future) Win/loss counts and participation statistics per Pokemon.
- **Badge Timeline**: (Future) Chronological record of badge acquisitions with timestamps.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can navigate from dashboard to statistics page and view their complete collection breakdown in under 3 seconds.
- **SC-002**: Type distribution accurately reflects all Pokemon in the player's collection, with dual-type Pokemon counted appropriately in both categories.
- **SC-003**: Level distribution visualization clearly shows the spread of Pokemon levels across the valid range (1-20).
- **SC-004**: 100% of players with at least one Pokemon see meaningful statistics upon page load.
- **SC-005**: Statistics page renders correctly on viewports from 320px (mobile) to 1920px (desktop).
- **SC-006**: Empty states provide actionable guidance (e.g., "Catch more Pokemon to see type statistics").
- **SC-007**: All statistics data refreshes accurately when players return to the page after catching new Pokemon or completing battles.

## Assumptions

- The existing `player_pokemon` table and Source Pokemon data provide sufficient information for collection and level statistics.
- Battle and badge tracking tables will be implemented as part of their respective features; this feature should gracefully handle their absence.
- The existing Next.js page routing, AuthGuard component, and API patterns established in prior features should be followed.
- Chart/visualization library choice is left to implementation planning (could be Chart.js, Recharts, or similar).
- The statistics API endpoint will aggregate data server-side to minimize client-side processing.
