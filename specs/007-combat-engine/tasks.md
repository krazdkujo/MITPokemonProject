# Tasks: Combat Engine

**Input**: Design documents from `/specs/007-combat-engine/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not requested in specification. Implementation-only tasks.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, etc.)
- Include exact file paths in descriptions

## Path Conventions

- **Lib utilities**: `lib/` at repository root
- **API routes**: `pages/api/` (Next.js convention)
- **Source data**: `Source/` (read-only reference)

---

## Phase 1: Setup

**Purpose**: Verify existing infrastructure and prepare new module structure

- [x] T001 Verify existing combat utilities are working in lib/combatUtils.js, lib/diceRoller.js, lib/typeEffectiveness.js
- [x] T002 [P] Add getAbilityById() function to lib/pokemonData.js for ability lookups from Source/abilities/abilities.json
- [x] T003 [P] Create lib/statusEffects.js with module structure and exports placeholder
- [x] T004 [P] Create lib/initiativeUtils.js with module structure and exports placeholder
- [x] T005 [P] Create lib/ppTracker.js with module structure and exports placeholder

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure needed by multiple user stories

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Define StatusType enum constants (ASLEEP, BURNED, FROZEN, PARALYZED, POISONED, BADLY_POISONED, CONFUSED, FLINCHED) in lib/statusEffects.js
- [x] T007 Define STATUS_DEFINITIONS object with volatility, duration, and tick damage per status type in lib/statusEffects.js
- [x] T008 [P] Add parseCriticalRange() function to lib/diceParser.js to extract extended crit ranges from move descriptions
- [x] T009 [P] Add parseStatusTrigger() function to lib/statusEffects.js to detect status keywords in move descriptions
- [x] T010 Add hasBattleArmorAbility() helper to lib/pokemonData.js to check for Battle Armor or Shell Armor

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 & 2 - Basic Attack Turn & Turn Order (Priority: P1)

**Goal**: Process attack turns with initiative-based turn order (the core combat loop)

**Independent Test**: Start a battle, verify initiative determines who acts first, execute attack with correct damage calculation

### Implementation

- [x] T011 [P] [US2] Implement rollInitiative(pokemon) in lib/initiativeUtils.js returning { natural_roll, modifier, total }
- [x] T012 [P] [US2] Implement sortByInitiative(combatants) in lib/initiativeUtils.js with DEX tiebreaker
- [x] T013 [US2] Implement determineFirstActor(playerPokemon, opponent) in lib/initiativeUtils.js using rollInitiative and sortByInitiative
- [x] T014 [US1] Update calculateAttackRoll() in lib/battleEngine.js to accept optional critThreshold parameter
- [x] T015 [US1] Update calculateDamage() in lib/battleEngine.js to check defender abilities for Battle Armor (negate crit bonus)
- [x] T016 [US1] Integrate parseCriticalRange() into attack flow in lib/battleEngine.js to use move-specific crit thresholds
- [x] T017 [US1] Create buildCombatant() helper in lib/battleEngine.js to construct Combatant object from player_pokemon record + Source data
- [x] T018 [US1][US2] Create pages/api/battle/start.js endpoint that initializes battle with initiative rolls per contracts/combat-api.md
- [x] T019 [US1][US2] Update pages/api/battle.js to accept battle_state and use initiative_order for turn processing

**Checkpoint**: Basic combat with initiative works. Can test: start battle, check who goes first, execute attacks with correct damage.

---

## Phase 4: User Story 3 - Apply Status Effects (Priority: P2)

**Goal**: Moves can inflict status conditions with correct mechanics per Pokemon 5e

**Independent Test**: Use a status-inflicting move, verify status is applied (or blocked by immunity), verify end-of-turn damage

### Implementation

- [x] T020 [P] [US3] Implement createStatusEffect() in lib/statusEffects.js returning StatusEffect object with id, type, volatility, remaining_rounds
- [x] T021 [P] [US3] Implement checkStatusImmunity(statusType, defenderTypes) in lib/statusEffects.js for Fire/Burn, Electric/Paralysis, Ice/Freeze, Poison+Steel/Poison
- [x] T022 [US3] Implement canApplyStatus(combatant, statusType) in lib/statusEffects.js checking existing non-volatile, immunity, grace period
- [x] T023 [US3] Implement applyStatusEffect(combatant, statusType, roundNumber) in lib/statusEffects.js returning StatusChange object
- [x] T024 [US3] Implement removeVolatileStatuses(combatant, reason) in lib/statusEffects.js for switch-out and combat end
- [x] T025 [US3] Implement processEndOfTurnStatus(combatant) in lib/statusEffects.js returning EndOfTurnDamage for Burn/Poison tick damage
- [x] T026 [US3] Implement processStartOfTurnStatus(combatant) in lib/statusEffects.js for Paralysis d4 check and Sleep wake check
- [x] T027 [US3] Integrate status application into executeAttack() in lib/battleEngine.js using parseStatusTrigger() results
- [x] T028 [US3] Add end_of_turn processing to processBattleTurn() in lib/battleEngine.js calling processEndOfTurnStatus()
- [x] T029 [US3] Add start_of_turn processing to processBattleTurn() in lib/battleEngine.js calling processStartOfTurnStatus()
- [x] T030 [US3] Update pages/api/battle.js response to include status_effects array and end_of_turn damage in turn result

**Checkpoint**: Status effects work. Can test: apply Burn, verify tick damage; apply to Fire-type, verify immunity; apply second non-volatile, verify blocked.

---

## Phase 5: User Story 4 & 7 - PP Tracking and Struggle (Priority: P2/P3)

**Goal**: Track PP consumption per move, enable Struggle when all PP exhausted

**Independent Test**: Use moves until PP reaches 0, verify move becomes unavailable, verify Struggle is usable with recoil

### Implementation

- [x] T031 [P] [US4] Implement initializePP(knownMoves) in lib/ppTracker.js loading max PP from Source for each move
- [x] T032 [P] [US4] Implement canUseMove(movePP, moveId) in lib/ppTracker.js returning true if PP > 0
- [x] T033 [US4] Implement consumePP(movePP, moveId) in lib/ppTracker.js decrementing and returning updated PP object
- [x] T034 [US4][US7] Implement mustUseStruggle(movePP) in lib/ppTracker.js returning true if all moves at 0 PP
- [x] T035 [US7] Implement getStruggleMove() in lib/ppTracker.js returning Struggle move definition (typeless, recoil)
- [x] T036 [US4] Update executeAttack() in lib/battleEngine.js to call consumePP() and track pp_consumed in ActionResult
- [x] T037 [US4] Update processPlayerTurn() in lib/battleEngine.js to validate PP before allowing move (return error if 0 PP)
- [x] T038 [US7] Update processPlayerTurn() in lib/battleEngine.js to handle move_id="struggle" with applyStruggleRecoil()
- [x] T039 [US4][US7] Update pages/api/battle.js to include move_pp in battle_state and return NO_PP_REMAINING error when applicable

**Checkpoint**: PP tracking works. Can test: use moves, watch PP decrement; exhaust all PP, only Struggle available; use Struggle, verify recoil.

---

## Phase 6: User Story 5 - Calculate Critical Hits (Priority: P2)

**Goal**: Support move-specific critical hit ranges and Battle Armor negation

**Independent Test**: Use Air Cutter (19-20 crit), verify crit triggers on natural 19; attack Pokemon with Battle Armor, verify crit bonus negated

### Implementation

- [x] T040 [US5] Add move.critThreshold caching in calculateAttackRoll() in lib/battleEngine.js
- [x] T041 [US5] Update isCritical check in calculateAttackRoll() to use parseCriticalRange(move.description) result
- [x] T042 [US5] Update calculateDamage() in lib/battleEngine.js to pass is_critical flag through and double dice rolls
- [x] T043 [US5] Add ability check in calculateDamage() for Battle Armor / Shell Armor to negate crit dice doubling
- [x] T044 [US5] Update attack_roll response structure in lib/battleEngine.js to include crit_threshold field

**Checkpoint**: Extended crit ranges work. Can test: roll natural 19 with Air Cutter, verify critical; Battle Armor defender, verify normal damage on crit.

---

## Phase 7: User Story 6 - Calculate Experience on Victory (Priority: P3)

**Goal**: Award XP on victory or catch with correct formulas

**Independent Test**: Defeat opponent, verify XP = 200 x level x SR; catch opponent, verify XP = (200 x level x SR) / 5

### Implementation

- [x] T045 [US6] Add wasCaught parameter to calculateXpAward() in lib/experienceUtils.js, apply 1/5 multiplier if true
- [x] T046 [US6] Implement calculateBattleRewards(opponent, wasCaught, participatingPokemon) in lib/experienceUtils.js
- [x] T047 [US6] Update processBattleTurn() in lib/battleEngine.js to call calculateBattleRewards() on victory outcome
- [x] T048 [US6] Create pages/api/battle/catch.js endpoint returning reduced XP award per contracts/combat-api.md
- [x] T049 [US6] Update victory response in pages/api/battle.js to include rewards object with xp_awarded and currency_awarded

**Checkpoint**: XP calculation works. Can test: defeat level 5 SR 0.5 Pokemon, verify 500 XP; catch same, verify 100 XP.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final integration and cleanup

- [x] T050 Add comprehensive error codes (MOVE_NOT_FOUND, NO_PP_REMAINING, INVALID_POWER_STAT, POKEMON_FAINTED, etc.) to lib/apiResponse.js
- [x] T051 [P] Add JSDoc comments to all new functions in lib/statusEffects.js
- [x] T052 [P] Add JSDoc comments to all new functions in lib/initiativeUtils.js
- [x] T053 [P] Add JSDoc comments to all new functions in lib/ppTracker.js
- [x] T054 Update module exports in lib/battleEngine.js to expose new functions
- [x] T055 Validate all API responses match contracts/combat-api.md structure
- [x] T056 Run through quickstart.md scenarios manually to verify end-to-end flow

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **US1+US2 (Phase 3)**: Depends on Foundational - Core combat loop
- **US3 (Phase 4)**: Depends on Foundational - Can run parallel to Phase 3
- **US4+US7 (Phase 5)**: Depends on Foundational - Can run parallel to Phase 3/4
- **US5 (Phase 6)**: Depends on Phase 3 (integrates into attack roll)
- **US6 (Phase 7)**: Depends on Phase 3 (integrates into battle outcome)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

| Story | Can Start After | Dependencies |
|-------|-----------------|--------------|
| US1+US2 | Foundational | None - core loop |
| US3 | Foundational | None (integrates with attack flow) |
| US4+US7 | Foundational | None (integrates with attack flow) |
| US5 | US1+US2 | Uses updated calculateAttackRoll |
| US6 | US1+US2 | Uses battle outcome handling |

### Parallel Opportunities

**Phase 1 (all [P] tasks):**
```
T002, T003, T004, T005 - Create all new module files in parallel
```

**Phase 2 (after T006, T007):**
```
T008, T009, T010 - Parse helpers in parallel
```

**Phase 3:**
```
T011, T012 - Initiative functions in parallel
```

**Phase 4:**
```
T020, T021 - Status creation and immunity in parallel
```

**Phase 5:**
```
T031, T032 - PP initialization and check in parallel
```

**Phase 8:**
```
T051, T052, T053 - JSDoc comments in parallel
```

---

## Parallel Example: Phase 3 (Core Combat)

```bash
# First: Create initiative utilities in parallel
Task: "T011 [P] [US2] Implement rollInitiative(pokemon) in lib/initiativeUtils.js"
Task: "T012 [P] [US2] Implement sortByInitiative(combatants) in lib/initiativeUtils.js"

# Then: Sequential tasks that depend on above
Task: "T013 [US2] Implement determineFirstActor() using rollInitiative and sortByInitiative"

# Meanwhile: Update attack flow (can run parallel to T013)
Task: "T014 [US1] Update calculateAttackRoll() with critThreshold parameter"
Task: "T015 [US1] Update calculateDamage() with Battle Armor check"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T010)
3. Complete Phase 3: US1+US2 - Basic Attack + Initiative (T011-T019)
4. **STOP and VALIDATE**: Start battle, verify initiative, execute attacks
5. Deploy/demo if ready - basic combat is functional

### Incremental Delivery

| Increment | Stories | Capability Added |
|-----------|---------|------------------|
| MVP | US1+US2 | Basic combat with initiative |
| +Status | US3 | Burn, poison, paralysis, etc. |
| +PP | US4+US7 | Resource management, Struggle |
| +Crits | US5 | Extended crit ranges, Battle Armor |
| +XP | US6 | Victory rewards, catch rewards |

### Task Counts by Story

| User Story | Task Count | Complexity |
|------------|------------|------------|
| US1 (Attack) | 6 tasks | Medium - extends existing code |
| US2 (Initiative) | 5 tasks | Low - new module, simple logic |
| US3 (Status) | 11 tasks | High - new system with many conditions |
| US4 (PP) | 5 tasks | Low - tracking and validation |
| US5 (Crits) | 5 tasks | Low - extends attack roll |
| US6 (XP) | 5 tasks | Low - extends existing utils |
| US7 (Struggle) | 4 tasks | Low - special case handling |
| Setup | 5 tasks | - |
| Foundational | 5 tasks | - |
| Polish | 7 tasks | - |

**Total: 56 tasks**

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US1 and US2 are combined in Phase 3 since they form the core combat loop
- US4 and US7 are combined in Phase 5 since Struggle depends on PP tracking
- All Source data reads are from existing files - no database migrations needed
- Combat state is client-managed between API calls (stateless engine)
