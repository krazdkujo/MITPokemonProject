# Tasks: Combat Test Harness

**Input**: Design documents from `/specs/021-combat-test-harness/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested - manual testing via UI and CLI.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Pages**: `pages/` (Next.js Pages Router)
- **Components**: `components/TestCombat/`
- **Lib**: `lib/`
- **Scripts**: `scripts/`

---

## Phase 1: Setup

**Purpose**: Project initialization and shared infrastructure creation

- [x] T001 Create scripts/ directory at repository root
- [x] T002 Create components/TestCombat/ directory for UI components
- [x] T003 Add `test:combat` script to package.json scripts section

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core library modules that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 [P] Create seedable RNG module in lib/seededRandom.js implementing mulberry32 algorithm with rollD20() and rollDice() methods
- [x] T005 [P] Create combat logger module in lib/combatLogger.js with createLogger(), logTurnStart(), logAttack(), logDamage(), logMiss(), logStatus(), logTurnEnd(), logBattleEnd() functions
- [x] T006 Create combat simulator module in lib/combatSimulator.js with createSimulation(), runNextTurn(), runToCompletion(), formatLogEntry(), formatBattleSummary() functions using existing battleEngine.js

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Interactive Combat Test Screen (Priority: P1) 🎯 MVP

**Goal**: Dedicated test page where developers select two Pokemon from dropdowns and watch them fight turn-by-turn with live battle logs

**Independent Test**: Navigate to `/test-combat`, select Pokemon, click "Start Battle", verify turn-by-turn logs appear in the log panel

### Implementation for User Story 1

- [x] T007 [P] [US1] Create PokemonSelector component in components/TestCombat/PokemonSelector.js with Pokemon dropdown using getAllPokemon() and level input field (default 5)
- [x] T008 [P] [US1] Create BattleLog component in components/TestCombat/BattleLog.js with scrollable log panel, auto-scroll on new entries, and formatted log display
- [x] T009 [P] [US1] Create ControlPanel component in components/TestCombat/ControlPanel.js with "Start Battle", "Next Turn", "Reset" buttons and mode toggle
- [x] T010 [US1] Create test-combat page in pages/test-combat.js integrating PokemonSelector (x2), BattleLog, and ControlPanel components
- [x] T011 [US1] Implement battle initialization in pages/test-combat.js calling createSimulation() with selected Pokemon
- [x] T012 [US1] Implement step-by-step mode in pages/test-combat.js calling runNextTurn() on "Next Turn" click and updating BattleLog
- [x] T013 [US1] Implement auto-run mode in pages/test-combat.js with setInterval calling runNextTurn() and speed slider (100-2000ms)
- [x] T014 [US1] Add battle completion handling in pages/test-combat.js showing winner summary when battleEnded is true

**Checkpoint**: User Story 1 complete - can select Pokemon, start battle, watch turn-by-turn logs in UI

---

## Phase 4: User Story 2 - Configure Test Pokemon via UI (Priority: P2)

**Goal**: Configure Pokemon levels and optionally select specific moves on the test page for testing specific matchups

**Independent Test**: Set custom levels, verify Pokemon battle at those levels; optionally select moves, verify those moves are used

### Implementation for User Story 2

- [x] T015 [US2] Enhance PokemonSelector in components/TestCombat/PokemonSelector.js to include level validation (1-20) with error display
- [x] T016 [US2] Add move selection dropdown to PokemonSelector in components/TestCombat/PokemonSelector.js showing available moves for selected Pokemon at selected level
- [x] T017 [US2] Update createSimulation() call in pages/test-combat.js to pass optional moves array from PokemonSelector
- [x] T018 [US2] Add level/move display in battle header section of pages/test-combat.js showing configured combatants

**Checkpoint**: User Story 2 complete - can configure levels and moves in UI

---

## Phase 5: User Story 3 - CLI Script for Automated Testing (Priority: P2)

**Goal**: Command-line script that runs combat simulations for automation and CI integration

**Independent Test**: Run `npm run test:combat -- --pokemon1 pikachu --pokemon2 bulbasaur`, verify complete battle log output in terminal

### Implementation for User Story 3

- [x] T019 [US3] Create CLI script in scripts/test-combat.js with argument parsing for --pokemon1, --pokemon2, --level1, --level2, --seed
- [x] T020 [US3] Implement default values in scripts/test-combat.js (pikachu, bulbasaur, level 5, Date.now() seed)
- [x] T021 [US3] Integrate combatSimulator.js in scripts/test-combat.js calling createSimulation() and runToCompletion()
- [x] T022 [US3] Add colorized console output in scripts/test-combat.js using combatLogger with colorize:true option
- [x] T023 [US3] Implement exit codes in scripts/test-combat.js (0=success, 1=invalid pokemon, 2=invalid level, 3=error)
- [x] T024 [US3] Add help text in scripts/test-combat.js displayed when --help flag passed

**Checkpoint**: User Story 3 complete - can run combat simulations from CLI

---

## Phase 6: User Story 4 - Verbose Logging Output (Priority: P2)

**Goal**: Detailed, human-readable logging of every combat calculation for debugging

**Independent Test**: Run simulation, verify logs show attack roll breakdown, damage calculation steps, status effect details

### Implementation for User Story 4

- [x] T025 [US4] Enhance logAttack() in lib/combatLogger.js to show d20(X) + modifier = total vs AC with HIT/MISS/CRIT indicators
- [x] T026 [US4] Enhance logDamage() in lib/combatLogger.js to show dice(rolls) + power + STAB with type effectiveness and final damage
- [x] T027 [US4] Add logSaveMove() in lib/combatLogger.js for saving throw moves showing DC, save roll, saved/failed result
- [x] T028 [US4] Enhance logStatus() in lib/combatLogger.js to show status application, blocked reasons, and ongoing effects
- [x] T029 [US4] Add turn separators and HP summary in logTurnEnd() in lib/combatLogger.js
- [x] T030 [US4] Update runNextTurn() in lib/combatSimulator.js to capture and format all calculation details in log entries

**Checkpoint**: User Story 4 complete - logs contain all calculation details needed for debugging

---

## Phase 7: User Story 5 - Reproducible Test Runs (Priority: P3)

**Goal**: Seed the RNG so combat sequences can be reproduced for debugging

**Independent Test**: Run simulation with --seed 12345 twice, verify identical output

### Implementation for User Story 5

- [x] T031 [US5] Integrate seededRandom.js in lib/combatSimulator.js to replace Math.random() calls during simulation
- [x] T032 [US5] Add seed input field to ControlPanel in components/TestCombat/ControlPanel.js (optional, shows generated seed after battle)
- [x] T033 [US5] Display seed in battle summary in pages/test-combat.js and scripts/test-combat.js with "use --seed X to reproduce" message
- [x] T034 [US5] Update createSimulation() in lib/combatSimulator.js to store and return seed used for reproduction

**Checkpoint**: User Story 5 complete - simulations are reproducible with seed

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and edge case handling

- [x] T035 [P] Add edge case handling for no PP (Struggle) in lib/combatSimulator.js with appropriate logging
- [x] T036 [P] Add edge case handling for simultaneous faints in lib/combatSimulator.js declaring draw
- [x] T037 [P] Add edge case handling for max turns reached (100) in lib/combatSimulator.js ending in draw
- [x] T038 Add CSS styling for test-combat page in pages/test-combat.js using inline styles or style jsx
- [x] T039 Validate quickstart.md by running through all documented scenarios
- [x] T040 Test type effectiveness display by running Fire vs Water and Grass vs Fire matchups

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 (P1): Can start after Phase 2 - No dependencies on other stories
  - US2 (P2): Can start after Phase 2 - Enhances US1 components but independently testable
  - US3 (P2): Can start after Phase 2 - Uses same lib as US1 but different entry point
  - US4 (P2): Can start after Phase 2 - Enhances logging used by US1 and US3
  - US5 (P3): Can start after Phase 2 - Adds optional feature to existing simulation
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

| Story | Depends On | Parallel With |
|-------|------------|---------------|
| US1 (Interactive Test Screen) | Phase 2 only | US3, US4, US5 |
| US2 (Configure Pokemon) | Phase 2 only | US3, US4, US5 |
| US3 (CLI Script) | Phase 2 only | US1, US2, US4, US5 |
| US4 (Verbose Logging) | Phase 2 only | US1, US2, US3, US5 |
| US5 (Reproducible Runs) | Phase 2 only | US1, US2, US3, US4 |

### Within Each User Story

- Components before page integration
- Core implementation before enhancements
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 2 (Foundational)**:
- T004 and T005 can run in parallel (different files)
- T006 depends on T004, T005

**Phase 3 (US1)**:
- T007, T008, T009 can run in parallel (different component files)
- T010-T014 are sequential (same page file)

**Phase 5 (US3)**:
- Can run entirely in parallel with US1 after Phase 2

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Launch foundational modules together:
Task: "Create seedable RNG module in lib/seededRandom.js"
Task: "Create combat logger module in lib/combatLogger.js"
# Then after both complete:
Task: "Create combat simulator module in lib/combatSimulator.js"
```

## Parallel Example: User Story 1 Components

```bash
# Launch all US1 components together:
Task: "Create PokemonSelector component in components/TestCombat/PokemonSelector.js"
Task: "Create BattleLog component in components/TestCombat/BattleLog.js"
Task: "Create ControlPanel component in components/TestCombat/ControlPanel.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T006)
3. Complete Phase 3: User Story 1 (T007-T014)
4. **STOP and VALIDATE**: Test by navigating to `/test-combat` and running a battle
5. Deploy/demo if ready - basic test harness is functional

### Incremental Delivery

1. Setup + Foundational → Core modules ready
2. Add US1 → Basic test page functional → Demo (MVP!)
3. Add US3 → CLI script available → Demo
4. Add US4 → Verbose logging → Demo
5. Add US2 → Pokemon configuration → Demo
6. Add US5 → Reproducible runs → Demo
7. Polish → Edge cases handled → Final release

### Recommended Order for Single Developer

1. Phase 1: Setup (3 tasks)
2. Phase 2: Foundational (3 tasks)
3. Phase 3: US1 - Interactive Test Screen (8 tasks) ← **MVP**
4. Phase 6: US4 - Verbose Logging (6 tasks) ← Enhances US1
5. Phase 5: US3 - CLI Script (6 tasks) ← Alternative interface
6. Phase 4: US2 - Configure Pokemon (4 tasks) ← UI enhancement
7. Phase 7: US5 - Reproducible Runs (4 tasks) ← Optional feature
8. Phase 8: Polish (6 tasks)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Total tasks: 40
- MVP (US1 only): 14 tasks
