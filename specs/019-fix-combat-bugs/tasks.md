# Tasks: Fix Combat System Bugs

**Input**: Design documents from `/specs/019-fix-combat-bugs/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/battle-end-api.yaml

**Tests**: Manual testing via dev server as specified in quickstart.md. No automated test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md, this is a Next.js monorepo:
- **Pages/API**: `pages/`, `pages/api/`
- **Components**: `components/Combat/`
- **Libraries**: `lib/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create new API endpoint needed by multiple user stories

- [ ] T001 Create pages/api/battle/end.js shell with auth check and request validation per contracts/battle-end-api.yaml

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement core battle end endpoint that MUST be complete before user story work

**CRITICAL**: The battle end API (T002-T005) blocks US3 and US4 because all depend on HP persistence and battle cleanup

- [ ] T002 Implement battle lookup in pages/api/battle/end.js - validate battle_id exists and belongs to user
- [ ] T003 Implement status update in pages/api/battle/end.js - set active_battles.status to outcome ('victory' or 'defeat')
- [ ] T004 Implement HP persistence in pages/api/battle/end.js - update player_pokemon.current_hp for all player combatants
- [ ] T005 Implement response format in pages/api/battle/end.js - return success with hp_updated array per contracts/battle-end-api.yaml

**Checkpoint**: Battle end API ready - can persist HP and cleanup battles

---

## Phase 3: User Story 1 - Combat Action Feedback (Priority: P1)

**Goal**: Display complete attack feedback in battle log before defeat modal appears

**Independent Test**: Start battle, pass turn, opponent attacks - see attack details in log before any modal

### Implementation for User Story 1

- [ ] T006 [US1] Add detailed attack log entry in processAttackResult() in pages/combat.js - include attacker name, move name, hit/miss, damage, HP before/after
- [ ] T007 [US1] Add movement log entry when opponent moves in executeOpponentTurn() in pages/combat.js
- [ ] T008 [US1] Add pass turn log entry when opponent passes in executeOpponentTurn() in pages/combat.js
- [ ] T009 [US1] Ensure log entry is added BEFORE phase transition check in processAttackResult()

**Checkpoint**: All opponent actions display complete feedback in battle log

---

## Phase 4: User Story 2 - Proper Turn Execution (Priority: P1)

**Goal**: Add delay between attack feedback and defeat modal to ensure visibility

**Independent Test**: Let opponent knock out your Pokemon - see attack log, HP update, then 1.5 second pause before defeat modal

### Implementation for User Story 2

- [ ] T010 [US2] Add 1.5 second delay in processAttackResult() between log update and setBattleResult('defeat') call
- [ ] T011 [US2] Move setBattleResult() call to after the delay in processAttackResult()
- [ ] T012 [US2] Ensure HP bar animation completes during delay by updating combatant HP in state first
- [ ] T013 [US2] Handle victory scenario with same delay pattern for consistency

**Checkpoint**: Defeat/victory feedback visible for 1.5 seconds before modal appears

---

## Phase 5: User Story 3 - Battle Completion and Cleanup (Priority: P1)

**Goal**: Properly end battles in database and prevent stale battle loading

**Independent Test**: Complete battle (defeat), navigate to zones, start new battle - no "battle in progress" error

### Implementation for User Story 3

- [ ] T014 [US3] Call /api/battle/end in handleBattleEndContinue() in pages/combat.js with outcome and combatant HP
- [ ] T015 [US3] Call /api/battle/end in processAttackResult() when defeat/victory detected (after delay)
- [ ] T016 [US3] Build combatants payload with pokemon_db_id and current_hp from battleState in pages/combat.js
- [ ] T017 [US3] Add console.log for debugging battle end calls per quickstart.md
- [ ] T018 [US3] Handle API error response gracefully - show error toast but still navigate away

**Checkpoint**: All completed battles are cleaned up in database

---

## Phase 6: User Story 4 - HP Synchronization (Priority: P2)

**Goal**: Pokemon HP at PokeCenter matches combat outcome

**Independent Test**: Take damage, flee/defeat, visit PokeCenter - HP shows damage taken, healing works

### Implementation for User Story 4

- [ ] T019 [US4] Verify pages/pokecenter.js reads current_hp from player_pokemon (should already work)
- [ ] T020 [US4] Verify heal button is enabled when current_hp < max_hp in pages/pokecenter.js
- [ ] T021 [US4] Add integration test path: combat damage -> flee -> pokecenter shows correct HP
- [ ] T022 [US4] Add integration test path: combat KO -> defeat -> pokecenter shows 0 HP

**Checkpoint**: HP fully synchronized between combat and PokeCenter

---

## Phase 7: Polish & Verification

**Purpose**: Final validation and edge case handling

- [ ] T023 [P] Add retry logic for /api/battle/end call (1 retry on failure) in pages/combat.js
- [ ] T024 [P] Handle edge case: both Pokemon faint same turn (defeat takes priority)
- [ ] T025 Run quickstart.md Test 1: Opponent Attack Feedback
- [ ] T026 Run quickstart.md Test 2: HP Persistence to Database
- [ ] T027 Run quickstart.md Test 3: Battle Cleanup (No Stale Battles)
- [ ] T028 Run quickstart.md Test 4: Victory Path
- [ ] T029 Run quickstart.md Test 5: PokeCenter Healing After Defeat

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on T001 completion - BLOCKS US3 and US4
- **US1 (Phase 3)**: No dependencies - can run parallel with Foundational
- **US2 (Phase 4)**: No dependencies - can run parallel with US1
- **US3 (Phase 5)**: Depends on Foundational (needs /api/battle/end endpoint)
- **US4 (Phase 6)**: Depends on US3 (needs HP persistence working)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

| Story | Priority | Depends On | Can Parallel With |
|-------|----------|------------|-------------------|
| US1 (Feedback) | P1 | None | US2, Foundational |
| US2 (Delay) | P1 | None | US1, Foundational |
| US3 (Cleanup) | P1 | Foundational | None |
| US4 (HP Sync) | P2 | US3 | None |

### Within Each User Story

- API endpoint before client integration
- Log entries before state transitions
- Core implementation before edge cases

### Parallel Opportunities

- T006-T009 (US1) can run parallel with T010-T013 (US2)
- US1 and US2 can run parallel with T002-T005 (Foundational)
- All [P] marked tasks within a phase can run in parallel

---

## Implementation Strategy

### MVP First (P1 Stories Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002-T005) - CRITICAL for cleanup
3. Complete Phase 3: US1 - Combat action feedback
4. Complete Phase 4: US2 - Proper turn execution with delay
5. Complete Phase 5: US3 - Battle completion and cleanup
6. **STOP and VALIDATE**: All P1 stories functional
7. Run quickstart.md tests

### Incremental Delivery

1. Setup + Foundational -> API ready
2. Add US1 -> Attack feedback visible (Test 1!)
3. Add US2 -> Delay before modal (Test 1 complete!)
4. Add US3 -> Battles cleaned up (Test 3 + 4!)
5. Add US4 -> HP synchronized (Test 2 + 5!)

### Suggested MVP Scope

**Minimum Viable Product**: US1 + US2 + US3 (all P1 stories)
- Players see full attack feedback before defeat
- 1.5 second delay ensures feedback visibility
- Battles properly cleaned up, no stale records

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- T002-T005 are critical for battle cleanup - must be done before US3 work
