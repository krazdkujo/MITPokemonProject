# Tasks: Move Data Extraction

**Input**: Design documents from `/specs/028-move-data-extraction/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: No automated tests requested. Verification via existing test harness and spot-checking.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Project initialization and backup

- [x] T001 Backup original moves.json to `Source/moves/moves.json.backup`
- [x] T002 Create extraction script skeleton in `scripts/extract-move-data.js`
- [x] T003 [P] Create verification script skeleton in `scripts/verify-move-extraction.js`

---

## Phase 2: Foundational (Core Parsing Functions)

**Purpose**: Build extraction utilities that all user stories depend on

**CRITICAL**: These functions must be complete before any user story extraction begins

- [x] T004 Add `parseAttackType()` function to `scripts/extract-move-data.js` - detects melee/ranged/save/auto from description
- [x] T005 [P] Add `parseSaveInfo()` function to `scripts/extract-move-data.js` - extracts save type, DC, on_fail, on_success
- [x] T006 [P] Add `parseDamageInfo()` function to `scripts/extract-move-data.js` - extracts dice, modifier, damage_type, attack_type
- [x] T007 [P] Add `parseScaling()` function to `scripts/extract-move-data.js` - converts higherLevels text to structured object
- [x] T008 [P] Add `extractFlavor()` function to `scripts/extract-move-data.js` - splits flavor text from mechanics
- [x] T009 [P] Add `extractExtraEffects()` function to `scripts/extract-move-data.js` - captures remaining complex effects
- [x] T010 Add `processMoves()` main function to `scripts/extract-move-data.js` - orchestrates all parsing functions
- [x] T011 Add CLI argument parsing (--dry-run, --verbose) to `scripts/extract-move-data.js`

**Checkpoint**: All extraction functions ready. User story implementation can begin.

---

## Phase 3: User Story 1 - Combat System Reads Structured Move Data (Priority: P1)

**Goal**: Extract damage and save fields for all 800 moves so combat system can access mechanics without runtime parsing.

**Independent Test**: Load any move and verify `damage` and `save` fields match the original description's mechanics. Test with: Absorb (melee), Acid (save), Aerial Ace (auto-hit).

### Implementation for User Story 1

- [x] T012 [US1] Implement damage extraction in `processMoves()` - populate `damage` field for all moves in `scripts/extract-move-data.js`
- [x] T013 [US1] Implement save extraction in `processMoves()` - populate `save` field for all moves in `scripts/extract-move-data.js`
- [x] T014 [US1] Add validation for damage.dice pattern (must match `/^\d+d\d+$/`) in `scripts/extract-move-data.js`
- [x] T015 [US1] Add validation for damage.attack_type (must be melee/ranged/save/auto) in `scripts/extract-move-data.js`
- [x] T016 [US1] Add validation for save.type (must be STR/DEX/CON/INT/WIS/CHA) in `scripts/extract-move-data.js`
- [x] T017 [US1] Add warning logging for moves with ambiguous patterns in `scripts/extract-move-data.js`
- [x] T018 [US1] Run extraction and verify with test harness at `http://localhost:3000/test-combat`

**Checkpoint**: User Story 1 complete. All moves have `damage` and `save` fields. Combat system can read structured data.

---

## Phase 4: User Story 2 - Developers Read Flavor Text Separately (Priority: P2)

**Goal**: Extract flavor/narrative text into separate field without mechanical notation.

**Independent Test**: Load Tri Attack and verify `flavor` contains only "You strike with a simultaneous three-beam attack." without dice or damage text.

### Implementation for User Story 2

- [x] T019 [US2] Implement flavor extraction in `processMoves()` - populate `flavor` field for all moves in `scripts/extract-move-data.js`
- [x] T020 [US2] Implement extra_effects extraction in `processMoves()` - populate `extra_effects` field for all moves in `scripts/extract-move-data.js`
- [x] T021 [US2] Add validation that flavor text contains no dice notation (XdY) in `scripts/extract-move-data.js`
- [x] T022 [US2] Add validation that flavor text contains no mechanical keywords (damage, save, attack roll) in `scripts/extract-move-data.js`
- [x] T023 [US2] Spot-check 10 moves for flavor/mechanics separation accuracy

**Checkpoint**: User Story 2 complete. All moves have `flavor` and `extra_effects` fields properly separated.

---

## Phase 5: User Story 3 - Higher Level Scaling Is Structured (Priority: P3)

**Goal**: Extract level-based damage scaling into structured object.

**Independent Test**: Load Absorb and verify `scaling` contains `{5: "2d4", 10: "1d12", 17: "4d4"}`.

### Implementation for User Story 3

- [x] T024 [US3] Implement scaling extraction in `processMoves()` - populate `scaling` field for all moves with higherLevels in `scripts/extract-move-data.js`
- [x] T025 [US3] Add validation that scaling keys are numeric level thresholds in `scripts/extract-move-data.js`
- [x] T026 [US3] Add validation that scaling values match dice pattern in `scripts/extract-move-data.js`
- [x] T027 [US3] Spot-check 10 moves with higherLevels for accurate scaling extraction

**Checkpoint**: User Story 3 complete. All moves with higherLevels have structured `scaling` field.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, file writing, and documentation

- [x] T028 Add JSON output writing to `Source/moves/moves.json` in `scripts/extract-move-data.js`
- [x] T029 [P] Add summary statistics output (total processed, warnings, errors) in `scripts/extract-move-data.js`
- [x] T030 [P] Add warnings output to `extraction-warnings.json` in `scripts/extract-move-data.js`
- [x] T031 Implement verification script to spot-check specific moves in `scripts/verify-move-extraction.js`
- [x] T032 Run full extraction on all 800 moves (reduced to 490 Gen 1 moves)
- [x] T033 Verify combat system works via test harness at `http://localhost:3000/test-combat`
- [x] T034 Verify no regression in existing combat functionality
- [x] T035 Review and address any warnings in `extraction-warnings.json` (0 warnings remaining)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001-T003) - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can proceed sequentially (P1 -> P2 -> P3)
  - Each story builds on the same script incrementally
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Core extraction
- **User Story 2 (P2)**: Can start after US1 complete - Adds flavor/extra_effects
- **User Story 3 (P3)**: Can start after US1 complete - Adds scaling (independent of US2)

### Within Each Phase

- Tasks with [P] can run in parallel
- Validation tasks depend on implementation tasks
- Spot-checks depend on all extraction being complete

### Parallel Opportunities

- T003 can run parallel with T002
- T005, T006, T007, T008, T009 can all run in parallel
- T029, T030 can run in parallel
- US2 and US3 can run in parallel after US1 completes (if desired)

---

## Parallel Example: Foundational Phase

```bash
# Launch all parsing function tasks together (different functions, same file but additive):
Task: T005 "Add parseSaveInfo() function"
Task: T006 "Add parseDamageInfo() function"
Task: T007 "Add parseScaling() function"
Task: T008 "Add extractFlavor() function"
Task: T009 "Add extractExtraEffects() function"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T011)
3. Complete Phase 3: User Story 1 (T012-T018)
4. **STOP and VALIDATE**: Run test harness, verify damage/save fields work
5. Commit and continue if successful

### Incremental Delivery

1. Setup + Foundational -> Script skeleton ready
2. Add User Story 1 -> `damage` + `save` fields populated -> Validate
3. Add User Story 2 -> `flavor` + `extra_effects` fields populated -> Validate
4. Add User Story 3 -> `scaling` field populated -> Validate
5. Polish -> Final validation and cleanup

### Single Developer Strategy

1. Work through phases sequentially (most efficient for one person)
2. Leverage [P] tasks for parallel function development where possible
3. Validate at each checkpoint before proceeding

---

## Notes

- [P] tasks = different functions, can be added in parallel
- [Story] label maps task to specific user story for traceability
- Each user story adds new fields incrementally to the same script
- Verify tests via existing test harness - no new test files created
- Commit after each phase or logical group
- Stop at any checkpoint to validate independently
- Preserve original `description` field at all times
- All 800 moves must be processed without errors before moving to Polish phase
