# Tasks: Combat Status Effects Integration

**Input**: Design documents from `/specs/022-combat-status-effects/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested - no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US6)
- Include exact file paths in descriptions

## Path Conventions

- **Project type**: Next.js monolith
- **Library code**: `lib/`
- **Pages**: `pages/`
- **Components**: `components/`

---

## Phase 1: Setup

**Purpose**: Create new module and prepare existing modules for enhancement

- [x] T001 [P] Create move effect parser module skeleton in lib/moveEffectParser.js with JSDoc types from data-model.md
- [x] T002 [P] Add structured log array and getStructuredLog() method to lib/combatLogger.js

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core parsing and logging infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Implement parseHealingEffect() in lib/moveEffectParser.js for drain/dice/fixed patterns
- [x] T004 Implement parseRecoilEffect() in lib/moveEffectParser.js for 25%/50% recoil patterns
- [x] T005 Implement parseACEffect() in lib/moveEffectParser.js for AC increase/decrease patterns
- [x] T006 Implement parseSpeedEffect() in lib/moveEffectParser.js for speed modification patterns
- [x] T007 Implement parseMoveEffects() wrapper in lib/moveEffectParser.js that calls all parsers
- [x] T008 Extend parseStatusTrigger() in lib/statusEffects.js to handle "fail by 5+" save patterns
- [x] T009 Modify processStartOfTurnStatus() in lib/statusEffects.js to return roll details in result object
- [x] T010 Modify processEndOfTurnStatus() in lib/statusEffects.js to return detailed damage info in result object

**Checkpoint**: Foundation ready - parser and status functions return detailed data for logging

---

## Phase 3: User Story 1 - View Status Effect Application in Combat Log (Priority: P1) 🎯 MVP

**Goal**: Combat log shows status application results with full trigger details (rolls, thresholds, DC, save totals)

**Independent Test**: Use Thunder Wave on opponent - log shows "OPPONENT is now PARALYZED!" with save roll details

### Implementation for User Story 1

- [x] T011 [US1] Add logStatusApplied() method to lib/combatLogger.js per combat-logger-api.md contract
- [x] T012 [US1] Add logStatusBlocked() method to lib/combatLogger.js per combat-logger-api.md contract
- [x] T013 [US1] Modify executeAttack() in lib/battleEngine.js to capture status trigger details (roll, threshold, dc, saveTotal)
- [x] T014 [US1] Modify executeSaveAttack() in lib/battleEngine.js to capture status trigger details for save moves
- [x] T015 [US1] Wire status logging into processTurn() in lib/combatSimulator.js
- [x] T016 [US1] Update BattleLog.js in components/TestCombat/ to render status_applied and status_blocked entries

**Checkpoint**: Status application shows in log with "★ POKEMON is now PARALYZED! └─ Thunder Wave (CON save: 8 vs DC 14 - FAILED)"

---

## Phase 4: User Story 2 - See Ongoing Status Damage in Combat Log (Priority: P1)

**Goal**: End-of-turn tick damage (Burn, Poison) shows in combat log with HP changes

**Independent Test**: Burned Pokemon ends turn - log shows "POKEMON takes 2 BURNED damage (25 → 23 HP)"

### Implementation for User Story 2

- [x] T017 [US2] Enhance existing logStatusDamage() in lib/combatLogger.js to show HP before/after
- [x] T018 [US2] Add logStatusFaint() method to lib/combatLogger.js for fainting from status damage
- [x] T019 [US2] Modify processBattleTurn() in lib/battleEngine.js to use enhanced status damage results
- [x] T020 [US2] Wire end-of-turn status damage logging into simulateTurn() in lib/combatSimulator.js
- [x] T021 [US2] Update BattleLog.js in components/TestCombat/ to render status_damage entries with HP transition

**Checkpoint**: Turn end shows "★ CHARIZARD takes 3 BURNED damage (45 → 42 HP)"

---

## Phase 5: User Story 3 - View Turn-Affecting Status Effects (Priority: P1)

**Goal**: Status checks at turn start (Paralysis skip, Sleep wake, Frozen break, Confusion) show roll details

**Independent Test**: Paralyzed Pokemon rolls 1 - log shows "POKEMON is paralyzed and cannot move! (rolled 1 on d4)"

### Implementation for User Story 3

- [x] T022 [US3] Add logStatusCheck() method to lib/combatLogger.js per combat-logger-api.md contract
- [x] T023 [US3] Enhance logSkippedTurn() in lib/combatLogger.js to include roll details
- [x] T024 [US3] Add confusion behavior strings to lib/statusEffects.js processConfusedBehavior() return object
- [x] T025 [US3] Add frozen break details to lib/statusEffects.js attemptBreakFrozen() return object
- [x] T026 [US3] Wire start-of-turn status checks with roll logging into simulateTurn() in lib/combatSimulator.js
- [x] T027 [US3] Update BattleLog.js in components/TestCombat/ to render status_check and turn_skip entries with dice details

**Checkpoint**: Turn start shows "⚡ JOLTEON paralysis check: d4(1) → Cannot move!" or "💤 SNORLAX wake check: d20(14) ≥ 11 → Woke up!"

---

## Phase 6: User Story 4 - See Move Extra Effects in Combat Log (Priority: P2)

**Goal**: Move effects (healing, recoil, AC changes) display in combat log

**Independent Test**: Use Absorb - log shows damage AND "POKEMON healed for 3 HP (50% of damage dealt)"

### Implementation for User Story 4

- [x] T028 [P] [US4] Add logHealing() method to lib/combatLogger.js per combat-logger-api.md contract
- [x] T029 [P] [US4] Add logRecoil() method to lib/combatLogger.js per combat-logger-api.md contract
- [x] T030 [P] [US4] Add logACChange() method to lib/combatLogger.js per combat-logger-api.md contract
- [x] T031 [US4] Integrate parseMoveEffects() call into executeAttack() in lib/battleEngine.js
- [x] T032 [US4] Apply healing effect in executeAttack() when effects.healing is present in lib/battleEngine.js
- [x] T033 [US4] Apply recoil effect in executeAttack() when effects.recoil is present in lib/battleEngine.js
- [x] T034 [US4] Apply AC effect in executeAttack() when effects.acEffect is present in lib/battleEngine.js
- [x] T035 [US4] Wire healing/recoil/AC logging into processTurn() in lib/combatSimulator.js
- [x] T036 [US4] Update BattleLog.js in components/TestCombat/ to render healing, recoil, ac_change entries

**Checkpoint**: Absorb shows "💚 VENUSAUR healed 8 HP from GIGA DRAIN (50% of 16 damage)"

---

## Phase 7: User Story 5 - Burn Penalty Applied to Damage (Priority: P2)

**Goal**: Burned Pokemon damage penalty (roll twice, take lower) shows in combat log

**Independent Test**: Burned Pokemon attacks - log shows "Damage: 1d4(3,1→1) [BURNED: lower roll used]"

### Implementation for User Story 5

- [x] T037 [US5] Add logBurnedPenalty() method to lib/combatLogger.js per combat-logger-api.md contract
- [x] T038 [US5] Modify calculateDamage() in lib/battleEngine.js to include both rolls in burned_penalty result
- [x] T039 [US5] Wire burn penalty logging into damage display in lib/combatSimulator.js
- [x] T040 [US5] Update BattleLog.js in components/TestCombat/ to show burn penalty in damage line

**Checkpoint**: Burned attacker shows "🔥 BURNED penalty: 2d6(8,3) → using 3 (lower roll)"

---

## Phase 8: User Story 6 - Flinch Effects on Combat (Priority: P2)

**Goal**: Flinched Pokemon disadvantage/advantage shows in combat log

**Independent Test**: Flinched Pokemon attacks - log shows "Attack Roll: d20(15,8→8) DIS [FLINCHED]"

### Implementation for User Story 6

- [x] T041 [US6] Add logFlinchedEffect() method to lib/combatLogger.js per combat-logger-api.md contract
- [x] T042 [US6] Modify calculateAttackRoll() in lib/battleEngine.js to include flinched status reason in result
- [x] T043 [US6] Modify processSaveMove() in lib/battleEngine.js to log target advantage from flinched attacker
- [x] T044 [US6] Wire flinch logging into attack roll display in lib/combatSimulator.js
- [x] T045 [US6] Update BattleLog.js in components/TestCombat/ to show flinch indicators on attack rolls

**Checkpoint**: Flinched attacker shows "😵 FLINCHED: MACHAMP attacks with disadvantage d20(15,8) → 8"

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Integration validation and UI polish

- [x] T046 [P] Add structured log entry types constant to lib/combatLogger.js for UI consumption
- [x] T047 [P] Update pages/combat.js to render enhanced log entries from main combat page
- [x] T048 [P] Update pages/test-combat.js to display all new log entry types
- [x] T049 Run quickstart.md validation scenarios with test harness (npm run test:combat)
- [x] T050 Verify all 8 status types function with correct logging using seeded random for reproducibility

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - US1, US2, US3 are P1 priority - complete first
  - US4, US5, US6 are P2 priority - complete after P1 stories
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundational only - status application logging
- **User Story 2 (P1)**: Foundational only - status damage logging
- **User Story 3 (P1)**: Foundational only - turn status check logging
- **User Story 4 (P2)**: Foundational + parser - move effects (healing/recoil/AC)
- **User Story 5 (P2)**: US1 (status logging) - burn penalty display
- **User Story 6 (P2)**: US1 (status logging) - flinch effects display

### Within Each User Story

- Logger methods before integration
- Battle engine modifications before simulator wiring
- Backend complete before UI updates

### Parallel Opportunities

- T001, T002 can run in parallel (Setup)
- T028, T029, T030 can run in parallel (US4 logger methods)
- T046, T047, T048 can run in parallel (Polish)
- Different user stories can be worked on in parallel once Foundational is complete

---

## Parallel Example: User Story 4

```bash
# Launch all logger methods for User Story 4 together:
Task: "Add logHealing() method to lib/combatLogger.js"
Task: "Add logRecoil() method to lib/combatLogger.js"
Task: "Add logACChange() method to lib/combatLogger.js"

# Then sequentially:
Task: "Integrate parseMoveEffects() call into executeAttack()"
Task: "Apply healing effect in executeAttack()"
# ...etc
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: US1 - Status application logging
4. Complete Phase 4: US2 - Status damage logging
5. Complete Phase 5: US3 - Turn status check logging
6. **STOP and VALIDATE**: Test all status logging independently
7. Deploy/demo if ready - MVP complete!

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Status applied) → Test → Deploy (MVP!)
3. Add US2 (Status damage) → Test → Deploy
4. Add US3 (Turn checks) → Test → Deploy (P1 complete!)
5. Add US4 (Move effects) → Test → Deploy
6. Add US5 (Burn penalty) → Test → Deploy
7. Add US6 (Flinch effects) → Test → Deploy (Feature complete!)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- All logging methods follow the contract in contracts/combat-logger-api.md
- All data structures follow types in data-model.md
- Seeded random (existing) enables deterministic testing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
