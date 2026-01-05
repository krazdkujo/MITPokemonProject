# Tasks: Combat System Enhancements

**Input**: Design documents from `/specs/018-combat-enhancements/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/battle-api.yaml

**Tests**: Manual testing via dev server as specified in plan.md. No automated test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md, this is a Next.js monorepo:
- **Pages/API**: `pages/`, `pages/api/`
- **Components**: `components/Combat/`
- **Libraries**: `lib/`
- **Source Data**: `Source/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create new utility modules and component shells needed by multiple user stories

- [x] T001 [P] Create lib/moveRanges.js with parseRange() function per data-model.md
- [x] T002 [P] Create lib/combatAI.js shell with AI_WEIGHTS constants per data-model.md
- [x] T003 [P] Create components/Combat/PokemonTooltip.js shell component
- [x] T004 [P] Create components/Combat/GridHighlight.js shell component

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Fix core data structure issues that MUST be complete before user story work

**CRITICAL**: The PP bug fix (T005) blocks US1, US2, US3, US4, US5, and US6 because all depend on consistent known_moves data

- [x] T005 Fix buildOpponentCombatant in lib/battleEngine.js to return full move objects in known_moves (not IDs) - see research.md section 1
- [x] T006 Update pages/api/battle/start.js to ensure opponent combatants use fixed buildOpponentCombatant
- [x] T007 Add movement_remaining and has_moved_this_turn fields to combatant initialization in lib/battleEngine.js per data-model.md
- [x] T008 Add state_hash computation to lib/battleState.js using MD5 per data-model.md

**Checkpoint**: Foundation ready - all combatants now have consistent data structures

---

## Phase 3: User Story 1 - View Pokemon Stats on Hover (Priority: P1)

**Goal**: Display detailed stat tooltip when hovering over any Pokemon on the battle grid

**Independent Test**: Hover over any Pokemon during combat and verify all stats display within 0.5 seconds

### Implementation for User Story 1

- [x] T009 [US1] Implement PokemonTooltip component in components/Combat/PokemonTooltip.js with stat display layout per research.md section 5
- [x] T010 [US1] Add tooltip positioning logic in PokemonTooltip.js (left/right based on grid position)
- [x] T011 [US1] Add CSS styles for PokemonTooltip (border, background, shadow, z-index)
- [x] T012 [US1] Add hover event handlers to grid cells in pages/combat.js for Pokemon tokens
- [x] T013 [US1] Pass combatant data to PokemonTooltip including attributes, moves with PP, status effects
- [x] T014 [US1] Add getAttributeModifier display helper for "+X" format in components/Combat/PokemonTooltip.js
- [x] T015 [US1] Add status effect display with duration/condition in PokemonTooltip.js

**Checkpoint**: Hovering over any Pokemon shows complete stat panel

---

## Phase 4: User Story 2 - Fix PP Display Bug in Move Selection (Priority: P1)

**Goal**: Move selector correctly displays current/max PP for all moves

**Independent Test**: Use moves during combat and verify PP decrements display correctly in selector

**Note**: Root cause (buildOpponentCombatant) already fixed in T005. This phase ensures full propagation.

### Implementation for User Story 2

- [x] T016 [US2] Update MoveSelector in components/Combat/MoveSelector.js to display PP as "current/max PP" format
- [x] T017 [US2] Add range indicator to MoveSelector.js showing move range (e.g., "Range: 1" or "Range: 6")
- [x] T018 [US2] Verify movePp prop is correctly passed from combat.js to MoveSelector for all combatants
- [x] T019 [US2] Add visual disabled state styling for moves with 0 PP in MoveSelector.js
- [x] T020 [US2] Add PP warning indicator (highlight when PP <= 2) in MoveSelector.js

**Checkpoint**: Move selector shows accurate PP values for player and opponent Pokemon

---

## Phase 5: User Story 3 - Validate Combat State Database Persistence (Priority: P1)

**Goal**: Battle state reliably saves and loads from database, survives page refresh

**Independent Test**: Start battle, perform actions, refresh page, verify state matches exactly

### Implementation for User Story 3

- [x] T021 [US3] Add state_hash to battle_state in pages/api/battle/action.js before database save
- [x] T022 [US3] Add last_saved_at timestamp to battle_state in pages/api/battle/action.js
- [x] T023 [US3] Add retry logic (3 attempts, exponential backoff) for database save in pages/api/battle/action.js
- [x] T024 [US3] Add state_hash verification on load in pages/api/battle/state/[battleId].js
- [x] T025 [US3] Log state changes (before/after hash) for debugging in action.js
- [x] T026 [US3] Add error notification to client when save fails after retries in pages/combat.js
- [x] T027 [US3] Verify complete state restoration includes: positions, HP, PP, status effects, turn order, round number

**Checkpoint**: Battle state survives page refresh with 100% data integrity

---

## Phase 6: User Story 4 - Move Ranges on Grid (Priority: P2)

**Goal**: Highlight valid target cells based on move range when selecting a move

**Independent Test**: Select a move and verify only cells within range are highlighted

### Implementation for User Story 4

- [x] T028 [US4] Implement getCellsInRange(position, range, gridSize) in lib/gridUtils.js using Manhattan distance
- [x] T029 [US4] Add parseRange() calls to lib/pokemonData.js to compute range_cells for moves
- [x] T030 [US4] Implement GridHighlight component in components/Combat/GridHighlight.js for target highlighting
- [x] T031 [US4] Add targeting mode state to pages/combat.js (selected_move, valid_targets)
- [x] T032 [US4] Calculate valid target cells when move is selected in combat.js using getCellsInRange
- [x] T033 [US4] Pass valid target cells to GridHighlight and render overlay on grid
- [x] T034 [US4] Add range validation to pages/api/battle/action.js - reject attacks on out-of-range targets
- [x] T035 [US4] Add "Out of Range" error message display in combat.js when attack rejected
- [x] T036 [US4] Implement pages/api/battle/valid-targets.js endpoint per contracts/battle-api.yaml

**Checkpoint**: Selecting a move highlights valid targets; out-of-range attacks are rejected

---

## Phase 7: User Story 5 - Pokemon Movement Ranges (Priority: P2)

**Goal**: Display movement range on grid; track and enforce movement limits per turn

**Independent Test**: Select move action, verify movement range displayed, move Pokemon, verify tracking

### Implementation for User Story 5

- [x] T037 [US5] Add "Move" action button to action panel in pages/combat.js
- [x] T038 [US5] Add movement mode state to pages/combat.js (is_moving, valid_destinations)
- [x] T039 [US5] Calculate valid movement destinations using getCellsInRange with movement_remaining
- [x] T040 [US5] Filter out occupied cells from valid destinations in combat.js
- [x] T041 [US5] Add movement highlighting to GridHighlight component (different color from targeting)
- [x] T042 [US5] Handle movement cell click in combat.js - call action API with move action
- [x] T043 [US5] Update movement_remaining after move in pages/api/battle/action.js
- [x] T044 [US5] Add movement validation to action.js - reject if distance > movement_remaining
- [x] T045 [US5] Reset movement_remaining to 6 at turn start in action.js turn processing
- [x] T046 [US5] Disable Move button when has_moved_this_turn is true in combat.js
- [x] T047 [US5] Implement pages/api/battle/valid-movement.js endpoint per contracts/battle-api.yaml

**Checkpoint**: Movement range displays correctly; movement is tracked and limited per turn

---

## Phase 8: User Story 6 - AI Move Selection and Positioning (Priority: P3)

**Goal**: AI makes tactical decisions for move selection and positioning

**Independent Test**: Observe AI behavior over multiple turns; verify type advantage preference and movement toward targets

**Dependencies**: Depends on US4 (move ranges) and US5 (movement) being complete

### Implementation for User Story 6

- [x] T048 [US6] Implement calculateTypeEffectiveness(moveType, targetTypes) in lib/combatAI.js
- [x] T049 [US6] Implement scoreMoveOption(move, actor, target, battleState) in lib/combatAI.js per research.md section 4
- [x] T050 [US6] Implement findBestTarget(actor, targets, battleState) in lib/combatAI.js
- [x] T051 [US6] Implement calculateOptimalMovement(actor, targets, grid) in lib/combatAI.js
- [x] T052 [US6] Implement executeAITurn(combatant, battleState) main function in lib/combatAI.js
- [x] T053 [US6] Add AI decision logging (reasoning array) to lib/combatAI.js for debugging
- [x] T054 [US6] Implement pages/api/battle/ai-turn.js endpoint per contracts/battle-api.yaml
- [x] T055 [US6] Update opponent turn execution in pages/combat.js to call ai-turn endpoint instead of random selection
- [x] T056 [US6] Add AI turn timeout (2 second max) in ai-turn.js
- [x] T057 [US6] Handle AI cannot reach any target (move toward closest, then pass)

**Checkpoint**: AI demonstrates tactical behavior - prefers type advantages, moves to reach targets

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and validation

- [x] T058 [P] Add keyboard navigation support for move/target selection in pages/combat.js
- [x] T059 [P] Add ARIA labels for accessibility to PokemonTooltip and GridHighlight
- [x] T060 Verify all edge cases from spec.md: 0 PP on all moves, grid boundaries, surrounded Pokemon
- [x] T061 Run quickstart.md validation scenarios for all 6 user stories
- [x] T062 Performance check: tooltip appears within 500ms, AI turn under 3 seconds

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on T001-T004 completion - BLOCKS all user stories
- **US1-US3 (Phase 3-5)**: Depend on Foundational (Phase 2) - can run in parallel
- **US4 (Phase 6)**: Depends on Foundational - can run parallel with US1-US3
- **US5 (Phase 7)**: Depends on Foundational - can run parallel with US1-US4
- **US6 (Phase 8)**: Depends on US4 and US5 (needs range/movement infrastructure)
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

| Story | Priority | Depends On | Can Parallel With |
|-------|----------|------------|-------------------|
| US1 (Tooltip) | P1 | Foundational | US2, US3, US4, US5 |
| US2 (PP Fix) | P1 | Foundational | US1, US3, US4, US5 |
| US3 (Persistence) | P1 | Foundational | US1, US2, US4, US5 |
| US4 (Move Range) | P2 | Foundational | US1, US2, US3, US5 |
| US5 (Movement) | P2 | Foundational | US1, US2, US3, US4 |
| US6 (AI) | P3 | US4 + US5 | None |

### Within Each User Story

- Models/utilities before services
- Services before endpoints
- Endpoints before UI integration
- Core implementation before edge cases

### Parallel Opportunities

- T001-T004 (Setup phase) can all run in parallel
- T021-T027 (US3) are independent of T009-T015 (US1) and T016-T020 (US2)
- T028-T036 (US4) can run parallel with T037-T047 (US5)
- All [P] marked tasks within a phase can run in parallel

---

## Parallel Example: User Story 1

```bash
# Setup phase (all parallel):
Task: "Create lib/moveRanges.js with parseRange() function"
Task: "Create lib/combatAI.js shell with AI_WEIGHTS constants"
Task: "Create components/Combat/PokemonTooltip.js shell component"
Task: "Create components/Combat/GridHighlight.js shell component"
```

---

## Implementation Strategy

### MVP First (P1 Stories Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - fixes PP bug)
3. Complete Phase 3: US1 (Pokemon Stats on Hover)
4. Complete Phase 4: US2 (PP Display Fix)
5. Complete Phase 5: US3 (Database Persistence)
6. **STOP and VALIDATE**: All P1 stories functional
7. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational -> Foundation ready
2. Add US1 -> Hovering shows stats (Demo!)
3. Add US2 -> PP displays correctly (Demo!)
4. Add US3 -> State persists (Demo!)
5. Add US4 -> Move ranges visible (Demo!)
6. Add US5 -> Movement tracking (Demo!)
7. Add US6 -> AI tactical behavior (Full feature!)

### Suggested MVP Scope

**Minimum Viable Product**: US1 + US2 + US3 (all P1 stories)
- Players can see Pokemon stats on hover
- PP displays correctly in move selector
- Battle state persists across page refresh

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- T005 is the critical fix for the PP bug - must be done before most other work
