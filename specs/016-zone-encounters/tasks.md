# Tasks: Zone-Based Pokemon Encounters

**Input**: Design documents from `/specs/016-zone-encounters/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested - test tasks not included.

**Organization**: Tasks grouped by user story for independent implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, US3, US4, US5, US6)
- Include exact file paths in descriptions

## Path Conventions

- **Next.js**: `pages/`, `pages/api/`, `lib/`, `components/`
- **Source data**: `Source/`
- **SQL migrations**: `sql/`

---

## Phase 1: Setup

**Purpose**: Create zone data file and database migration

- [X] T001 Create zone configuration file with 24+ zones in Source/zones.json
- [X] T002 Create active_battles table migration in sql/006_active_battles.sql
- [X] T003 [P] Create zone data utilities in lib/zoneData.js

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before user stories

- [X] T004 Implement getZoneById and getAllZones functions in lib/zoneData.js
- [X] T005 [P] Implement getEncounterPool function to filter Pokemon by type and SR in lib/zoneData.js
- [X] T006 [P] Create GET /api/zones endpoint in pages/api/zones/index.js
- [X] T007 [P] Create GET /api/zones/[zoneId] endpoint in pages/api/zones/[zoneId].js

**Checkpoint**: Zone data infrastructure ready - user story implementation can begin

---

## Phase 3: User Story 1+2 - Zone Browsing & Encounters (Priority: P1) MVP

**Goal**: Players can browse zones organized by terrain type and start type-appropriate encounters

**Independent Test**: Visit /zones page, select a zone, verify Pokemon matches zone theme

### Implementation

- [X] T008 [P] [US1] Create DifficultyBadge component in components/Zones/DifficultyBadge.js
- [X] T009 [P] [US1] Create ZoneCard component in components/Zones/ZoneCard.js
- [X] T010 [P] [US1] Create TerrainGroup component in components/Zones/TerrainGroup.js
- [X] T011 [US1] Create zones page with terrain groups in pages/zones.js
- [X] T012 [US2] Create POST /api/zones/encounter endpoint in pages/api/zones/encounter.js
- [X] T013 [US2] Add selectRandomPokemonFromZone function to lib/zoneData.js
- [X] T014 [US1] Add zones link to navigation in components/layout/SideNav.js

**Checkpoint**: Players can browse zones and start encounters with type-appropriate Pokemon

---

## Phase 4: User Story 5 - Battle Persistence & Resume (Priority: P1)

**Goal**: Battle state persists to database and auto-resumes on return

**Independent Test**: Start battle, navigate away, return to combat - battle resumes automatically

### Implementation

- [X] T015 [P] [US5] Create GET /api/battle/active endpoint in pages/api/battle/active.js
- [X] T016 [P] [US5] Create GET /api/battle/state/[battleId] endpoint in pages/api/battle/state/[battleId].js
- [X] T017 [P] [US5] Create POST /api/battle/abandon endpoint in pages/api/battle/abandon.js
- [ ] T018 [US5] Add state persistence helper functions to lib/battleState.js
- [ ] T019 [US5] Modify POST /api/battle/action to persist state after each action in pages/api/battle/action.js
- [ ] T020 [US5] Modify POST /api/battle/flee to update battle status in pages/api/battle/flee.js
- [X] T021 [US5] Update combat.js to check for active battle on load in pages/combat.js
- [X] T022 [US5] Add abandon button to combat UI in pages/combat.js

**Checkpoint**: Battles persist across sessions and resume automatically

---

## Phase 5: User Story 3 - Clear Difficulty Display (Priority: P2)

**Goal**: Difficulty is shown with user-friendly labels and visual indicators

**Independent Test**: View zone cards and verify Easy/Medium/Hard/Expert labels are clear

### Implementation

- [ ] T023 [US3] Enhance DifficultyBadge with color coding in components/Zones/DifficultyBadge.js
- [ ] T024 [US3] Add difficulty label mapping (SR to Easy/Medium/Hard/Expert) in lib/zoneData.js
- [ ] T025 [US3] Update ZoneCard to prominently display difficulty in components/Zones/ZoneCard.js

**Checkpoint**: Zone difficulty is immediately clear to players

---

## Phase 6: User Story 4 - Full Pokemon Pool (Priority: P2)

**Goal**: Encounters include Pokemon from all 1142 species (Gen 1-9)

**Independent Test**: Verify encounter pool includes Pokemon with dex numbers > 151

### Implementation

- [ ] T026 [US4] Verify getEncounterPool includes all 1142 Pokemon in lib/zoneData.js
- [ ] T027 [US4] Add encounter pool count to zone cards in components/Zones/ZoneCard.js
- [ ] T028 [US4] Add sample Pokemon preview to GET /api/zones/[zoneId] response

**Checkpoint**: Encounter pools demonstrate full Pokemon diversity

---

## Phase 7: User Story 6 - Themed Zone Progression (Priority: P3)

**Goal**: Zone names follow thematic difficulty progression within terrain types

**Independent Test**: View zones within a terrain - names convey increasing challenge

### Implementation

- [ ] T029 [US6] Review and enhance zone names in Source/zones.json for thematic progression
- [ ] T030 [US6] Add zone descriptions that convey difficulty in Source/zones.json
- [ ] T031 [US6] Sort zones within TerrainGroup by difficulty in components/Zones/TerrainGroup.js

**Checkpoint**: Zone naming creates immersive progression experience

---

## Phase 8: Polish & Integration

**Purpose**: Final integration and cleanup

- [ ] T032 [P] Run database migration sql/006_active_battles.sql
- [ ] T033 [P] Add active battle indicator to GameLayout header in components/layout/GameLayout.js
- [ ] T034 Block new encounter if active battle exists in pages/api/zones/encounter.js
- [ ] T035 Handle redirect to active battle from zones page in pages/zones.js
- [ ] T036 Verify combat.js integrates seamlessly with zone encounters in pages/combat.js

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 - BLOCKS all user stories
- **US1+2 (Phase 3)**: Depends on Phase 2 - Core MVP
- **US5 (Phase 4)**: Depends on Phase 2, can parallel with Phase 3
- **US3 (Phase 5)**: Depends on Phase 3 (enhances zone display)
- **US4 (Phase 6)**: Depends on Phase 2 (verifies encounter pool)
- **US6 (Phase 7)**: Depends on Phase 3 (enhances zone data)
- **Polish (Phase 8)**: Depends on all user stories

### User Story Independence

| Story | Can Start After | Dependencies |
|-------|-----------------|--------------|
| US1+2 | Phase 2 | None (core MVP) |
| US5 | Phase 2 | None (parallel with US1+2) |
| US3 | Phase 3 | US1 (zone display exists) |
| US4 | Phase 2 | None (data verification) |
| US6 | Phase 3 | US1 (zone structure exists) |

### Parallel Opportunities

**Within Phase 1:**
```
T001 (zones.json) || T002 (migration) || T003 (zoneData.js)
```

**Within Phase 2:**
```
T004 -> T005 (zoneData functions)
T006 || T007 (API endpoints)
```

**Within Phase 3 (US1+2):**
```
T008 || T009 || T010 (components)
T011 -> T012 (page then encounter)
```

**Within Phase 4 (US5):**
```
T015 || T016 || T017 (new API endpoints)
T019 || T020 (modify existing endpoints)
T021 -> T022 (combat page changes)
```

---

## Implementation Strategy

### MVP First (Phase 1-3)

1. Complete Setup (Phase 1): Zone data and migration
2. Complete Foundational (Phase 2): Zone API infrastructure
3. Complete US1+2 (Phase 3): Zone browsing and encounters
4. **VALIDATE**: Test zone selection and encounter generation
5. Deploy MVP - players can use zone-based encounters

### Add Persistence (Phase 4)

6. Complete US5 (Phase 4): Battle persistence
7. **VALIDATE**: Test battle resume across sessions
8. Deploy - battles now persist

### Polish Features (Phases 5-8)

9. Complete US3+4+6: Difficulty display, full pool, themed names
10. Complete Polish: Integration and final touches
11. Full feature deployment

---

## Task Summary

| Phase | Task Count | Purpose |
|-------|------------|---------|
| Setup | 3 | Zone data and migration |
| Foundational | 4 | Zone API infrastructure |
| US1+2 (P1) | 7 | Zone browsing and encounters |
| US5 (P1) | 8 | Battle persistence |
| US3 (P2) | 3 | Difficulty display |
| US4 (P2) | 3 | Full Pokemon pool |
| US6 (P3) | 3 | Themed progression |
| Polish | 5 | Integration |

**Total Tasks**: 36

---

## Notes

- Zone data in Source/zones.json follows Two-Tier Data Model (Constitution Principle I)
- All API endpoints validate JWT (Constitution Principle II)
- active_battles table uses RLS (Constitution Principle III)
- Battle state stores pokemon_id, merges with Source (Constitution Principle IV)
- Commit after each task or logical group
- Run migration before testing persistence features
