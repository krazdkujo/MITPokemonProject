# Tasks: Wild Pokemon Encounter Page

**Input**: Design documents from `/specs/014-wild-encounter/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Manual browser testing only (no automated tests specified)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Following existing Next.js project structure:
- **Pages**: `pages/` at repository root
- **Components**: `components/Wild/` for feature components
- **Utilities**: `lib/` for data loading functions
- **Source Data**: `Source/` for static JSON data
- **API Routes**: `pages/api/` for endpoints

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create data layer and utility functions needed by all user stories

- [x] T001 Create location data file at Source/locations.json with 4 MVP locations (Route 1, Viridian Forest, Route 22, Mt. Moon)
- [x] T002 Create location data utilities in lib/locationData.js with getAllLocations, getLocationById, selectRandomPokemon, generateEncounterLevel functions
- [x] T003 Create API endpoint to serve locations at pages/api/locations.js
- [x] T004 Create components/Wild/ directory for wild encounter components

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core components that MUST be complete before user story UI can be implemented

**CRITICAL**: These components are shared across multiple user stories

- [x] T005 [P] Create LocationCard component in components/Wild/LocationCard.js displaying location name, Pokemon preview images, level range, and terrain styling
- [x] T006 [P] Create EncounterDisplay component in components/Wild/EncounterDisplay.js showing wild Pokemon sprite, name, level, and type badges
- [x] T007 [P] Create EncounterActions component in components/Wild/EncounterActions.js with Battle and Flee buttons

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Browse and Select Location (Priority: P1)

**Goal**: Players can view available locations and select one to prepare for wild Pokemon search

**Independent Test**: Load /wild page, verify location grid displays, click locations to select/deselect, verify search button state changes

### Implementation for User Story 1

- [x] T008 [US1] Create LocationSelector component in components/Wild/LocationSelector.js that renders grid of LocationCard components with selection state management
- [x] T009 [US1] Update pages/wild.js to import and render LocationSelector component replacing placeholder content
- [x] T010 [US1] Add locations state and loading logic to pages/wild.js using fetch to /api/locations
- [x] T011 [US1] Add selectedLocation state to pages/wild.js with setter passed to LocationSelector
- [x] T012 [US1] Add Search button to pages/wild.js that is disabled when no location selected, enabled when location selected
- [x] T013 [US1] Add location loading error state and refresh option to pages/wild.js

**Checkpoint**: User Story 1 complete - players can browse locations, select one, and see search button become enabled

---

## Phase 4: User Story 2 - Search for Wild Pokemon (Priority: P1)

**Goal**: Players can trigger a wild Pokemon encounter and see the encountered Pokemon displayed

**Independent Test**: Select a location, click Search, verify wild Pokemon appears with correct sprite/name/level/types from location's pool

### Implementation for User Story 2

- [x] T014 [US2] Add encounter state (null or Pokemon data) and isSearching state to pages/wild.js
- [x] T015 [US2] Implement handleSearch function in pages/wild.js that uses selectRandomPokemon and generateEncounterLevel from lib/locationData.js
- [x] T016 [US2] Call /api/battle/start in handleSearch with player_pokemon_id (first healthy), opponent_pokemon_id, opponent_level, battle_type: "wild"
- [x] T017 [US2] Store battle response data (battle_id, opponent) in component state after successful API call
- [x] T018 [US2] Conditionally render EncounterDisplay component in pages/wild.js when encounter is active
- [x] T019 [US2] Conditionally render EncounterActions component in pages/wild.js when encounter is active
- [x] T020 [US2] Add loading state visual feedback during search (disable button, show spinner/text)
- [x] T021 [US2] Add error handling for failed encounter generation with retry option

**Checkpoint**: User Story 2 complete - players can search and see wild Pokemon with Battle/Flee options

---

## Phase 5: User Story 3 - Battle or Flee Decision (Priority: P1)

**Goal**: Players can choose to battle (navigate to combat) or flee (return to location selection)

**Independent Test**: After encounter appears, click Battle to navigate to /combat with battle_id; click Flee to clear encounter and return to location selection

### Implementation for User Story 3

- [x] T022 [US3] Import useRouter from next/router in pages/wild.js
- [x] T023 [US3] Implement handleBattle function in pages/wild.js that calls router.push with pathname /combat and query battle_id
- [x] T024 [US3] Implement handleFlee function in pages/wild.js that clears encounter state and battleData state
- [x] T025 [US3] Pass handleBattle and handleFlee as props to EncounterActions component
- [x] T026 [US3] Wire up Battle button onClick to handleBattle in EncounterActions component
- [x] T027 [US3] Wire up Flee button onClick to handleFlee in EncounterActions component
- [x] T028 [US3] Hide location selector and search button when encounter is active (show only encounter UI)

**Checkpoint**: User Story 3 complete - full wild encounter flow works end-to-end

---

## Phase 6: User Story 4 - Party Validation (Priority: P2)

**Goal**: Players without valid party are blocked from searching and guided to appropriate page

**Independent Test**: With no party, verify error message and link to starter selection; with all fainted, verify error and link to Pokemon Center

### Implementation for User Story 4

- [x] T029 [US4] Import useGame hook in pages/wild.js to access party data
- [x] T030 [US4] Add party validation check: hasParty = party.length > 0
- [x] T031 [US4] Add party validation check: hasHealthyPokemon = party.some(p => p.current_hp > 0)
- [x] T032 [US4] Create NoPartyError component inline in pages/wild.js with message and link to /starter
- [x] T033 [US4] Create AllFaintedError component inline in pages/wild.js with message and link to /pokecenter
- [x] T034 [US4] Conditionally render NoPartyError when !hasParty instead of location selector
- [x] T035 [US4] Conditionally render AllFaintedError when hasParty && !hasHealthyPokemon instead of location selector

**Checkpoint**: User Story 4 complete - invalid party states are handled gracefully

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect the overall experience

- [x] T036 [P] Add hover and focus states to LocationCard for better UX in components/Wild/LocationCard.js
- [x] T037 [P] Add terrain-based background colors to LocationCard (grass=green, cave=gray, forest=dark green, water=blue)
- [x] T038 [P] Add type badge colors to EncounterDisplay using existing type color constants from PartyCard.js
- [x] T039 Ensure responsive layout for mobile devices in all Wild components
- [x] T040 Add Pokemon species names below sprites in LocationCard preview
- [ ] T041 Run quickstart.md validation checklist manually in browser

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on T001 (locations.json) for LocationCard to show Pokemon preview
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1, US2, US3 are tightly coupled for this feature (sequential flow)
  - US4 is independent and can be done in parallel with US2/US3
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 - Provides location selection
- **User Story 2 (P1)**: Depends on US1 (needs selected location) - Adds search functionality
- **User Story 3 (P1)**: Depends on US2 (needs encounter data) - Adds battle/flee actions
- **User Story 4 (P2)**: Can start after Phase 2 - Independent error handling layer

### Within Each Phase

- Tasks marked [P] can run in parallel (different files)
- Tasks without [P] have implicit sequential dependencies

### Parallel Opportunities

**Phase 2 (all in parallel):**
```
T005: LocationCard.js
T006: EncounterDisplay.js
T007: EncounterActions.js
```

**Phase 7 (styling in parallel):**
```
T036: LocationCard hover states
T037: LocationCard terrain colors
T038: EncounterDisplay type colors
```

---

## Parallel Example: Phase 2 Foundational

```bash
# Launch all foundational components together:
Task: "Create LocationCard component in components/Wild/LocationCard.js"
Task: "Create EncounterDisplay component in components/Wild/EncounterDisplay.js"
Task: "Create EncounterActions component in components/Wild/EncounterActions.js"
```

---

## Implementation Strategy

### MVP First (User Stories 1-3)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T007)
3. Complete Phase 3: User Story 1 - Location Selection (T008-T013)
4. Complete Phase 4: User Story 2 - Search & Encounter (T014-T021)
5. Complete Phase 5: User Story 3 - Battle/Flee (T022-T028)
6. **STOP and VALIDATE**: Test full wild encounter flow end-to-end
7. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational -> Core infrastructure ready
2. User Story 1 -> Locations display and select (can demo browsing)
3. User Story 2 -> Search generates encounters (can demo discovery)
4. User Story 3 -> Battle navigation works (full flow complete)
5. User Story 4 -> Error states handled (polish)
6. Phase 7 -> Visual polish applied

### Suggested MVP Scope

**MVP = User Stories 1, 2, 3** (the core encounter flow)

User Story 4 (Party Validation) is P2 and can be deferred to post-MVP if needed.

---

## Task Summary

| Phase | Description | Task Count |
|-------|-------------|------------|
| Phase 1 | Setup | 4 tasks |
| Phase 2 | Foundational | 3 tasks |
| Phase 3 | US1 - Location Selection | 6 tasks |
| Phase 4 | US2 - Search & Encounter | 8 tasks |
| Phase 5 | US3 - Battle/Flee | 7 tasks |
| Phase 6 | US4 - Party Validation | 7 tasks |
| Phase 7 | Polish | 6 tasks |
| **Total** | | **41 tasks** |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No automated tests specified - manual browser testing per quickstart.md
- All new components in components/Wild/ directory
- Uses existing GameLayout wrapper (already in pages/wild.js placeholder)
- Uses existing /api/battle/start endpoint (no API changes needed)
