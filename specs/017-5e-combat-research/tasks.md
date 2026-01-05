# Tasks: Pokemon 5e Combat System Alignment

**Input**: Design documents from `/specs/017-5e-combat-research/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/battle-api.yaml

**Note**: This feature delivers both documentation (gap analysis, recommendations) AND code implementation of the full combat system per clarifications.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story/implementation phase this task belongs to
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema updates and new module scaffolding

- [X] T001 Create database migration for active_battles weather/terrain columns in sql/017_combat_weather_terrain.sql
- [X] T002 Create database migration for player_pokemon bond_level and move_pp columns in sql/018_pokemon_bond_pp.sql
- [X] T003 [P] Create lib/weatherSystem.js with empty WEATHER_EFFECTS constant and stub functions
- [X] T004 [P] Create lib/terrainSystem.js with empty TERRAIN_EFFECTS constant and stub functions
- [X] T005 [P] Create lib/bondSystem.js with BOND_EFFECTS constant and stub functions
- [X] T006 [P] Create lib/catchingMechanics.js with stub calculateCatchDC function
- [X] T007 [P] Create lib/abilityEffects.js with empty ABILITY_HANDLERS registry
- [X] T008 [P] Create lib/transformations.js with transformation type stubs
- [X] T009 [P] Create lib/concentrationTracker.js with requiresConcentration and checkConcentration stubs
- [X] T010 [P] Create pages/api/battle/switch.js with basic route structure
- [X] T011 [P] Create pages/api/pokemon/rest.js with basic route structure

**Checkpoint**: All new files exist with stub implementations

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Grid conversion utilities and core battle state updates that all stories depend on

- [X] T012 Add feetToCells() and cellsToFeet() functions to lib/gridUtils.js using 1 cell = 5 feet conversion
- [X] T013 Update lib/battleState.js to include weather, terrain, format fields per data-model.md
- [X] T014 Update lib/battleState.js combatant structure to include bond_level, concentrating_on, transformation fields
- [X] T015 Add status_metadata tracking to combatant in lib/battleState.js for applier_proficiency and rounds_remaining
- [X] T016 Update lib/pokemonData.js to include getAbilityById() function for ability data merging
- [X] T017 Add getMoveById() function to lib/pokemonData.js if not exists for move data merging

**Checkpoint**: Foundation ready - all combat system implementations can proceed

---

## Phase 3: Status Effect Fixes (Priority: P1 - Core Combat)

**Goal**: Fix status effect implementations to match 5e rules exactly (FR-014 to FR-017, FR-037)

**Independent Test**: Run battle with each status effect and verify behavior matches 5e rules

### Implementation for Status Effects

- [X] T018 [P] [US1] Implement Burned damage penalty in lib/statusEffects.js - roll damage twice, take lower
- [X] T019 [P] [US1] Implement Flinched full effects in lib/statusEffects.js - disadvantage on all d20, targets advantage on saves
- [X] T020 [P] [US1] Implement Frozen break DC in lib/statusEffects.js - STR save DC 10 + applier proficiency
- [X] T021 [P] [US1] Implement Confused d8 behavior in lib/statusEffects.js - 1-4 normal, 5 nothing, 6 self-Struggle, 7 nearest Struggle, 8 ends
- [X] T022 [US1] Remove Struggle recoil damage from lib/battleEngine.js - delete/comment applyStruggleRecoil function
- [X] T023 [US1] Update lib/battleEngine.js processBattleTurn() to apply Burned damage penalty before attack resolution
- [X] T024 [US1] Update lib/battleEngine.js to check Flinched disadvantage on all d20 rolls

**Checkpoint**: All 8 status effects work per 5e rules

---

## Phase 4: Saving Throw Moves (Priority: P1 - Move System)

**Goal**: Implement saving throw move support (FR-018)

**Independent Test**: Use a saving throw move (e.g., Acid) and verify DC calculation and save mechanics

### Implementation for Save Moves

- [X] T025 [US2] Create parseSaveType() function in lib/combatUtils.js to extract save type from move description
- [X] T026 [US2] Create calculateSaveDC() function in lib/combatUtils.js - DC = 8 + power mod + prof
- [X] T027 [US2] Update lib/battleEngine.js to detect save moves and route to save logic instead of attack roll
- [X] T028 [US2] Implement processSaveMove() in lib/battleEngine.js with full/half damage based on save result
- [X] T029 [US2] Update pages/api/battle/action.js to handle save move results in response

**Checkpoint**: Saving throw moves work with correct DC and damage

---

## Phase 5: Concentration System (Priority: P1 - Move System)

**Goal**: Implement move concentration mechanics (FR-020)

**Independent Test**: Use a concentration move, take damage, verify concentration check

### Implementation for Concentration

- [X] T030 [US3] Implement requiresConcentration(move) in lib/concentrationTracker.js - check duration field
- [X] T031 [US3] Implement checkConcentration(pokemon, damage) in lib/concentrationTracker.js - CON save DC max(10, damage/2)
- [X] T032 [US3] Update combatant state to track concentrating_on move ID in lib/battleState.js
- [X] T033 [US3] Update lib/battleEngine.js to break concentration when new concentration starts
- [X] T034 [US3] Update lib/battleEngine.js to check concentration on damage taken

**Checkpoint**: Concentration moves tracked and can be broken by damage

---

## Phase 6: Battle Flow - Switching (Priority: P2)

**Goal**: Implement Pokemon switching mechanics (FR-021, FR-022)

**Independent Test**: Switch Pokemon mid-battle, verify action economy and AoO

### Implementation for Switching

- [X] T035 [US4] Implement recall() function in lib/battleEngine.js - uses action, does not provoke AoO
- [X] T036 [US4] Implement sendOut() function in lib/battleEngine.js - uses bonus action, sets can_act to false
- [X] T037 [US4] Implement checkAoOTrigger() in lib/battleEngine.js - leaving melee range without Disengage
- [X] T038 [US4] Implement executeAoO() in lib/battleEngine.js - reaction, costs PP, melee move
- [X] T039 [US4] Update pages/api/battle/switch.js with full switching logic per contracts/battle-api.yaml
- [X] T040 [US4] Add provoked_aoo and aoo_result to switch response in pages/api/battle/switch.js

**Checkpoint**: Pokemon can be switched with correct action economy and AoO

---

## Phase 7: PP Restoration (Priority: P2)

**Goal**: Implement PP restoration on rest (FR-023)

**Independent Test**: Use short rest (no PP restore), use long rest (full PP restore)

### Implementation for PP Restoration

- [X] T041 [US5] Implement shortRest() in lib/battleEngine.js - HP via hit dice only, no PP
- [X] T042 [US5] Implement longRest() in lib/battleEngine.js - full HP, PP, clear statuses, restore bond points
- [X] T043 [US5] Update pages/api/pokemon/rest.js with rest logic per contracts/battle-api.yaml
- [X] T044 [US5] Add move_pp JSONB updates to rest logic in pages/api/pokemon/rest.js

**Checkpoint**: Rest mechanics restore resources correctly

---

## Phase 8: Weather System (Priority: P2)

**Goal**: Implement weather effects (FR-024)

**Independent Test**: Set weather to Rain, use Water move (advantage), use Fire move (disadvantage)

### Implementation for Weather

- [X] T045 [P] [US6] Implement WEATHER_EFFECTS constant in lib/weatherSystem.js with all 6 weather types
- [X] T046 [US6] Implement getWeatherDamageModifier(weatherType, moveType) in lib/weatherSystem.js
- [X] T047 [US6] Implement getWeatherACBonus(weatherType, pokemonTypes) in lib/weatherSystem.js for Rock/Ice
- [X] T048 [US6] Implement getWeatherVisibility(weatherType) in lib/weatherSystem.js for Sandstorm/Fog
- [X] T049 [US6] Update lib/battleEngine.js calculateDamage() to apply weather advantage/disadvantage
- [X] T050 [US6] Update lib/battleState.js to track weather state with turns_remaining
- [X] T051 [US6] Update pages/api/battle/action.js to include weather effects in response

**Checkpoint**: All 6 weather types affect combat correctly

---

## Phase 9: Terrain System (Priority: P2)

**Goal**: Implement terrain effects (FR-025)

**Independent Test**: Set Electric Terrain, use Electric move (double MOVE mod), verify sleep immunity

### Implementation for Terrain

- [X] T052 [P] [US7] Implement TERRAIN_EFFECTS constant in lib/terrainSystem.js with all 4 terrain types
- [X] T053 [US7] Implement getTerrainDamageBonus(terrainType, moveType) in lib/terrainSystem.js - double MOVE mod
- [X] T054 [US7] Implement getTerrainStatusImmunity(terrainType) in lib/terrainSystem.js
- [X] T055 [US7] Implement getTerrainHealing(terrainType, proficiency) in lib/terrainSystem.js for Grassy
- [X] T056 [US7] Implement isGrounded(combatant) in lib/terrainSystem.js - Flying/Levitate check
- [X] T057 [US7] Update lib/battleEngine.js to apply terrain damage bonuses
- [X] T058 [US7] Update lib/battleEngine.js end-of-turn to apply Grassy Terrain healing
- [X] T059 [US7] Update lib/statusEffects.js to check terrain immunity before applying status

**Checkpoint**: All 4 terrain types affect grounded Pokemon correctly

---

## Phase 10: Bond System (Priority: P3)

**Goal**: Implement Bond levels and Bond Points (FR-026)

**Independent Test**: Set bond to -2, issue command, verify obedience check; set bond to +2, spend BP for advantage

### Implementation for Bond

- [X] T060 [P] [US8] Implement BOND_EFFECTS constant in lib/bondSystem.js with levels -3 to +3
- [X] T061 [US8] Implement checkObedience(bondLevel) in lib/bondSystem.js - d20 check for negative bonds
- [X] T062 [US8] Implement spendBondPoint(combatant, effect) in lib/bondSystem.js - advantage or impose disadvantage
- [X] T063 [US8] Implement restoreBondPoints(combatant) in lib/bondSystem.js - called on long rest
- [X] T064 [US8] Update lib/battleEngine.js command processing to check obedience for negative bond
- [X] T065 [US8] Update pages/api/battle/action.js to accept use_bond_point parameter
- [X] T066 [US8] Update lib/battleEngine.js to apply bond point advantage when requested

**Checkpoint**: Bond levels affect Pokemon behavior, Bond Points provide rerolls

---

## Phase 11: Catching Mechanics (Priority: P3)

**Goal**: Implement catching with DC formula and Pokeball modifiers (FR-027)

**Independent Test**: Attempt catch with different Pokeballs, verify DC modifiers and advantage from status

### Implementation for Catching

- [X] T067 [P] [US9] Create POKEBALL_MODIFIERS constant in lib/catchingMechanics.js from Source/items/items.json
- [X] T068 [US9] Implement calculateBaseDC(sr, level) in lib/catchingMechanics.js - DC = 10 + SR + level
- [X] T069 [US9] Implement getHPModifier(currentHP, maxHP) in lib/catchingMechanics.js - yellow (-5), red (-10)
- [X] T070 [US9] Implement getPokeballModifier(pokeballId, context) in lib/catchingMechanics.js - all 23 types
- [X] T071 [US9] Implement hasAdvantageForCatch(combatant) in lib/catchingMechanics.js - check status conditions
- [X] T072 [US9] Implement attemptCatch() in lib/catchingMechanics.js with full DC calculation and roll
- [X] T073 [US9] Update pages/api/battle/catch.js with catch logic per contracts/battle-api.yaml
- [X] T074 [US9] Add caught Pokemon to player_pokemon table on successful catch

**Checkpoint**: Catching works with all DC modifiers and Pokeball types

---

## Phase 12: Ability Effects - Common Abilities (Priority: P3)

**Goal**: Implement combat-relevant abilities (FR-028) - start with most common

**Independent Test**: Battle with Pokemon having each ability, verify effect triggers

### Implementation for Abilities (Batch 1 - 15 Common Abilities)

- [X] T075 [P] [US10] Implement adaptability ability in lib/abilityEffects.js - roll STAB damage twice, choose
- [X] T076 [P] [US10] Implement battle-armor ability in lib/abilityEffects.js - immune to critical hit extra damage
- [X] T077 [P] [US10] Implement blaze ability in lib/abilityEffects.js - boost Fire damage below 1/3 HP
- [X] T078 [P] [US10] Implement chlorophyll ability in lib/abilityEffects.js - double speed in sun
- [X] T079 [P] [US10] Implement flash-fire ability in lib/abilityEffects.js - Fire immunity, boost Fire moves
- [X] T080 [P] [US10] Implement intimidate ability in lib/abilityEffects.js - lower enemy attack on entry
- [X] T081 [P] [US10] Implement levitate ability in lib/abilityEffects.js - Ground immunity
- [X] T082 [P] [US10] Implement overgrow ability in lib/abilityEffects.js - boost Grass damage below 1/3 HP
- [X] T083 [P] [US10] Implement rain-dish ability in lib/abilityEffects.js - heal in rain
- [X] T084 [P] [US10] Implement rough-skin ability in lib/abilityEffects.js - damage on contact
- [X] T085 [P] [US10] Implement swift-swim ability in lib/abilityEffects.js - double speed in rain
- [X] T086 [P] [US10] Implement synchronize ability in lib/abilityEffects.js - pass status to attacker
- [X] T087 [P] [US10] Implement thick-fat ability in lib/abilityEffects.js - Fire/Ice resistance
- [X] T088 [P] [US10] Implement torrent ability in lib/abilityEffects.js - boost Water damage below 1/3 HP
- [X] T089 [P] [US10] Implement water-absorb ability in lib/abilityEffects.js - Water heals instead of damages

### Ability System Integration

- [X] T090 [US10] Create triggerAbility(combatant, trigger, context) dispatcher in lib/abilityEffects.js
- [X] T091 [US10] Update lib/battleEngine.js to call triggerAbility on relevant triggers (onDamage, onEntry, onStatusInflicted)
- [X] T092 [US10] Update lib/battleEngine.js calculateDamage() to check for ability damage modifiers

**Checkpoint**: 15 common abilities work in combat

---

## Phase 13: Transformations (Priority: P4)

**Goal**: Implement Mega, Z-Move, Dynamax, Terastallization (FR-029)

**Independent Test**: Transform Pokemon, verify stat changes and duration/revert

### Implementation for Transformations

- [X] T093 [P] [US11] Implement checkMegaRequirements(pokemon, trainer) in lib/transformations.js
- [X] T094 [P] [US11] Implement checkZMoveRequirements(pokemon, trainer, moveId) in lib/transformations.js
- [X] T095 [P] [US11] Implement checkDynamaxRequirements(pokemon, trainer, battleState) in lib/transformations.js
- [X] T096 [P] [US11] Implement checkTeraRequirements(pokemon, trainer) in lib/transformations.js
- [X] T097 [US11] Implement applyMegaEvolution(combatant) in lib/transformations.js - apply mega stat block
- [X] T098 [US11] Implement applyZMove(combatant, move) in lib/transformations.js - empower move per rules
- [X] T099 [US11] Implement applyDynamax(combatant) in lib/transformations.js - temp HP, size, immunities
- [X] T100 [US11] Implement applyTerastallization(combatant) in lib/transformations.js - type change, STAB rules
- [X] T101 [US11] Implement checkTransformationRevert(combatant, battleState) in lib/transformations.js
- [X] T102 [US11] Update pages/api/battle/transform.js (create if needed) per contracts/battle-api.yaml
- [X] T103 [US11] Update lib/battleEngine.js end-of-turn to check transformation duration

**Checkpoint**: All 4 transformation types work per 5e rules

---

## Phase 14: API Endpoint Updates

**Goal**: Update existing battle endpoints to support new features

### API Updates

- [X] T104 [US12] Update pages/api/battle/action.js to handle save moves, weather, terrain, abilities
- [X] T105 [US12] Update pages/api/battle/[battleId].js to return weather, terrain, transformation states
- [X] T106 [US12] Add battle log entries for all new action types in lib/battleState.js
- [X] T107 [US12] Update battle response envelope to include full game state per Educational API Design principle

**Checkpoint**: All API endpoints return complete, debuggable responses

---

## Phase 15: Documentation Updates (Priority: P1 originally)

**Goal**: Complete gap analysis documentation that was already done in research.md

**Independent Test**: Review documentation, verify completeness

### Documentation Tasks

- [X] T108 [P] [DOC] Verify research.md gap analysis covers 100% of Source/rules/rules.json combat rules
- [X] T109 [P] [DOC] Verify spec.md recommendations include action (implement/skip) for each gap
- [X] T110 [P] [DOC] Verify priority matrix in spec.md is still accurate after implementation
- [X] T111 [DOC] Update CLAUDE.md with new lib/ modules added by this feature

**Checkpoint**: Documentation complete and accurate

---

## Phase 16: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [X] T112 [P] Add JSDoc comments to all new lib/ functions
- [X] T113 Code review: verify all Source/ data access goes through pokemonData.js
- [X] T114 Code review: verify no hardcoded game mechanics (all from Source/)
- [X] T115 Run quickstart.md testing checklist manually
- [X] T116 Verify battle responses include full state for N8N debugging
- [X] T117 Start dev server with npm run dev for manual testing

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - create scaffolding
- **Phase 2 (Foundational)**: Depends on Phase 1 - grid utils and state updates
- **Phases 3-14 (Features)**: All depend on Phase 2 completion
  - Status Effects (Phase 3) - no dependencies on other features
  - Save Moves (Phase 4) - no dependencies on other features
  - Concentration (Phase 5) - no dependencies on other features
  - Switching (Phase 6) - no dependencies on other features
  - PP Restoration (Phase 7) - no dependencies on other features
  - Weather (Phase 8) - no dependencies on other features
  - Terrain (Phase 9) - depends on Phase 8 (weather patterns similar)
  - Bond (Phase 10) - no dependencies on other features
  - Catching (Phase 11) - no dependencies on other features
  - Abilities (Phase 12) - depends on Phases 8, 9 for weather/terrain abilities
  - Transformations (Phase 13) - depends on Phase 10 (bond for Mega requirements)
  - API Updates (Phase 14) - depends on all feature phases
- **Phase 15 (Documentation)**: Can run in parallel with implementation
- **Phase 16 (Polish)**: Depends on all phases

### Parallel Opportunities

All tasks marked [P] can run in parallel within their phase. Additionally:

- Phases 3-7 can all run in parallel (different lib/ files, no dependencies)
- Phase 8 and 10-11 can run in parallel with Phase 9 once Phase 8 is done
- All ability implementations (T075-T089) can run in parallel
- All transformation requirement checks (T093-T096) can run in parallel

---

## Parallel Example: Phase 3 (Status Effects)

```bash
# These 4 tasks can all run in parallel (different functions in same file):
Task: "T018 [P] [US1] Implement Burned damage penalty in lib/statusEffects.js"
Task: "T019 [P] [US1] Implement Flinched full effects in lib/statusEffects.js"
Task: "T020 [P] [US1] Implement Frozen break DC in lib/statusEffects.js"
Task: "T021 [P] [US1] Implement Confused d8 behavior in lib/statusEffects.js"
```

---

## Implementation Strategy

### MVP First (Status Effects Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: Status Effect Fixes
4. **STOP and VALIDATE**: Test all 8 status effects work per 5e rules
5. This alone fixes 5 bugs (Burned, Flinched, Frozen, Confused, Struggle recoil)

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add Status Effects → Core combat accuracy (MVP!)
3. Add Save Moves + Concentration → Full move system
4. Add Switching + PP Restoration → Battle flow complete
5. Add Weather + Terrain → Environmental effects
6. Add Bond + Catching → Progression systems
7. Add Abilities + Transformations → Advanced features
8. Polish → Production ready

### Recommended Order for Single Developer

1. T001-T017 (Setup + Foundational)
2. T018-T024 (Status Effects - immediate value)
3. T025-T034 (Save Moves + Concentration)
4. T035-T044 (Switching + PP)
5. T045-T059 (Weather + Terrain)
6. T060-T074 (Bond + Catching)
7. T075-T103 (Abilities + Transformations)
8. T104-T117 (API + Polish)

---

## Notes

- All tasks follow checklist format: `- [ ] [ID] [P?] [Story?] Description with file path`
- Source/ files are read-only - all data access through lib/pokemonData.js
- Database stores only user state - no duplication of Source/ data
- API responses must include full game state for educational debugging
- 1 cell = 5 feet for all grid calculations
- Architecture supports 2v2 but implementation is 1v1
