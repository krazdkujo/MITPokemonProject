# Tasks: Gen 1 Pokemon Reduction

**Input**: Design documents from `/specs/025-gen1-pokemon/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not requested in feature specification. No test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This feature modifies data files only:
- **Source data**: `Source/` at repository root
- **Image assets**: `public/images/pokemon/`
- **No code changes**: lib/, pages/, components/ remain unchanged

---

## Phase 1: Setup (Backup & Preparation)

**Purpose**: Create backups before making destructive changes

- [x] T001 Create backup of Source/pokemon/pokemon.json to Source/pokemon/pokemon.json.backup
- [x] T002 [P] Create backup of Source/locations.json to Source/locations.json.backup
- [x] T003 [P] Create backup of Source/evolution/evolution.json to Source/evolution/evolution.json.backup
- [x] T004 [P] Create manifest of current images in public/images/pokemon/ (list all files)

---

## Phase 2: Foundational (Pokemon Data Filter)

**Purpose**: Core Pokemon data filtering that MUST be complete before other stories can proceed

**⚠️ CRITICAL**: Location and evolution filtering depend on knowing which Pokemon IDs are valid Gen 1

- [x] T005 Read Source/pokemon/pokemon.json and filter to entries where number >= 1 AND number <= 151
- [x] T006 Write filtered Pokemon array back to Source/pokemon/pokemon.json (overwrite)
- [x] T007 Validate filtered pokemon.json has exactly 151 entries with numbers 1-151 only
- [x] T008 Extract list of valid Gen 1 Pokemon IDs from filtered pokemon.json for reference

**Checkpoint**: Pokemon data now contains only Gen 1 entries. Other data files can now be filtered.

---

## Phase 3: User Story 1 - Reduced Resource Usage (Priority: P1) 🎯 MVP

**Goal**: Reduce resource consumption by removing non-Gen 1 data and images

**Independent Test**: Verify pokemon.json has 151 entries, images directory has 152 files, storage reduced by ~85%

### Implementation for User Story 1

- [x] T009 [P] [US1] Delete image files 152.png through 1025.png from public/images/pokemon/
- [x] T010 [US1] Validate public/images/pokemon/ contains exactly 152 files (1-151 + placeholder.png)
- [x] T011 [US1] Verify all Gen 1 images (1.png through 151.png) exist without gaps
- [x] T012 [US1] Calculate and log storage reduction (compare before/after file sizes)

**Checkpoint**: At this point, User Story 1 (resource reduction) is complete. Pokemon data and images are Gen 1 only.

---

## Phase 4: User Story 2 - Clean Data Integrity (Priority: P2)

**Goal**: Ensure all Pokemon-related features function correctly with Gen 1-only data

**Independent Test**: Verify locations and evolutions reference only valid Gen 1 Pokemon, no broken references

### Implementation for User Story 2

- [x] T013 [US2] Read Source/locations.json and identify all pokemon references in each location
- [x] T014 [US2] Filter each location's pokemon array to only include IDs from Gen 1 Pokemon list (from T008)
- [x] T015 [US2] Write updated locations back to Source/locations.json
- [x] T016 [US2] Validate all Pokemon IDs in locations.json exist in filtered pokemon.json
- [x] T017 [P] [US2] Read Source/evolution/evolution.json and identify all evolution chains
- [x] T018 [US2] Remove evolution entries for Pokemon #152+ (base Pokemon not in Gen 1)
- [x] T019 [US2] For remaining entries, remove evolution targets where target Pokemon number > 151
- [x] T020 [US2] Write updated evolution chains back to Source/evolution/evolution.json
- [x] T021 [US2] Validate all Pokemon references in evolution.json are Gen 1 only

**Checkpoint**: At this point, User Stories 1 AND 2 are complete. All data files reference only Gen 1 Pokemon.

---

## Phase 5: User Story 3 - Consistent UI/UX (Priority: P3)

**Goal**: Verify application functions correctly with reduced data

**Independent Test**: Start application, navigate all Pokemon-related screens, verify no errors or broken images

### Implementation for User Story 3

- [x] T022 [US3] Start development server with npm run dev
- [x] T023 [US3] Verify starter selection page shows only Gen 1 starters (Bulbasaur, Charmander, Squirtle)
- [x] T024 [US3] Verify wild encounter zones only spawn Gen 1 Pokemon
- [x] T025 [US3] Verify combat test harness dropdown contains only Gen 1 Pokemon
- [x] T026 [US3] Verify all Pokemon images load correctly without broken placeholders
- [x] T027 [US3] Run npm test to verify existing tests pass with Gen 1 data (no test script defined)
- [x] T028 [US3] Run npm run lint to verify no linting errors (pre-existing warnings only)

**Checkpoint**: All user stories complete. Application functions correctly with Gen 1-only data.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Optional cleanup and database migration

- [ ] T029 [P] (Optional) Create SQL migration script to delete player_pokemon records referencing non-Gen 1 Pokemon
- [ ] T030 [P] (Optional) Execute database migration on Supabase if player data cleanup needed
- [x] T031 Remove backup files if all validations pass (pokemon.json.backup, locations.json.backup, evolution.json.backup)
- [x] T032 Update any documentation that references Pokemon counts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (needs Gen 1 Pokemon list)
- **User Story 2 (Phase 4)**: Depends on Foundational (needs Gen 1 Pokemon list)
- **User Story 3 (Phase 5)**: Depends on US1 and US2 (needs all data filtered)
- **Polish (Phase 6)**: Depends on US3 (all verification complete)

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Handles images
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Handles locations/evolutions
- **User Story 3 (P3)**: Depends on US1 AND US2 - Verification of all changes

### Within Each Phase

- Backup tasks (T001-T004) can run in parallel
- Pokemon filtering (T005-T008) must be sequential
- Image deletion (T009-T012) can proceed independently after T008
- Location/evolution filtering (T013-T021) can proceed independently after T008
- Verification (T022-T028) requires both US1 and US2 complete

### Parallel Opportunities

**Phase 1 (Setup)**:
```
T001 (backup pokemon.json)
T002 [P] (backup locations.json)
T003 [P] (backup evolution.json)
T004 [P] (create image manifest)
```

**After Phase 2 (Foundational) completes, US1 and US2 can run in parallel**:
```
US1: T009-T012 (images)  |  US2: T013-T021 (locations + evolutions)
```

---

## Parallel Example: User Story 1 and User Story 2

```bash
# After Phase 2 (Foundational) completes, launch both stories:

# User Story 1 - Image cleanup:
Task: "Delete image files 152-1025 from public/images/pokemon/"
Task: "Validate image count"

# User Story 2 - Data integrity (can run simultaneously):
Task: "Filter locations.json Pokemon references"
Task: "Filter evolution.json chains"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (backups)
2. Complete Phase 2: Foundational (filter pokemon.json)
3. Complete Phase 3: User Story 1 (delete non-Gen 1 images)
4. **STOP and VALIDATE**: Verify image count is 152, storage reduced
5. Proceed to US2 and US3 for full completion

### Incremental Delivery

1. Complete Setup + Foundational → Pokemon data is Gen 1 only
2. Add User Story 1 → Images are Gen 1 only → Storage reduced
3. Add User Story 2 → Locations and evolutions are Gen 1 only → Data integrity
4. Add User Story 3 → Full verification → Application works correctly
5. Each story adds value without breaking previous work

### Single Developer Strategy

Execute phases sequentially:
1. Phase 1: Setup (5 minutes)
2. Phase 2: Foundational (10 minutes)
3. Phase 3: US1 Images (5 minutes)
4. Phase 4: US2 Data Integrity (15 minutes)
5. Phase 5: US3 Verification (10 minutes)
6. Phase 6: Polish (optional, 5 minutes)

**Total estimated time**: ~45-50 minutes

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- This feature is data-only: no code changes to lib/, pages/, or components/
- All existing code is data-agnostic and will work with reduced Pokemon set
- Database migration (Phase 6) is optional - only needed if existing player data exists
- Commit after each phase for easy rollback
- Backups can be deleted after successful verification (T031)
