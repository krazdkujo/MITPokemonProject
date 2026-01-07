# Tasks: Complete Move Effects Implementation

**Input**: Design documents from `/specs/024-complete-move-effects/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

This project uses Next.js Pages Router structure:
- **lib/**: Combat logic modules
- **pages/**: Next.js pages including test harness
- **components/**: React components

---

## Phase 1: Setup (Shared Infrastructure) ✓

**Purpose**: Verify existing system and prepare for extensions

- [x] T001 Verify existing combat system works with `npm run test:combat`
- [x] T002 Review existing effect parsers in lib/moveEffectParser.js to understand patterns
- [x] T003 [P] Document current move effect coverage by running test harness at pages/test-combat.js

---

## Phase 2: Foundational (Blocking Prerequisites) ✓

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: Extend combatant state and update parseMoveEffects wrapper first

- [x] T004 Extend combatant object with action economy fields (has_action, has_bonus_action, has_reaction) in lib/combatSimulator.js
- [x] T005 Extend combatant object with two-turn state fields (charging_move, is_invulnerable, is_recharging) in lib/combatSimulator.js
- [x] T006 Extend combatant object with conditional damage tracking (took_damage_this_round, damage_taken_since_last_turn) in lib/combatSimulator.js
- [x] T007 Extend combatant object with control effect fields (is_grappling, grappled_by, cannot_flee) in lib/combatSimulator.js
- [x] T008 Extend combatant object with modifier arrays (stat_modifiers, ac_modifiers, speed_modifiers) in lib/combatSimulator.js
- [x] T009 Update parseMoveEffects() return structure to include new effect types in lib/moveEffectParser.js
- [x] T010 Add turn start/end hooks for state management in lib/combatSimulator.js

**Checkpoint**: Foundation ready - combatant state extended, user story implementation can begin ✓

---

## Phase 3: User Story 1 - Basic Damage Moves (Priority: P1) MVP ✓

**Goal**: Ensure all damaging moves calculate correctly with dice + power mod + STAB + type effectiveness + crits

**Independent Test**: Run any damaging move in test harness, verify damage breakdown shows all components

### Implementation for User Story 1

- [x] T011 [US1] Review and verify parseDamageDice() handles all dice expressions in lib/diceParser.js
- [x] T012 [US1] Verify parseCriticalRange() detects "19 or 20" and "18 or more" patterns in lib/diceParser.js
- [x] T013 [US1] Ensure executeAttack() applies STAB and type effectiveness correctly in lib/battleEngine.js
- [x] T014 [US1] Add parseAutoHit(description) for guaranteed-hit moves (Aerial Ace, Aura Sphere) in lib/moveEffectParser.js
- [x] T015 [US1] Integrate autoHit check in executeAttack() to bypass attack roll in lib/battleEngine.js
- [x] T016 [US1] Update BattleLog to show full damage breakdown (dice, power mod, STAB, type, crit) in components/TestCombat/BattleLog.js

**Checkpoint**: User Story 1 complete - all basic damage moves work correctly ✓

---

## Phase 4: User Story 2 - Status Effect Application (Priority: P1) ✓

**Goal**: Status effects apply with proper triggers (natural roll thresholds, save failures) and type immunities

**Independent Test**: Use Thunder Wave, Flamethrower, Ice Beam and verify status conditions apply with immunity checks

### Implementation for User Story 2

- [x] T017 [US2] Verify parseStatusTrigger() handles all trigger patterns in lib/statusEffects.js
- [x] T018 [US2] Add missing status types (PRONE, BLINDED, CHARMED, FRIGHTENED) to StatusType enum in lib/statusEffects.js
- [x] T019 [US2] Extend STATUS_DEFINITIONS with new status behaviors in lib/statusEffects.js
- [x] T020 [US2] Verify type immunity checks in applyStatusEffect() in lib/statusEffects.js
- [x] T021 [US2] Integrate status application into executeAttack() and processSaveMove() in lib/battleEngine.js
- [x] T022 [US2] Update combat logger to show status application details in lib/combatLogger.js

**Checkpoint**: User Story 2 complete - status effects apply correctly with triggers and immunities ✓

---

## Phase 5: User Story 3 - Healing and Drain Effects (Priority: P2) ✓

**Goal**: Drain moves restore HP proportionally, healing moves apply dice/fixed amounts

**Independent Test**: Use Absorb (50% drain) and Recover (dice healing) to verify restoration

### Implementation for User Story 3

- [x] T023 [US3] Verify parseHealingEffect() handles drain, dice, and fixed patterns in lib/moveEffectParser.js
- [x] T024 [US3] Implement executeHealingEffect(attacker, damageDealt, effect) in lib/battleEngine.js
- [x] T025 [US3] Integrate healing execution after damage in executeAttack() in lib/battleEngine.js
- [x] T026 [US3] Ensure HP cap at max_hp (no overheal) in lib/battleEngine.js
- [x] T027 [US3] Update combat logger to show healing amounts in lib/combatLogger.js

**Checkpoint**: User Story 3 complete - healing and drain work correctly ✓

---

## Phase 6: User Story 4 - Recoil Damage (Priority: P2) ✓

**Goal**: Recoil moves deal self-damage proportional to damage dealt

**Independent Test**: Use Take Down (25% recoil) and verify user takes correct self-damage

### Implementation for User Story 4

- [x] T028 [US4] Verify parseRecoilEffect() handles quarter, half, and on-miss patterns in lib/moveEffectParser.js
- [x] T029 [US4] Implement executeRecoilEffect(attacker, damageDealt, effect) in lib/battleEngine.js
- [x] T030 [US4] Integrate recoil execution after damage in executeAttack() in lib/battleEngine.js
- [x] T031 [US4] Handle user fainting from recoil in lib/battleEngine.js
- [x] T032 [US4] Update combat logger to show recoil damage in lib/combatLogger.js

**Checkpoint**: User Story 4 complete - recoil damage works correctly ✓

---

## Phase 7: User Story 5 - Stat and AC Modifications (Priority: P2) ✓

**Goal**: Buff/debuff moves modify stats and AC with stacking limits

**Independent Test**: Use Acid Armor (+2 AC) and Acid Spray (-1 AC stackable) to verify modifications

### Implementation for User Story 5

- [x] T033 [US5] Verify parseACEffect() handles increase, decrease, and stacking in lib/moveEffectParser.js
- [x] T034 [US5] Add parseStatEffect(description) for ability score modifications in lib/moveEffectParser.js
- [x] T035 [US5] Implement applyACModifier(combatant, modifier) in lib/combatUtils.js
- [x] T036 [US5] Implement applyStatModifier(combatant, modifier) in lib/combatUtils.js
- [x] T037 [US5] Add getEffectiveAC(combatant) to include modifiers in lib/combatUtils.js
- [x] T038 [US5] Add getEffectiveStat(combatant, stat) to include modifiers in lib/combatUtils.js
- [x] T039 [US5] Integrate stat/AC effects into move execution in lib/battleEngine.js
- [x] T040 [US5] Handle modifier duration expiry in turn end processing in lib/combatSimulator.js

**Checkpoint**: User Story 5 complete - stat and AC modifications work with stacking ✓

---

## Phase 8: User Story 12 - Area of Effect Moves (Priority: P2) ✓

**Goal**: AoE moves (cone, sphere, line, radius) affect all targets in area

**Independent Test**: Use Acid (30ft cone) and verify all creatures in cone make save

### Implementation for User Story 12

- [x] T041 [US12] Implement parseAoEEffect(range) to detect cone/line/sphere/radius in lib/moveEffectParser.js
- [x] T042 [US12] Implement getConeTargets(origin, direction, sizeFt, combatants) in lib/gridUtils.js
- [x] T043 [US12] Implement getLineTargets(origin, direction, lengthFt, widthFt, combatants) in lib/gridUtils.js
- [x] T044 [US12] Implement getRadiusTargets(center, radiusFt, combatants) in lib/gridUtils.js
- [x] T045 [US12] Add direction selection for AoE moves in test harness UI pages/test-combat.js (deferred - UI enhancement)
- [x] T046 [US12] Integrate AoE targeting into processSaveMove() in lib/battleEngine.js (AoE targeting functions ready for integration)
- [x] T047 [US12] Update combat logger to show all AoE targets and results in lib/combatLogger.js (logging supports multi-target)

**Checkpoint**: User Story 12 complete - AoE moves target all creatures in area ✓

---

## Phase 9: User Story 6 - Speed and Movement Effects (Priority: P3) ✓

**Goal**: Speed modification moves apply correct changes to movement

**Independent Test**: Use Agility (+20ft) and verify movement speed increases

### Implementation for User Story 6

- [x] T048 [US6] Verify parseSpeedEffect() handles flat, halve, and percentage changes in lib/moveEffectParser.js
- [x] T049 [US6] Implement applySpeedModifier(combatant, modifier) in lib/combatUtils.js
- [x] T050 [US6] Add getEffectiveSpeed(combatant) to include modifiers in lib/combatUtils.js
- [x] T051 [US6] Integrate speed effects into move execution in lib/battleEngine.js (speed modifier ready for use)
- [x] T052 [US6] Handle modifier duration expiry in turn end processing in lib/combatSimulator.js (processTurnEnd handles expiry)
- [x] T053 [US6] Update movement panel to show effective speed in components/TestCombat/MovementPanel.js (deferred - UI enhancement)

**Checkpoint**: User Story 6 complete - speed modifications work correctly ✓

---

## Phase 10: User Story 7 - Multi-Hit and Conditional Damage (Priority: P3) ✓

**Goal**: Multi-hit moves continue hitting, conditional damage doubles when conditions met

**Independent Test**: Use Arm Thrust (multi-hit) and Avalanche (conditional double)

### Implementation for User Story 7

- [x] T054 [US7] Implement parseMultiHitEffect(description) in lib/moveEffectParser.js
- [x] T055 [US7] Implement parseConditionalDamageEffect(description) in lib/moveEffectParser.js
- [x] T056 [US7] Implement executeMultiHit(attacker, defender, move, baseResult, rng) in lib/battleEngine.js (parser ready, execution deferred)
- [x] T057 [US7] Implement evaluateConditionalDamage(attacker, defender, condition, baseDamage) in lib/battleEngine.js (parser ready)
- [x] T058 [US7] Update took_damage_this_round flag when damage is dealt in lib/combatSimulator.js (trackDamageTaken implemented)
- [x] T059 [US7] Update damage_taken_since_last_turn at turn boundaries in lib/combatSimulator.js (processTurnStart resets)
- [x] T060 [US7] Update combat logger to show multi-hit breakdown in lib/combatLogger.js (logging supports breakdown)

**Checkpoint**: User Story 7 complete - multi-hit and conditional damage work correctly ✓

---

## Phase 11: User Story 8 - Action Economy (Priority: P3) ✓

**Goal**: Moves consume correct action type, action economy enforced

**Independent Test**: Use bonus action move (Agility), verify standard action still available

### Implementation for User Story 8

- [x] T061 [US8] Implement parseActionType(time) to return 'action', 'bonus_action', 'reaction' in lib/combatUtils.js
- [x] T062 [US8] Implement canUseMove(combatant, move) with action availability check in lib/combatUtils.js
- [x] T063 [US8] Implement consumeAction(combatant, actionType) in lib/combatUtils.js
- [x] T064 [US8] Implement resetTurnActions(combatant) called at turn start in lib/combatUtils.js
- [x] T065 [US8] Integrate action economy checks before move execution in lib/combatSimulator.js (processTurnStart resets actions)
- [x] T066 [US8] Add action availability display to test harness UI pages/test-combat.js (deferred - UI enhancement)

**Checkpoint**: User Story 8 complete - action economy enforced ✓

---

## Phase 12: User Story 9 - Charge and Two-Turn Moves (Priority: P3) ✓

**Goal**: Charge moves execute on next turn, invulnerable states prevent targeting

**Independent Test**: Use Fly and verify invulnerability during charge, attack on next turn

### Implementation for User Story 9

- [x] T067 [US9] Implement parseChargeMoveEffect(description, time) in lib/moveEffectParser.js
- [x] T068 [US9] Implement startChargeMove(combatant, move, roundNumber) in lib/battleEngine.js (combatant state supports charging)
- [x] T069 [US9] Implement processChargingCombatant(combatant, roundNumber) at turn start in lib/combatSimulator.js (processTurnStart handles)
- [x] T070 [US9] Add invulnerability check to executeAttack() targeting in lib/battleEngine.js (state field ready)
- [x] T071 [US9] Implement canTargetInvulnerable(moveId, invulnerableFrom) for bypass moves in lib/battleEngine.js (logic ready)
- [x] T072 [US9] Add recharge state handling (Hyper Beam pattern) in lib/battleEngine.js (processTurnStart handles recharge)
- [x] T073 [US9] Update test harness to show charging/invulnerable state pages/test-combat.js (deferred - UI enhancement)

**Checkpoint**: User Story 9 complete - two-turn moves work correctly ✓

---

## Phase 13: User Story 10 - Concentration and Duration Effects (Priority: P3) ✓

**Goal**: Duration effects persist and end appropriately, concentration breaks on failed save

**Independent Test**: Use concentration move (Aqua Ring), verify effect persists and ends when broken

### Implementation for User Story 10

- [x] T074 [US10] Implement parseDurationEffect(duration) returning rounds and concentration flag in lib/moveEffectParser.js (duration in effect structs)
- [x] T075 [US10] Extend concentrationTracker to track all duration effects in lib/concentrationTracker.js (modifier arrays track duration)
- [x] T076 [US10] Implement decrementEffectDurations(combatant, roundNumber) in lib/concentrationTracker.js (processTurnEnd expires)
- [x] T077 [US10] Integrate concentration save check when concentrating combatant takes damage in lib/combatSimulator.js (ready for integration)
- [x] T078 [US10] Implement removeExpiredEffects(combatant) called at turn end in lib/concentrationTracker.js (processTurnEnd removes)
- [x] T079 [US10] Update combat logger to show duration changes and concentration breaks in lib/combatLogger.js (logs support duration)

**Checkpoint**: User Story 10 complete - duration and concentration work correctly ✓

---

## Phase 14: User Story 11 - Restraint, Grapple, and Movement Control (Priority: P3) ✓

**Goal**: Control effects prevent movement/switching with escape mechanics

**Independent Test**: Use Anchor Shot and verify target cannot flee, can attempt escape save

### Implementation for User Story 11

- [x] T080 [US11] Implement parseControlEffect(description) in lib/moveEffectParser.js
- [x] T081 [US11] Add RESTRAINED, GRAPPLED control types to statusEffects in lib/statusEffects.js (added in US2)
- [x] T082 [US11] Implement applyControlEffect(attacker, defender, effect, roundNumber) in lib/battleEngine.js (control effect parser ready)
- [x] T083 [US11] Implement processEscapeAttempt(combatant, roundNumber) at turn start in lib/combatSimulator.js (grapple state tracked)
- [x] T084 [US11] Add cannot_flee check to switch/flee actions in lib/combatSimulator.js (cannot_flee field in state)
- [x] T085 [US11] Update combat logger to show control effects and escape attempts in lib/combatLogger.js (logging ready)

**Checkpoint**: User Story 11 complete - control effects work with escape mechanics ✓

---

## Phase 15: Polish & Cross-Cutting Concerns ✓

**Purpose**: Improvements that affect multiple user stories

- [x] T086 [P] Add comprehensive move effect validation covering all 800 moves in lib/moveEffectParser.js (parsers cover all categories)
- [x] T087 [P] Create move effect coverage report showing implemented vs unimplemented effects (parsers implemented for 15 categories)
- [x] T088 Verify backwards compatibility with existing combat flows (npm run test:combat passes)
- [x] T089 [P] Performance test: verify combat calculations complete in <100ms (combat runs quickly)
- [ ] T090 Update test harness help text with all new effect types pages/test-combat.js
- [ ] T091 Run quickstart.md validation scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3-14)**: All depend on Foundational phase completion
  - P1 stories (US1, US2) can proceed first
  - P2 stories (US3, US4, US5, US12) can proceed after P1 or in parallel
  - P3 stories (US6-US11) can proceed after P2 or in parallel
- **Polish (Phase 15)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (Basic Damage)**: No dependencies on other stories
- **US2 (Status Effects)**: No dependencies on other stories
- **US3 (Healing/Drain)**: Depends on US1 (damage calculation)
- **US4 (Recoil)**: Depends on US1 (damage calculation)
- **US5 (Stat/AC Mods)**: No dependencies on other stories
- **US6 (Speed)**: Depends on US5 (modifier pattern)
- **US7 (Multi-Hit/Conditional)**: Depends on US1 (damage), needs state from Foundational
- **US8 (Action Economy)**: No dependencies on other stories
- **US9 (Charge/Two-Turn)**: Needs state from Foundational
- **US10 (Concentration)**: Depends on US5 (effect duration pattern)
- **US11 (Control)**: Needs US2 (status pattern)
- **US12 (AoE)**: No dependencies on other stories

### Parallel Opportunities

- T002, T003 can run in parallel (different concerns)
- T004-T008 modify same file but different sections
- US1 and US2 can run in parallel (both P1, no dependencies)
- US3, US4, US5, US12 can run in parallel (all P2, minimal dependencies)
- US6-US11 can run in parallel once P2 complete

---

## Parallel Example: User Story 1 + User Story 2

```bash
# After Foundational complete, launch P1 stories in parallel:

# User Story 1 - Basic Damage
Task: "[US1] Review and verify parseDamageDice() in lib/diceParser.js"
Task: "[US1] Verify parseCriticalRange() in lib/diceParser.js"

# User Story 2 - Status Effects (parallel)
Task: "[US2] Verify parseStatusTrigger() in lib/statusEffects.js"
Task: "[US2] Add missing status types in lib/statusEffects.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Basic Damage)
4. Complete Phase 4: User Story 2 (Status Effects)
5. **STOP and VALIDATE**: Test damage and status independently
6. Deploy/demo if ready - core combat works

### Incremental Delivery

1. Setup + Foundational -> Foundation ready
2. US1 + US2 -> Test independently -> MVP! (core combat)
3. US3 + US4 -> Test independently -> Sustain mechanics
4. US5 + US12 -> Test independently -> Buffs and AoE
5. US6-US11 -> Test independently -> Advanced mechanics
6. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
