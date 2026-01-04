# Feature Specification: Zone-Based Pokemon Encounters

**Feature Branch**: `016-zone-encounters`
**Created**: 2026-01-04
**Status**: Draft
**Input**: User description: "Wild Pokemon should be found in generic zones that are relevant to their type, and the intensity should be related to the difficulty. Example: Easy water, pond, medium difficulty water, river or lake, difficult water, ocean. This should use all 1100+ pokemon not just the first 151"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse Encounter Zones by Type (Priority: P1)

A player wants to find specific types of Pokemon and can browse available encounter zones organized by terrain type. They see zones grouped by their primary element (Water, Fire, Grass, etc.) with clear difficulty indicators showing which zones are appropriate for their team's level.

**Why this priority**: This is the core navigation flow. Without being able to discover and select zones, players cannot engage with the encounter system at all.

**Independent Test**: Can be fully tested by loading the encounter page and verifying zones display organized by type with difficulty ratings visible.

**Acceptance Scenarios**:

1. **Given** a player visits the encounter page, **When** the page loads, **Then** they see zones grouped by terrain type (Water, Fire, Forest, Cave, etc.)
2. **Given** zones are displayed, **When** the player views a terrain category, **Then** they see multiple zones of varying difficulty within that type
3. **Given** a zone is displayed, **When** the player views zone details, **Then** they see the zone name, description, difficulty level, and terrain type

---

### User Story 2 - Encounter Type-Appropriate Pokemon (Priority: P1)

A player selects a Water terrain zone and encounters wild Pokemon that are primarily Water-type (or types that logically inhabit water environments). The Pokemon's strength matches the zone's difficulty level.

**Why this priority**: This is the core functionality - matching Pokemon types to zone themes. Equal priority with P1 as both are required for a functional system.

**Independent Test**: Can be fully tested by selecting a zone and verifying the encountered Pokemon matches the zone's type theme and difficulty level.

**Acceptance Scenarios**:

1. **Given** a player selects a Pond zone (easy Water), **When** they trigger an encounter, **Then** they face a Water-type Pokemon with low SR rating
2. **Given** a player selects an Ocean zone (hard Water), **When** they trigger an encounter, **Then** they face a Water-type Pokemon with high SR rating
3. **Given** any zone is selected, **When** an encounter is generated, **Then** the Pokemon is drawn from the full 1100+ Pokemon pool (not limited to Gen 1)

---

### User Story 3 - Understand Zone Difficulty Before Entry (Priority: P2)

Before entering a zone, a player can see difficulty information that helps them decide if their team is ready. Difficulty is shown in a clear, intuitive way (not just numbers).

**Why this priority**: Improves user experience by preventing frustration from accidentally entering zones too difficult for the player's team.

**Independent Test**: Can be fully tested by viewing zone cards and verifying difficulty information displays with clear visual indicators.

**Acceptance Scenarios**:

1. **Given** a zone card is displayed, **When** the player views it, **Then** they see a difficulty indicator (Easy/Medium/Hard/Expert or similar)
2. **Given** a zone has an SR range, **When** displayed, **Then** the difficulty translates to user-friendly terms rather than raw SR numbers
3. **Given** multiple zones of the same type, **When** compared, **Then** the difficulty progression is clear and logical

---

### User Story 4 - Access Pokemon Across All Generations (Priority: P2)

Players encounter Pokemon from all generations (1-9, 1100+ total), not just the original 151. Zones draw from the full pool of Pokemon that match the zone's type and difficulty criteria.

**Why this priority**: Expands content variety significantly, making the game more engaging for players familiar with later generations.

**Independent Test**: Can be fully tested by repeatedly encountering Pokemon in various zones and verifying non-Gen1 Pokemon appear.

**Acceptance Scenarios**:

1. **Given** the Water zones, **When** encounters are generated over time, **Then** Pokemon from Gen 1-9 appear (Squirtle, Mudkip, Piplup, Oshawott, etc.)
2. **Given** the Fire zones, **When** encounters are generated, **Then** later-generation Fire types appear (Chimchar, Tepig, Fennekin, Scorbunny, etc.)
3. **Given** any zone type, **When** the pool is calculated, **Then** all eligible Pokemon from the 1142 available are included

---

### User Story 5 - Resume Interrupted Battles (Priority: P1)

A player who navigates away from the combat tab mid-battle (or closes the browser) can return and seamlessly continue their battle. The system automatically loads them back into their active encounter without requiring manual intervention.

**Why this priority**: Critical for data integrity and user experience. Without persistence, players lose battle progress on any navigation or connection issue.

**Independent Test**: Can be fully tested by starting a battle, navigating away, returning to combat tab, and verifying the battle auto-resumes with correct state.

**Acceptance Scenarios**:

1. **Given** a player has an active battle, **When** they navigate to a different tab and return to combat, **Then** the battle automatically loads with all state preserved
2. **Given** a player closes the browser mid-battle, **When** they log back in and visit the combat tab, **Then** their active battle resumes automatically
3. **Given** a player has an active battle, **When** they try to start a new encounter from zones, **Then** they are blocked until current battle is resolved

---

### User Story 6 - Experience Themed Zone Progression (Priority: P3)

Each terrain type offers a natural progression from easy to hard zones with thematically appropriate names. Water goes from Pond to River to Ocean. Fire goes from Campfire to Volcanic Cave to Active Volcano.

**Why this priority**: Adds polish and immersion to the experience but is not functionally required.

**Independent Test**: Can be fully tested by viewing all zones within a terrain type and verifying names follow a logical thematic progression.

**Acceptance Scenarios**:

1. **Given** Water terrain zones, **When** listed, **Then** zone names reflect difficulty (e.g., Pond < Lake < River < Ocean)
2. **Given** Fire terrain zones, **When** listed, **Then** zone names reflect intensity (e.g., Hot Springs < Volcanic Cave < Active Caldera)
3. **Given** any terrain type, **When** zones are displayed in order, **Then** the naming conveys increasing challenge

---

### Edge Cases

- What happens when a terrain type has no Pokemon at a specific SR range? System shows the zone as available but with reduced variety in encounter pool.
- How does the system handle dual-type Pokemon? Pokemon are included in zones if either of their types matches the zone theme.
- What happens with Pokemon that have unusual types for their environment? Type-to-zone mapping uses logical rules (Flying Pokemon can appear in Mountain zones, Ground in Cave, etc.).
- What if a player has no Pokemon strong enough for any available zone? At least one zone per terrain type has Easy difficulty available.
- What happens if a player has an active battle and tries to start a new encounter? System blocks new encounters until current battle is resolved (victory, defeat, flee, or abandon).
- What happens if player closes browser mid-battle? Battle state persists in database; player resumes on next visit to combat tab.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide encounter zones organized by terrain type (at minimum: Water, Fire, Grass, Electric, Cave, Forest, Mountain, Urban)
- **FR-002**: System MUST offer at least 3 difficulty tiers per terrain type (Easy, Medium, Hard at minimum)
- **FR-003**: System MUST map Pokemon types to appropriate terrain zones (Water-type to Water terrain, Fire-type to Fire terrain, etc.)
- **FR-004**: System MUST include all 1142 Pokemon in the encounter pool, not limited to Generation 1
- **FR-005**: System MUST filter Pokemon by SR rating to match zone difficulty
- **FR-006**: System MUST display difficulty in user-friendly terms (not raw SR numbers)
- **FR-007**: System MUST include dual-type Pokemon in any zone matching either of their types
- **FR-008**: System MUST weight encounter chances so Pokemon appropriate to the zone theme appear most frequently
- **FR-009**: Each zone MUST have a thematic name and description appropriate to its terrain and difficulty
- **FR-010**: Zone selection MUST show terrain type, zone name, difficulty level, and brief description
- **FR-011**: System MUST create a persistent battle record in the database when a player confirms zone selection and triggers an encounter
- **FR-012**: System MUST preserve active battle state if player navigates away from the combat tab
- **FR-013**: System MUST automatically load and resume the active battle when player returns to the combat tab (seamless, no confirmation required)
- **FR-014**: System MUST terminate battle records upon victory, defeat, flee, or explicit abandon/forfeit
- **FR-015**: System MUST provide an explicit abandon/forfeit option for players to end a battle (treated same as flee: counts as loss, opponent escapes)
- **FR-016**: System MUST block new encounter creation if player has an active battle in progress

### Key Entities

- **Zone**: A named encounter area with terrain type, difficulty level (SR range), thematic description, and Pokemon pool
- **Terrain Type**: A category grouping related zones (Water, Fire, Grass, etc.) with type-to-terrain mapping rules
- **Encounter Pool**: The filtered set of Pokemon eligible for a zone based on type and SR criteria
- **Difficulty Tier**: A user-friendly label (Easy/Medium/Hard/Expert) mapped to SR ranges
- **Active Battle**: A persistent database record tracking an ongoing encounter including: player ID, zone ID, opponent Pokemon, grid positions, current HP for all combatants, status effects, PP remaining, turn order, round number, battle phase, and timestamps

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can browse and select from at least 24 distinct zones (8 terrain types x 3 difficulty tiers minimum)
- **SC-002**: 100% of encounters in a zone produce Pokemon matching the zone's type theme
- **SC-003**: Pokemon from Generation 2+ appear in at least 50% of encounters (demonstrating full pool usage)
- **SC-004**: Players can identify zone difficulty within 2 seconds of viewing a zone card
- **SC-005**: Each terrain type has at least one Easy-difficulty zone accessible to new players
- **SC-006**: Zone names and descriptions accurately convey the expected difficulty and theme

## Clarifications

### Session 2026-01-04

- Q: When should the battle record be created in the database? → A: Create battle record when encounter starts (zone selection confirms)
- Q: What conditions terminate a battle record? → A: Victory, defeat, flee, or explicit abandon/forfeit action
- Q: How should players re-enter an active battle when returning to combat tab? → A: Auto-load directly into the active battle (seamless resume)
- Q: What level of battle state needs to be persisted? → A: Full turn-by-turn (HP, positions, status effects, PP, turn order, round number)
- Q: Should abandoning a battle have gameplay consequences? → A: Same as flee (counts as loss, opponent Pokemon escapes)

## Assumptions

- The existing Source/pokemon/pokemon.json contains all 1142 Pokemon with `type` (array), `sr` (species rating), and `number` (dex number) fields
- The current SR-based difficulty system from existing locations.json will be adapted for the new zone structure
- Terrain-to-type mapping follows logical game conventions (Water terrain = Water/Ice types, Cave = Rock/Ground/Dark types, etc.)
- The existing encounter/battle flow (wild.js, combat.js) will be adapted to use the new zone system
- Zone data will be stored as static configuration (like current locations.json) rather than in the database
