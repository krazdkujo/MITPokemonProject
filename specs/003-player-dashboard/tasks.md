# Tasks: Player Dashboard

**Input**: Design documents from `/specs/003-player-dashboard/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Manual testing via browser per quickstart.md. No automated test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

This is a Next.js web application:
- Pages: `pages/`
- Components: `components/Dashboard/`
- API Routes: `pages/api/player/`
- Lib: `lib/`
- SQL: `sql/`

---

## Phase 1: Setup

**Purpose**: Database migration and directory structure

- [x] T001 Create migration file sql/003_add_hp_fields.sql with current_hp and max_hp columns
- [x] T002 Apply migration to Supabase database (run via SQL editor or scripts/run-migrations.js)
- [x] T003 Create components/Dashboard/ directory for new components

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure updates that MUST be complete before ANY user story UI can work

**CRITICAL**: No user story UI work can begin until this phase is complete

- [x] T004 Update lib/pokemonData.js buildPlayerPokemonResponse() to include current_hp and max_hp fields
- [x] T005 Enhance pages/api/player/pokemon.js GET handler to calculate and return box_count, pokedex_caught, and badge_count fields
- [x] T006 [P] Create components/Dashboard/HPBar.js with color-coded HP bar (green >50%, yellow 25-50%, red <25%)

**Checkpoint**: API returns enhanced response with HP and summary stats; HPBar component ready for use

---

## Phase 3: User Story 1 - View Active Party (Priority: P1)

**Goal**: Display player's active party (up to 6 Pokemon) with sprite, name, types, level, and HP bar

**Independent Test**: Login, navigate to /dashboard, verify active Pokemon display with complete info and working HP bars

### Implementation for User Story 1

- [x] T007 [P] [US1] Create components/Dashboard/PartyCard.js with Pokemon sprite, name, types, level, and HPBar
- [x] T008 [P] [US1] Create components/Dashboard/PartyRoster.js to display up to 6 active Pokemon ordered by slot_number
- [x] T009 [US1] Update pages/dashboard.js to import and use PartyRoster component with fetched Pokemon data
- [x] T010 [US1] Add empty state display in PartyRoster when player has no active Pokemon
- [x] T011 [US1] Add loading spinner state in pages/dashboard.js while API data is fetching
- [x] T012 [US1] Add error state display in pages/dashboard.js when API call fails
- [x] T013 [US1] Add fallback placeholder display in PartyCard.js for Pokemon without sprite images

**Checkpoint**: Active party displays correctly with HP bars; loading/error/empty states work

---

## Phase 4: User Story 2 - View Box Summary (Priority: P2)

**Goal**: Display count of Pokemon in storage (is_active = false)

**Independent Test**: Login with user having Pokemon in storage, verify box count matches expected value

### Implementation for User Story 2

- [x] T014 [P] [US2] Create components/Dashboard/StatsSummary.js with box_count display section
- [x] T015 [US2] Update pages/dashboard.js to import and use StatsSummary component with box_count from API

**Checkpoint**: Box count displays correctly on dashboard

---

## Phase 5: User Story 3 - View Pokedex Progress (Priority: P2)

**Goal**: Display count of distinct Pokemon species caught

**Independent Test**: Login with user having multiple Pokemon (some duplicates), verify Pokedex shows correct distinct count

### Implementation for User Story 3

- [x] T016 [US3] Add pokedex_caught display to components/Dashboard/StatsSummary.js
- [x] T017 [US3] Update pages/dashboard.js to pass pokedex_caught from API response to StatsSummary

**Checkpoint**: Pokedex progress displays correctly; duplicate species count once

---

## Phase 6: User Story 4 - View Badges (Priority: P3)

**Goal**: Display badge count (placeholder showing 0 until gym battles implemented)

**Independent Test**: Login, verify badge section shows 0 badges with appropriate placeholder UI

### Implementation for User Story 4

- [x] T018 [US4] Add badge_count display to components/Dashboard/StatsSummary.js with placeholder styling for 0 badges
- [x] T019 [US4] Update pages/dashboard.js to pass badge_count from API response to StatsSummary

**Checkpoint**: Badge count displays correctly (shows 0 with placeholder UI)

---

## Phase 7: User Story 5 - Navigate to Detailed Stats (Priority: P3)

**Goal**: Provide navigation link/button to detailed stats page

**Independent Test**: Click stats link, verify navigation works (page may not exist yet but link should be functional)

### Implementation for User Story 5

- [x] T020 [US5] Add "View Detailed Stats" link or button in pages/dashboard.js navigating to /stats
- [x] T021 [US5] Style stats navigation button to be clearly visible and accessible

**Checkpoint**: Stats navigation link present and functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final refinements and edge case handling

- [x] T022 [P] Add CSS styles for HP bar colors (green #4ade80, yellow #facc15, red #f87171) in HPBar.js
- [x] T023 [P] Add CSS styles for PartyCard layout and type badges in PartyCard.js
- [x] T024 [P] Add CSS styles for StatsSummary layout in StatsSummary.js
- [x] T025 Apply responsive design to PartyRoster grid for mobile and desktop views
- [x] T026 Run quickstart.md verification checklist to validate all features work correctly
- [x] T027 Test edge cases: fainted Pokemon (HP=0), full HP, missing sprites, database errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start here
- **Foundational (Phase 2)**: Depends on Phase 1 - BLOCKS all user story UI work
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion
- **User Stories 2-5 (Phases 4-7)**: Depend on Phase 2; can run in parallel after Phase 2
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

```
Phase 1: Setup
    |
    v
Phase 2: Foundational (API + HPBar)
    |
    +---> Phase 3: US1 - Active Party (P1) [MVP]
    |         |
    |         +---> Phase 4: US2 - Box Count (P2)
    |         |
    |         +---> Phase 5: US3 - Pokedex (P2)
    |         |
    |         +---> Phase 6: US4 - Badges (P3)
    |         |
    |         +---> Phase 7: US5 - Stats Nav (P3)
    |
    v
Phase 8: Polish
```

### Within Each Phase

- Tasks marked [P] can run in parallel
- Non-[P] tasks must be sequential within their phase
- Complete each phase before moving to next

### Parallel Opportunities

**Phase 2 (Foundational)**:
- T004 (pokemonData.js) and T006 (HPBar.js) can run in parallel

**Phase 3 (US1)**:
- T007 (PartyCard.js) and T008 (PartyRoster.js) can run in parallel

**Phase 4-7 (US2-US5)**:
- All user story phases can run in parallel after US1 establishes base dashboard structure

**Phase 8 (Polish)**:
- T022, T023, T024 can run in parallel (different files)

---

## Parallel Example: User Story 1

```bash
# Launch parallel component creation:
Task: "Create components/Dashboard/PartyCard.js"
Task: "Create components/Dashboard/PartyRoster.js"

# After both complete, sequential integration:
Task: "Update pages/dashboard.js to use PartyRoster"
Task: "Add empty state display"
Task: "Add loading state"
Task: "Add error state"
Task: "Add sprite fallback"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T006)
3. Complete Phase 3: User Story 1 (T007-T013)
4. **STOP and VALIDATE**: Test active party display independently
5. Deploy/demo if ready - player can see their Pokemon with HP bars

### Incremental Delivery

1. **Setup + Foundational** -> API ready, HPBar ready
2. **Add US1** -> Active party displays -> Deploy (MVP!)
3. **Add US2+US3** -> Box and Pokedex counts display -> Deploy
4. **Add US4+US5** -> Badges and stats nav -> Deploy
5. **Polish** -> Edge cases, styling, responsive design -> Deploy

### Task Counts Summary

| Phase | Story | Task Count |
|-------|-------|------------|
| Phase 1 | Setup | 3 |
| Phase 2 | Foundational | 3 |
| Phase 3 | US1 - Active Party | 7 |
| Phase 4 | US2 - Box Count | 2 |
| Phase 5 | US3 - Pokedex | 2 |
| Phase 6 | US4 - Badges | 2 |
| Phase 7 | US5 - Stats Nav | 2 |
| Phase 8 | Polish | 6 |
| **Total** | | **27 tasks** |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story phase should be independently testable after completion
- Manual testing via browser per quickstart.md verification checklist
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
