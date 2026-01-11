# Tasks: Ambiguous Move Implementation

**Input**: Design documents from `/specs/029-ambiguous-moves/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Tests**: Tests are handled via existing combat test harness - no additional test tasks needed.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **lib/**: Core logic modules (combat, data, utils)
- **scripts/**: Utility scripts (extraction, testing)
- **Source/moves/**: Static game data (moves.json)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and foundational utilities

- [x] T001 Create formulaEvaluator.js module skeleton in lib/formulaEvaluator.js
- [x] T002 [P] Add parseExpression function to evaluate dice + variable expressions in lib/formulaEvaluator.js
- [x] T003 [P] Add evaluateFormula function that substitutes user_level, target_level variables in lib/formulaEvaluator.js
- [x] T004 Export formulaEvaluator functions and add to lib/ index if applicable

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core extraction infrastructure that all user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Add recoil field parser to extraction script in scripts/extract-move-data.js
- [x] T006 [P] Add formula field parser for level-based damage in scripts/extract-move-data.js
- [x] T007 [P] Add ohko field parser for OHKO moves in scripts/extract-move-data.js
- [x] T008 [P] Add turns field parser for two-turn moves in scripts/extract-move-data.js
- [x] T009 [P] Add hit_roll field parser for variable hit moves in scripts/extract-move-data.js
- [x] T010 [P] Add conditional field parser for HP-scaling moves in scripts/extract-move-data.js
- [x] T011 [P] Add stat_override field parser in scripts/extract-move-data.js
- [x] T012 Add validation for new fields (recoil, formula, ohko, turns, hit_roll, conditional, stat_override) in scripts/extract-move-data.js
- [x] T013 Run extraction script with --dry-run to verify parsing without modifying moves.json
- [x] T014 Run extraction script to update Source/moves/moves.json with new fields

**Checkpoint**: Foundation ready - extraction complete, user story implementation can begin

---

## Phase 3: User Story 1 - Recoil Damage Display (Priority: P1)

**Goal**: Players see recoil damage applied and logged correctly when using recoil moves

**Independent Test**: Use Double-Edge in combat test harness, verify both damage dealt and recoil taken appear in log

### Implementation for User Story 1

- [x] T015 [US1] Verify recoil field exists on Double-Edge, Take-Down, Submission, Wild-Charge in Source/moves/moves.json
- [x] T016 [US1] Verify recoil field exists on Brave-Bird, Flare-Blitz, Wave-Crash, Wood-Hammer, Head-Smash in Source/moves/moves.json
- [x] T017 [US1] Add processRecoilEffect function to handle recoil field in lib/battleEngine.js
- [x] T018 [US1] Integrate recoil processing into executeAttack after damage calculation in lib/battleEngine.js
- [x] T019 [US1] Add recoil damage logging to combat log format in lib/combatLogger.js
- [x] T020 [US1] Validate recoil using combat harness: npm run test:combat -- --pokemon1 dodrio --pokemon2 pikachu (Double-Edge)

**Checkpoint**: Recoil moves work correctly - attacker takes damage after dealing damage

---

## Phase 4: User Story 2 - OHKO Move Resolution (Priority: P1)

**Goal**: OHKO moves succeed only on natural 20 when level requirement is met

**Independent Test**: Use Fissure against targets of various levels, verify success only on nat 20 when user level >= target level

### Implementation for User Story 2

- [x] T021 [US2] Verify ohko field exists on Fissure, Guillotine, Horn-Drill, Sheer-Cold in Source/moves/moves.json
- [x] T022 [US2] Add checkOHKOLevelRestriction function in lib/battleEngine.js
- [x] T023 [US2] Add processOHKOMove function to handle nat 20 success condition in lib/battleEngine.js
- [x] T024 [US2] Integrate OHKO processing into executeAttack before normal attack flow in lib/battleEngine.js
- [x] T025 [US2] Add OHKO result logging (success/fail/level-blocked) to combat log in lib/combatLogger.js
- [x] T026 [US2] Validate OHKO using combat harness with seeded RNG for nat 20 test

**Checkpoint**: OHKO moves resolve correctly based on level comparison and roll

---

## Phase 5: User Story 3 - Level-Based Damage Calculation (Priority: P1)

**Goal**: Seismic Toss, Night Shade, and similar moves calculate damage using level formulas

**Independent Test**: Use Seismic Toss with level 10 vs level 5 Pokemon, verify damage scales with user level

### Implementation for User Story 3

- [x] T027 [US3] Verify formula field exists on Seismic-Toss, Night-Shade in Source/moves/moves.json
- [x] T028 [US3] Add processFormulaMove function that calls formulaEvaluator in lib/battleEngine.js
- [x] T029 [US3] Integrate formula processing into damage calculation path in lib/battleEngine.js
- [x] T030 [US3] Add formula damage logging showing expression and result in lib/combatLogger.js
- [x] T031 [US3] Validate level-based damage using combat harness with different level Pokemon

**Checkpoint**: Level-based damage moves calculate correctly using user/target levels

---

## Phase 6: User Story 4 - Two-Turn Move Execution (Priority: P2)

**Goal**: Two-turn moves track state across turns with invulnerability where applicable

**Independent Test**: Use Dig in combat harness, verify turn 1 shows burrowed state, turn 2 resolves attack

### Implementation for User Story 4

- [x] T032 [US4] Verify turns field exists on Dig, Dive, Bounce, Solar-Beam, Skull-Bash in Source/moves/moves.json
- [x] T033 [US4] Add pending_moves tracking to battle state structure in lib/battleState.js
  - Note: Implemented via charging_move field on combatant object
- [x] T034 [US4] Add initiateTwoTurnMove function for turn 1 processing in lib/battleEngine.js
- [x] T035 [US4] Add resolveTwoTurnMove function for turn 2 processing in lib/battleEngine.js
- [x] T036 [US4] Add checkInvulnerability function to skip attacks against burrowed/flying targets in lib/battleEngine.js
- [x] T037 [US4] Add vulnerable_to check for moves like Earthquake hitting Dig users in lib/battleEngine.js
- [x] T038 [US4] Add weather_skip check for Solar Beam in sunny weather in lib/battleEngine.js
- [x] T039 [US4] Add two-turn move state logging (charging, invulnerable, resolving) in lib/combatLogger.js
- [x] T040 [US4] Validate two-turn moves using combat harness step-through mode

**Checkpoint**: Two-turn moves track state correctly with invulnerability mechanics

---

## Phase 7: User Story 5 - Variable Hit Count (Priority: P2)

**Goal**: Multi-hit moves roll to determine hit count and apply damage per hit

**Independent Test**: Use Barrage multiple times, verify hit count varies between 1-4

### Implementation for User Story 5

- [x] T041 [US5] Verify hit_roll field exists on Barrage, Fury-Attack, Fury-Swipes, Comet-Punch in Source/moves/moves.json
  - Note: Multi-hit already implemented via getMultiHitConfig and executeMultiHit in combatSimulator.js
- [x] T042 [US5] Add processVariableHitMove function to roll for hit count in lib/battleEngine.js
  - Note: Existing implementation handles via continuation mechanic (d4 roll, 3-4 continues)
- [x] T043 [US5] Integrate variable hit processing into executeAttack in lib/battleEngine.js
- [x] T044 [US5] Add multi-hit logging showing roll result and individual hit damage in lib/combatLogger.js
- [x] T045 [US5] Validate variable hits using combat harness with multiple executions

**Checkpoint**: Variable hit moves roll correctly and apply damage per hit

---

## Phase 8: User Story 6 - Conditional Damage Scaling (Priority: P2)

**Goal**: HP-based damage scaling applies correct multipliers at HP thresholds

**Independent Test**: Use Flail at 100% HP vs 10% HP, verify damage multiplier difference

### Implementation for User Story 6

- [x] T046 [US6] Verify conditional field exists on Flail, Reversal, Water-Spout in Source/moves/moves.json
- [x] T047 [US6] Add calculateConditionalMultiplier function based on HP thresholds in lib/battleEngine.js
- [x] T048 [US6] Integrate conditional multiplier into damage calculation in lib/battleEngine.js
- [x] T049 [US6] Add conditional damage logging showing HP percent and multiplier applied in lib/combatLogger.js
- [x] T050 [US6] Validate conditional scaling using combat harness with damaged Pokemon

**Checkpoint**: HP-based damage scaling applies correctly at thresholds

---

## Phase 9: User Story 7 - Stat Override Moves (Priority: P3)

**Goal**: Moves using non-standard stats substitute correctly in calculations

**Independent Test**: Use Foul Play with low-level user against high-level target, verify target's level is used

### Implementation for User Story 7

- [ ] T051 [US7] Verify stat_override field exists on Foul-Play in Source/moves/moves.json
- [ ] T052 [US7] Add applyStatOverride function to substitute stats in lib/battleEngine.js
- [ ] T053 [US7] Integrate stat override into formula evaluation path in lib/battleEngine.js
- [ ] T054 [US7] Add stat override logging showing which stat was substituted in lib/combatLogger.js
- [ ] T055 [US7] Validate stat override using combat harness with level-mismatched Pokemon

**Checkpoint**: Stat override moves use correct stats in calculations

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Verification, edge cases, and documentation

- [ ] T056 Verify all 9 recoil moves have correct recoil field in Source/moves/moves.json
- [ ] T057 [P] Verify all 4 OHKO moves have correct ohko field in Source/moves/moves.json
- [ ] T058 [P] Verify all level-based moves have correct formula field in Source/moves/moves.json
- [ ] T059 [P] Verify all two-turn moves have correct turns field in Source/moves/moves.json
- [ ] T060 [P] Verify all variable hit moves have correct hit_roll field in Source/moves/moves.json
- [ ] T061 [P] Verify all conditional damage moves have correct conditional field in Source/moves/moves.json
- [ ] T062 Run full combat harness test suite to verify no regressions
- [ ] T063 Update quickstart.md with actual validation results in specs/029-ambiguous-moves/quickstart.md
- [ ] T064 Run extraction-warnings.json review to ensure no new warnings from ambiguous moves

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3-9)**: All depend on Foundational phase completion
  - US1 (Recoil), US2 (OHKO), US3 (Level-Based): Can run in parallel (P1 priority)
  - US4 (Two-Turn), US5 (Variable Hit), US6 (Conditional): Can run in parallel (P2 priority)
  - US7 (Stat Override): Can run after US3 since it uses formula (P3 priority)
- **Polish (Phase 10)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (Recoil)**: No dependencies - can start after Foundational
- **User Story 2 (OHKO)**: No dependencies - can start after Foundational
- **User Story 3 (Level-Based)**: Uses formulaEvaluator from Setup - can start after Foundational
- **User Story 4 (Two-Turn)**: No dependencies - can start after Foundational
- **User Story 5 (Variable Hit)**: No dependencies - can start after Foundational
- **User Story 6 (Conditional)**: No dependencies - can start after Foundational
- **User Story 7 (Stat Override)**: Should complete after US3 (shares formula evaluation)

### Within Each User Story

- Verify data exists in moves.json first
- Implement processing function
- Integrate into battleEngine.js flow
- Add logging support
- Validate with combat harness

### Parallel Opportunities

- All Setup tasks (T001-T004) can run sequentially (same file)
- Foundational extraction tasks T005-T011 marked [P] can run in parallel (different parse functions)
- User Stories 1-3 (P1 priority) can all start simultaneously after Foundational
- User Stories 4-6 (P2 priority) can all start simultaneously
- Polish verification tasks T056-T061 marked [P] can run in parallel

---

## Parallel Example: Foundational Phase

```bash
# Launch all extraction parsers in parallel:
Task: "Add recoil field parser in scripts/extract-move-data.js"
Task: "Add formula field parser in scripts/extract-move-data.js"
Task: "Add ohko field parser in scripts/extract-move-data.js"
Task: "Add turns field parser in scripts/extract-move-data.js"
Task: "Add hit_roll field parser in scripts/extract-move-data.js"
Task: "Add conditional field parser in scripts/extract-move-data.js"
Task: "Add stat_override field parser in scripts/extract-move-data.js"
```

## Parallel Example: P1 User Stories

```bash
# Launch all P1 user stories in parallel after Foundational:
# Developer A: User Story 1 (Recoil)
# Developer B: User Story 2 (OHKO)
# Developer C: User Story 3 (Level-Based)
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

1. Complete Phase 1: Setup (formulaEvaluator)
2. Complete Phase 2: Foundational (extraction script)
3. Complete Phase 3: User Story 1 (Recoil)
4. Complete Phase 4: User Story 2 (OHKO)
5. Complete Phase 5: User Story 3 (Level-Based)
6. **STOP and VALIDATE**: Test all P1 stories independently
7. Deploy/demo if ready - covers most common ambiguous moves

### Incremental Delivery

1. Setup + Foundational -> Extraction complete
2. Add US1 (Recoil) -> Test -> 9 moves working
3. Add US2 (OHKO) -> Test -> 4 more moves working
4. Add US3 (Level-Based) -> Test -> 14+ more moves working
5. Add US4-6 (P2) -> Test -> Remaining complexity covered
6. Add US7 (P3) -> Test -> Edge cases handled

### Suggested MVP Scope

- **MVP = User Stories 1-3 (P1 priority)**
- Covers: Recoil (9 moves), OHKO (4 moves), Level-Based (14 moves)
- Total: ~27 of ~35 ambiguous moves
- Remaining P2/P3 stories handle edge cases and less common mechanics

---

## Notes

- [P] tasks = different files or functions, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable via combat harness
- Validate with `npm run test:combat` after each story completion
- Commit after each task or logical group
- Recoil parsing already partially exists in moveEffectParser.js - verify and extend
