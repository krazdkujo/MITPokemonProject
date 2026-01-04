# Tasks: Player Statistics Page

**Input**: Design documents from `/specs/005-player-statistics/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-player-stats.yaml

**Tests**: Not explicitly requested in specification. Manual testing via browser + API verification.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md structure:
- Pages: `pages/` and `pages/api/`
- Components: `components/Stats/`
- Libraries: `lib/` (existing utilities)

---

## Phase 1: Setup

**Purpose**: Install dependencies and create directory structure

- [x] T001 Install recharts dependency: `npm install recharts`
- [x] T002 Create components/Stats/ directory structure

---

## Phase 2: Foundational (API Endpoint)

**Purpose**: Create the statistics API endpoint that ALL user stories depend on

**CRITICAL**: The API must be complete before any UI work can be tested

- [x] T003 Create statistics API endpoint in pages/api/player/stats.js with authentication, database query, and response structure per contracts/api-player-stats.yaml
- [x] T004 Implement type distribution calculation in pages/api/player/stats.js (count each type, handle dual-types, calculate percentages)
- [x] T005 Implement level statistics calculation in pages/api/player/stats.js (top 5 Pokemon by level, level range distribution 1-5/6-10/11-15/16-20)
- [x] T006 Verify API endpoint returns correct JSON structure via curl or browser dev tools

**Checkpoint**: API endpoint complete - GET /api/player/stats returns valid statistics JSON

---

## Phase 3: User Story 1 - View Collection Statistics (Priority: P1)

**Goal**: Display total Pokemon count and type distribution breakdown with visualization

**Independent Test**: Navigate to /stats, verify type breakdown displays with correct counts for each type, including dual-type Pokemon counted in both categories

### Implementation for User Story 1

- [x] T007 [P] [US1] Create EmptyState component in components/Stats/EmptyState.js with customizable message prop and styled container
- [x] T008 [P] [US1] Create StatsCard wrapper component in components/Stats/StatsCard.js with title, children, and consistent styling
- [x] T009 [US1] Create TypeDistributionChart component in components/Stats/TypeDistributionChart.js using Recharts PieChart or BarChart with responsive container
- [x] T010 [US1] Handle empty state in TypeDistributionChart showing EmptyState with "Catch Pokemon to see type statistics" message

**Checkpoint**: User Story 1 complete - Type distribution chart displays correctly with accurate counts

---

## Phase 4: User Story 2 - View Pokemon Level Distribution (Priority: P2)

**Goal**: Display top Pokemon by level and level range histogram

**Independent Test**: View /stats page, verify top Pokemon list shows highest levels first and level distribution chart groups correctly into 1-5, 6-10, 11-15, 16-20 ranges

### Implementation for User Story 2

- [x] T011 [P] [US2] Create TopPokemonList component in components/Stats/TopPokemonList.js displaying ranked list with sprite, name, level, and types
- [x] T012 [P] [US2] Create LevelDistributionChart component in components/Stats/LevelDistributionChart.js using Recharts BarChart with level ranges on x-axis
- [x] T013 [US2] Handle empty states in TopPokemonList and LevelDistributionChart using EmptyState component

**Checkpoint**: User Story 2 complete - Top Pokemon and level distribution display correctly

---

## Phase 5: User Story 3 - View Battle Statistics (Priority: P3)

**Goal**: Display placeholder for battle statistics (database tables not yet implemented)

**Independent Test**: View /stats page, verify "Coming Soon" or placeholder section appears for battle statistics

### Implementation for User Story 3

- [x] T014 [US3] Create BattleStatsPlaceholder component in components/Stats/BattleStatsPlaceholder.js showing "Battle statistics coming soon" message with disabled/grayed styling

**Checkpoint**: User Story 3 complete - Battle stats placeholder visible

---

## Phase 6: User Story 4 - View Badge Progression (Priority: P4)

**Goal**: Display placeholder for badge progression (database tables not yet implemented)

**Independent Test**: View /stats page, verify "Coming Soon" or placeholder section appears for badges

### Implementation for User Story 4

- [x] T015 [US4] Create BadgeProgressPlaceholder component in components/Stats/BadgeProgressPlaceholder.js showing "Badge tracking coming soon" message with disabled/grayed styling

**Checkpoint**: User Story 4 complete - Badge placeholder visible

---

## Phase 7: Stats Page Assembly

**Purpose**: Create the main stats page and integrate all components

- [x] T016 Create stats page in pages/stats.js with AuthGuard wrapper (requirePokemon=false)
- [x] T017 Implement data fetching in pages/stats.js using apiFetch to call /api/player/stats
- [x] T018 Add loading state to pages/stats.js with spinner matching dashboard pattern
- [x] T019 Add error state to pages/stats.js with user-friendly message and retry option
- [x] T020 Integrate all Stats components in pages/stats.js: TypeDistributionChart, TopPokemonList, LevelDistributionChart, BattleStatsPlaceholder, BadgeProgressPlaceholder
- [x] T021 Add responsive layout to pages/stats.js with CSS grid/flexbox for mobile (320px) to desktop (1920px)
- [x] T022 Add "Back to Dashboard" navigation link in pages/stats.js

**Checkpoint**: Stats page complete - all sections render and page is navigable from dashboard

---

## Phase 8: Polish & Integration

**Purpose**: Final testing and refinements

- [x] T023 Verify dashboard "View Detailed Stats" link correctly navigates to /stats page
- [ ] T024 Test empty state behavior with user who has no Pokemon
- [ ] T025 Test with user who has multiple Pokemon including dual-types (e.g., Bulbasaur = Grass/Poison)
- [ ] T026 Verify responsive layout on mobile viewport (320px)
- [ ] T027 Verify responsive layout on tablet viewport (768px)
- [ ] T028 Verify responsive layout on desktop viewport (1920px)
- [ ] T029 Run quickstart.md manual test flow to validate all acceptance criteria

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 - BLOCKS all UI work
- **Phase 3-6 (User Stories)**: All depend on Phase 2 API completion
  - US1-US4 can proceed in parallel after Phase 2
  - Or sequentially: US1 -> US2 -> US3 -> US4
- **Phase 7 (Page Assembly)**: Depends on Phase 3-6 components being created
- **Phase 8 (Polish)**: Depends on Phase 7 completion

### User Story Dependencies

- **User Story 1 (P1)**: Requires T001-T006 (Setup + API) - Creates shared EmptyState and StatsCard
- **User Story 2 (P2)**: Requires T001-T006 + T007 (EmptyState from US1)
- **User Story 3 (P3)**: No dependencies on other user stories (standalone placeholder)
- **User Story 4 (P4)**: No dependencies on other user stories (standalone placeholder)

### Within User Stories

- Components marked [P] can be created in parallel
- Page assembly (Phase 7) must wait for all components

### Parallel Opportunities

```text
After Phase 2 completes:
  Parallel Group A: T007, T008, T011, T012, T014, T015
  (All component files can be created simultaneously)
```

---

## Parallel Example: Component Creation

```bash
# After API (T003-T006) is complete, launch all components in parallel:
Task: "Create EmptyState component in components/Stats/EmptyState.js"
Task: "Create StatsCard wrapper component in components/Stats/StatsCard.js"
Task: "Create TopPokemonList component in components/Stats/TopPokemonList.js"
Task: "Create LevelDistributionChart component in components/Stats/LevelDistributionChart.js"
Task: "Create BattleStatsPlaceholder component in components/Stats/BattleStatsPlaceholder.js"
Task: "Create BadgeProgressPlaceholder component in components/Stats/BadgeProgressPlaceholder.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: API Endpoint (T003-T006)
3. Complete Phase 3: Collection Statistics (T007-T010)
4. Create minimal pages/stats.js with just TypeDistributionChart
5. **STOP and VALIDATE**: Test type distribution independently
6. Demo/deploy if acceptable

### Recommended Full Implementation

1. Complete Setup + Foundational (T001-T006)
2. Create all components in parallel (T007-T015)
3. Assemble stats page (T016-T022)
4. Polish and test (T023-T029)

### Estimated Task Breakdown

| Phase | Tasks | Parallel? |
|-------|-------|-----------|
| Setup | 2 | No |
| Foundational (API) | 4 | Sequential |
| US1: Collection Stats | 4 | Mostly parallel |
| US2: Level Distribution | 3 | Mostly parallel |
| US3: Battle Placeholder | 1 | Parallel |
| US4: Badge Placeholder | 1 | Parallel |
| Page Assembly | 7 | Sequential |
| Polish | 7 | Parallel |

**Total Tasks**: 29

---

## Notes

- [P] tasks = different files, no dependencies between them
- [Story] label maps task to specific user story for traceability
- US3 and US4 are placeholders only - database tables will be added by future features
- Recharts may need dynamic import with `ssr: false` if SSR issues occur
- All components follow existing patterns from components/Dashboard/
- API follows pattern from pages/api/player/pokemon.js
