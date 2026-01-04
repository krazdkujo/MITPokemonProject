# Tasks: Starter Pokemon Selection

**Input**: Design documents from `/specs/002-starter-selection/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Manual testing via test auth flow (no automated tests requested)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Using Next.js pages structure per plan.md:
- API routes: `pages/api/`
- Pages: `pages/`
- Components: `components/`
- Utilities: `lib/`
- Migrations: `sql/`

---

## Phase 1: Setup

**Purpose**: Project structure for starter selection feature

- [x] T001 Create component directories: `components/starter/` and `components/layout/`
- [x] T002 [P] Create API route directories: `pages/api/pokemon/` and `pages/api/player/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Create database migration `sql/002_create_player_pokemon.sql` with table, indexes, RLS policies per data-model.md
- [ ] T004 Run migration in Supabase (manually via SQL editor or CLI)
- [x] T005 [P] Create `lib/pokemonData.js` with getAllPokemon(), getPokemonById(), getStarterPokemon(), buildPlayerPokemonResponse() functions
- [x] T006 [P] Create auth helper `lib/authHelper.js` to extract user_id from session token for API routes

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - New Player Selects Starter Pokemon (Priority: P1)

**Goal**: New users without Pokemon are redirected to starter selection, can browse and select a starter, which creates their first player_pokemon record

**Independent Test**: Create new test user via /api/auth/test-login, verify redirect to /starter-select, select a Pokemon, confirm it appears in roster at level 1

### API Implementation for User Story 1

- [x] T007 [US1] Implement GET handler in `pages/api/pokemon/starters.js` - load Source data, filter by SR <= 0.5, return pokemon list with sprites
- [x] T008 [US1] Implement GET handler in `pages/api/player/pokemon.js` - fetch user's Pokemon from database, merge with Source data via pokemonData.js
- [x] T009 [US1] Implement POST handler in `pages/api/player/pokemon.js` - validate pokemon_id, check user has no existing Pokemon, insert player_pokemon record

### Component Implementation for User Story 1

- [x] T010 [P] [US1] Create `components/starter/StarterCard.js` - display Pokemon sprite, name, types with click handler
- [x] T011 [P] [US1] Create `components/starter/ConfirmationModal.js` - show selected Pokemon details, permanent choice warning, confirm/cancel buttons
- [x] T012 [US1] Create `components/starter/StarterGrid.js` - fetch starters from API, render grid of StarterCard components, handle selection

### Page Implementation for User Story 1

- [x] T013 [US1] Create `pages/dashboard.js` - simple landing page showing "Welcome" and user's starter Pokemon
- [x] T014 [US1] Create `pages/starter-select.js` - render StarterGrid, handle selection confirmation, call POST API, redirect to dashboard on success
- [x] T015 [US1] Update `pages/index.js` - check if user has Pokemon via API, redirect to /starter-select if not, else to /dashboard

**Checkpoint**: User Story 1 complete - new users can select a starter and see it on dashboard

---

## Phase 4: User Story 2 - Player Filters Starters by Type (Priority: P2)

**Goal**: Users can filter the starter Pokemon list by selecting 1-2 types from a filter bar

**Independent Test**: Load starter selection page, apply type filter(s), verify only matching Pokemon are displayed, clear filters to see all

### API Enhancement for User Story 2

- [x] T016 [US2] Add `types` query parameter support to GET handler in `pages/api/pokemon/starters.js` - filter Pokemon by type(s), return available_types list

### Component Implementation for User Story 2

- [x] T017 [US2] Create `components/starter/TypeFilterBar.js` - display type buttons, track selected types (max 2), emit onChange with selected types
- [x] T018 [US2] Update `components/starter/StarterGrid.js` - integrate TypeFilterBar, pass types filter to API call, re-fetch on filter change

**Checkpoint**: User Story 2 complete - type filtering works on starter selection page

---

## Phase 5: User Story 3 - Existing Player Bypasses Starter Selection (Priority: P3)

**Goal**: Users who already have Pokemon skip starter selection and go directly to dashboard; direct navigation to /starter-select redirects them away

**Independent Test**: Login as user with existing Pokemon, verify immediate redirect to dashboard, try navigating to /starter-select URL directly, verify redirect to dashboard

### API Implementation for User Story 3

- [x] T019 [US3] Implement GET handler in `pages/api/player/pokemon/check.js` - quick check returning has_pokemon boolean and count

### Component Implementation for User Story 3

- [x] T020 [US3] Create `components/layout/AuthGuard.js` - wrapper component that checks auth and Pokemon status, redirects appropriately

### Page Updates for User Story 3

- [x] T021 [US3] Update `pages/starter-select.js` - add check on mount, if user has Pokemon redirect to dashboard
- [x] T022 [US3] Update `pages/dashboard.js` - wrap with AuthGuard to ensure only authenticated users with Pokemon can access

**Checkpoint**: User Story 3 complete - returning users bypass starter selection

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T023 Add loading states to StarterGrid and StarterCard components
- [x] T024 Add error handling UI for API failures in starter-select page
- [x] T025 [P] Add basic CSS styling to starter selection components for usability
- [x] T026 Run quickstart.md validation - test complete flow with curl commands and browser

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - US1 must complete before US2 (US2 extends StarterGrid from US1)
  - US1 must complete before US3 (US3 needs dashboard page from US1)
  - US2 and US3 can run in parallel after US1
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 1: Setup
    |
    v
Phase 2: Foundational (BLOCKS everything)
    |
    v
Phase 3: User Story 1 (P1) - Core selection
    |
    +---> Phase 4: User Story 2 (P2) - Type filtering
    |
    +---> Phase 5: User Story 3 (P3) - Bypass logic
    |
    v
Phase 6: Polish
```

### Within Each User Story

- API endpoints before components that call them
- Components before pages that use them
- Base functionality before enhancements

### Parallel Opportunities

**Phase 1**:
- T001 and T002 can run in parallel

**Phase 2**:
- T005 (pokemonData.js) and T006 (authHelper.js) can run in parallel after T003

**Phase 3 (US1)**:
- T010 (StarterCard) and T011 (ConfirmationModal) can run in parallel

**Phase 4 & 5**:
- After US1 completes, US2 and US3 can run in parallel

---

## Parallel Example: Phase 2 Foundational

```bash
# After T003 (migration) and T004 (run migration):

# Launch these in parallel:
Task: "Create lib/pokemonData.js with getAllPokemon(), getPokemonById(), getStarterPokemon(), buildPlayerPokemonResponse()"
Task: "Create lib/authHelper.js to extract user_id from session token"
```

## Parallel Example: User Story 1 Components

```bash
# After API endpoints (T007-T009) are complete:

# Launch these in parallel:
Task: "Create components/starter/StarterCard.js"
Task: "Create components/starter/ConfirmationModal.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (2 tasks)
2. Complete Phase 2: Foundational (4 tasks) - CRITICAL
3. Complete Phase 3: User Story 1 (9 tasks)
4. **STOP and VALIDATE**: Test with new user - can they select a starter?
5. Deploy/demo if ready - basic starter selection works!

### Incremental Delivery

1. Setup + Foundational (6 tasks) -> Foundation ready
2. Add User Story 1 (9 tasks) -> Core selection works -> Demo MVP!
3. Add User Story 2 (3 tasks) -> Type filtering works -> Enhanced UX
4. Add User Story 3 (4 tasks) -> Returning users handled -> Complete flow
5. Polish (4 tasks) -> Production ready

### Task Summary

| Phase | Tasks | Purpose |
|-------|-------|---------|
| Phase 1: Setup | 2 | Directory structure |
| Phase 2: Foundational | 4 | Database, utilities |
| Phase 3: US1 | 9 | Core starter selection |
| Phase 4: US2 | 3 | Type filtering |
| Phase 5: US3 | 4 | Bypass for returning users |
| Phase 6: Polish | 4 | UI/UX improvements |
| **Total** | **26** | |

---

## Notes

- No automated tests requested - use manual testing per quickstart.md
- All API routes use existing apiResponse.js patterns for consistent responses
- RLS policies ensure users can only see/modify their own Pokemon
- Pokemon data comes from Source JSON, only user state in database
- Starter selection is permanent - no undo functionality needed
