# Tasks: Battle API Endpoint

**Input**: Design documents from `/specs/006-battle-api/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/battle-api.yaml

**Tests**: Not explicitly requested - test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Project Type**: Next.js web application
- **API Routes**: `pages/api/`
- **Utilities**: `lib/`
- **Migrations**: `sql/`
- **Source Data**: `Source/` (read-only)

---

## Phase 1: Setup (Database Migration)

**Purpose**: Add battle-related columns to existing tables

- [x] T001 Create database migration file sql/004_battle_system.sql with new columns for player_pokemon (experience, pending_levelup, move_pp, selected_moves) and users (currency)
- [x] T002 Apply migration to Supabase database and verify columns exist (MANUAL: Run sql/004_battle_system.sql in Supabase SQL Editor)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utilities that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 [P] Create type effectiveness utility lib/typeEffectiveness.js with 18-type chart (normal, fire, water, electric, grass, ice, fighting, poison, ground, flying, psychic, bug, rock, ghost, dragon, dark, steel, fairy) and getEffectiveness(attackType, defenderTypes) function
- [x] T004 [P] Extend lib/pokemonData.js with getMoveById(moveId) function to load move data from Source/moves/moves.json
- [x] T005 [P] Extend lib/pokemonData.js with getMovesForPokemonAtLevel(pokemonId, level) function to return available moves based on pokemon.moves.start, level2, level6, etc.
- [x] T006 [P] Create lib/diceParser.js with parseDamageDice(description, higherLevels, level) function to extract dice from move descriptions (e.g., "1d6" from "doing 1d6 + MOVE normal damage")
- [x] T007 [P] Create lib/combatUtils.js with getProficiencyBonus(level) function returning +2 to +6 based on level ranges
- [x] T008 [P] Create lib/combatUtils.js with getAttributeModifier(attributeValue) function returning (attr - 10) / 2 floored
- [x] T009 Create lib/diceRoller.js with rollDice(diceExpression) function (e.g., "2d6" returns sum of 2 six-sided dice) and rollD20() function

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Execute Wild Pokemon Battle (Priority: P1)

**Goal**: Process a battle turn with damage calculation using Pokemon 5e rules, update Pokemon state, return battle log

**Independent Test**: POST /api/battle with valid Pokemon ID and move, receive battle log with turn-by-turn actions and damage calculations

### Implementation for User Story 1

- [x] T010 [P] [US1] Create lib/battleEngine.js with calculateAttackRoll(attacker, move) function using d20 + move power mod + proficiency
- [x] T011 [P] [US1] Add calculateDamage(attacker, defender, move, attackRoll) function to lib/battleEngine.js with dice roll + power mod + STAB + type effectiveness
- [x] T012 [US1] Add processPlayerTurn(playerPokemon, opponentPokemon, moveId) function to lib/battleEngine.js that executes attack and returns action object
- [x] T013 [US1] Add processOpponentTurn(opponentPokemon, playerPokemon) function to lib/battleEngine.js that selects random move and attacks
- [x] T014 [US1] Add processBattleTurn(playerPokemon, opponent, moveId) function to lib/battleEngine.js that orchestrates player and opponent turns
- [x] T015 [US1] Create pages/api/battle.js with POST handler skeleton using authenticateRequest pattern from lib/authHelper.js
- [x] T016 [US1] Add request validation to pages/api/battle.js: check player_pokemon_id exists and move_id provided
- [x] T017 [US1] Add Pokemon ownership validation to pages/api/battle.js: query player_pokemon table, verify user_id matches
- [x] T018 [US1] Add fainted check to pages/api/battle.js: return 422 if current_hp <= 0
- [x] T019 [US1] Add move validation to pages/api/battle.js: verify move_id is in Pokemon's available moves for level
- [x] T020 [US1] Integrate battle processing in pages/api/battle.js: call processBattleTurn, update current_hp in database
- [x] T021 [US1] Add battle log response formatting to pages/api/battle.js per contracts/battle-api.yaml schema
- [x] T022 [US1] Add error response formatting to pages/api/battle.js following lib/apiResponse.js patterns

**Checkpoint**: User Story 1 complete - can execute battles with damage calculation and HP updates

---

## Phase 4: User Story 2 - Battle Victory and Rewards (Priority: P2)

**Goal**: Award experience and currency when player defeats wild Pokemon, detect level-up threshold

**Independent Test**: Win a battle, verify XP = 200 x opponent_level x opponent_SR, currency = opponent_level x 100

### Implementation for User Story 2

- [x] T023 [P] [US2] Create lib/experienceUtils.js with calculateXpAward(opponentLevel, opponentSR) function using formula 200 * level * SR
- [x] T024 [P] [US2] Add XP_THRESHOLDS constant to lib/experienceUtils.js with level 1-20 thresholds from data-model.md
- [x] T025 [US2] Add checkLevelUp(currentXp, newXp, currentLevel) function to lib/experienceUtils.js returning whether level-up threshold crossed
- [x] T026 [P] [US2] Add calculateCurrencyAward(opponentLevel) function to lib/experienceUtils.js returning level * 100
- [x] T027 [US2] Update pages/api/battle.js to detect victory (opponent.current_hp <= 0)
- [x] T028 [US2] Add XP awarding to pages/api/battle.js: update player_pokemon.experience in database on victory
- [x] T029 [US2] Add level-up detection to pages/api/battle.js: set pending_levelup = true if threshold crossed
- [x] T030 [US2] Add currency awarding to pages/api/battle.js: update users.currency in database on victory
- [x] T031 [US2] Add rewards object to battle response in pages/api/battle.js with experience_gained, currency_gained, level_up_pending

**Checkpoint**: User Story 2 complete - victories award XP and currency

---

## Phase 5: User Story 3 - Battle Defeat Handling (Priority: P2)

**Goal**: Handle player Pokemon fainting during battle, mark as fainted, return defeat outcome

**Independent Test**: Battle with low-HP Pokemon against strong opponent, verify Pokemon marked fainted when HP reaches 0

### Implementation for User Story 3

- [x] T032 [US3] Update processBattleTurn in lib/battleEngine.js to check player Pokemon HP after opponent attack
- [x] T033 [US3] Add defeat detection to pages/api/battle.js: check if player_pokemon.current_hp <= 0 after turn
- [x] T034 [US3] Update pages/api/battle.js to set current_hp = 0 in database on defeat (ensure not negative)
- [x] T035 [US3] Update battle response in pages/api/battle.js to set outcome = "defeat" when player Pokemon faints
- [x] T036 [US3] Ensure no rewards are given on defeat in pages/api/battle.js

**Checkpoint**: User Story 3 complete - defeats handled correctly

---

## Phase 6: User Story 4 - PP Management (Priority: P3)

**Goal**: Track Power Points consumption, prevent moves with 0 PP, implement Struggle fallback

**Independent Test**: Use a move until PP reaches 0, verify move rejected, verify Struggle used when all moves at 0 PP

### Implementation for User Story 4

- [x] T037 [P] [US4] Add initializeMovePP(selectedMoves) function to lib/pokemonData.js that creates PP object from Source move data
- [x] T038 [US4] Add PP validation to pages/api/battle.js: check move_pp[move_id] > 0, return error with pp_remaining if 0
- [x] T039 [US4] Add PP deduction to pages/api/battle.js: decrease move_pp[move_id] by 1 after successful use
- [x] T040 [US4] Update database in pages/api/battle.js to persist move_pp JSONB after each battle
- [x] T041 [US4] Add Struggle fallback to pages/api/battle.js: if all moves have 0 PP, force use of "struggle" move
- [x] T042 [US4] Add Struggle self-damage to lib/battleEngine.js: player takes recoil damage when using Struggle
- [x] T043 [US4] Add available_moves to error response in pages/api/battle.js when move validation fails

**Checkpoint**: User Story 4 complete - PP tracked and validated

---

## Phase 7: User Story 5 - Opponent Generation (Priority: P3)

**Goal**: Generate wild Pokemon opponents from Source data with appropriate level and stats

**Independent Test**: Call battle without opponent_pokemon_id, verify random opponent generated with valid stats/moves

### Implementation for User Story 5

- [x] T044 [P] [US5] Create lib/opponentGenerator.js with generateWildPokemon(playerLevel) function
- [x] T045 [US5] Add Pokemon selection to lib/opponentGenerator.js: filter by SR <= 5, select random from Source/pokemon/pokemon.json
- [x] T046 [US5] Add level calculation to lib/opponentGenerator.js: playerLevel +/- 2, clamped to 1-20
- [x] T047 [US5] Add HP calculation to lib/opponentGenerator.js: base_hp + (level * hitDie average) + (CON mod * level)
- [x] T048 [US5] Add move selection to lib/opponentGenerator.js: get available moves for generated level
- [x] T049 [US5] Add stat calculation to lib/opponentGenerator.js: load attributes from Source, calculate modifiers
- [x] T050 [US5] Integrate opponent generation in pages/api/battle.js: if no opponent_pokemon_id provided, generate one
- [x] T051 [US5] Add optional opponent_pokemon_id and opponent_level request parameters to pages/api/battle.js for specific encounters

**Checkpoint**: User Story 5 complete - dynamic opponent generation working

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T052 [P] Update existing starter selection to initialize selected_moves and move_pp when Pokemon is added to player
- [x] T053 [P] Add input sanitization to pages/api/battle.js for all request parameters
- [x] T054 Validate battle response matches contracts/battle-api.yaml schema
- [x] T055 Run manual API tests following quickstart.md validation steps
- [x] T056 Update quickstart.md with actual working curl examples after implementation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 must complete before US2, US3 (they modify battle.js created in US1)
  - US2 and US3 can be done in parallel after US1
  - US4 and US5 can be done in parallel after US1
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Creates core battle.js
- **User Story 2 (P2)**: Depends on US1 - Adds victory rewards to existing battle.js
- **User Story 3 (P2)**: Depends on US1 - Adds defeat handling to existing battle.js
- **User Story 4 (P3)**: Depends on US1 - Adds PP validation to existing battle.js
- **User Story 5 (P3)**: Can start after Foundational - Creates separate opponentGenerator.js, integrates with battle.js last

### Within Each User Story

- Library functions before API integration
- Core logic before database updates
- Database updates before response formatting

### Parallel Opportunities

**Phase 2 (all can run in parallel)**:
- T003: typeEffectiveness.js
- T004-T005: pokemonData.js extensions
- T006: diceParser.js
- T007-T008: combatUtils.js

**Phase 3 (US1 - partial parallel)**:
- T010-T011: Attack roll and damage calculation functions

**Phase 4 (US2 - partial parallel)**:
- T023-T024: XP calculation and thresholds
- T026: Currency calculation

**Phase 7 (US5 - partial parallel)**:
- T044: opponentGenerator.js can be built independently

---

## Parallel Example: Phase 2 Foundational

```bash
# Launch all foundational utilities together:
Task: "Create type effectiveness utility lib/typeEffectiveness.js"
Task: "Extend lib/pokemonData.js with getMoveById function"
Task: "Extend lib/pokemonData.js with getMovesForPokemonAtLevel function"
Task: "Create lib/diceParser.js"
Task: "Create lib/combatUtils.js with getProficiencyBonus"
Task: "Create lib/combatUtils.js with getAttributeModifier"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (database migration)
2. Complete Phase 2: Foundational (all utilities)
3. Complete Phase 3: User Story 1 (core battle)
4. **STOP and VALIDATE**: Test battle endpoint independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational -> Foundation ready
2. Add User Story 1 -> Test independently -> Deploy (MVP - can battle!)
3. Add User Story 2 -> Test independently -> Deploy (now awards XP/currency)
4. Add User Story 3 -> Test independently -> Deploy (handles defeats)
5. Add User Story 4 -> Test independently -> Deploy (PP management)
6. Add User Story 5 -> Test independently -> Deploy (dynamic opponents)
7. Each story adds value without breaking previous stories

### File Creation Order

1. sql/004_battle_system.sql
2. lib/typeEffectiveness.js
3. lib/diceParser.js
4. lib/combatUtils.js
5. lib/pokemonData.js (extend)
6. lib/diceRoller.js
7. lib/battleEngine.js
8. pages/api/battle.js
9. lib/experienceUtils.js
10. lib/opponentGenerator.js

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All database updates use Supabase admin client with RLS bypass for updating user state
