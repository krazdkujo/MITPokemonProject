# Tasks: Movement Test Harness

**Input**: Design documents from `/specs/023-movement-test-harness/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/components-api.md

**Tests**: Not explicitly requested - manual testing via UI per existing 021-combat-test-harness patterns.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a Next.js web application with the following structure:
- Pages: `pages/`
- Components: `components/TestCombat/`
- Libraries: `lib/`

---

## Phase 1: Setup

**Purpose**: Foundational component scaffolding and simulator modifications

- [x] T001 Add position initialization to createSimulation() in `lib/combatSimulator.js` - set default positions for combatant1 (D2: col 3, row 1) and combatant2 (G9: col 6, row 8)
- [x] T002 [P] Add grid state variables to test-combat page in `pages/test-combat.js` - gridMode, highlightedCells, selectedPokemon state
- [x] T003 [P] Create GridCell component scaffold in `components/TestCombat/GridCell.js` with props interface per contracts/components-api.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core grid component that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until BattleGrid component is functional

- [x] T004 Create BattleGrid component in `components/TestCombat/BattleGrid.js` implementing props interface from contracts/components-api.md
- [x] T005 Implement GridCell visual states (empty, highlighted, occupied) in `components/TestCombat/GridCell.js` with colors from contracts/components-api.md
- [x] T006 Add coordinate labels (A-J columns, 1-10 rows) to BattleGrid in `components/TestCombat/BattleGrid.js`
- [x] T007 Integrate BattleGrid into test-combat page layout in `pages/test-combat.js` - add center panel between left (controls) and right (log) panels
- [x] T008 Wire grid cell click/hover events from BattleGrid to test-combat page handlers in `pages/test-combat.js`

**Checkpoint**: Grid displays with coordinates but no Pokemon or highlighting yet

---

## Phase 3: User Story 1 - View Battle Grid with Positions (Priority: P1) 🎯 MVP

**Goal**: Display 10x10 grid with Pokemon positions visible after battle starts

**Independent Test**: Start a battle with two Pokemon, observe both Pokemon appear on grid at their initial deployment positions (D2 and G9)

### Implementation for User Story 1

- [x] T009 [US1] Initialize grid cells from combatant positions when simulation starts in `pages/test-combat.js` - use initializeGrid() from gridUtils.js and place combatants
- [x] T010 [US1] Display Pokemon identifier (name abbreviation or sprite) in occupied GridCell in `components/TestCombat/GridCell.js`
- [x] T011 [US1] Style player Pokemon cells (green) vs opponent Pokemon cells (red) in `components/TestCombat/GridCell.js`
- [x] T012 [US1] Show cell notation (A1-J10) on hover or as tooltip in `components/TestCombat/GridCell.js`
- [x] T013 [US1] Update grid when battle resets or new battle starts in `pages/test-combat.js`

**Checkpoint**: User Story 1 complete - grid shows Pokemon positions immediately after battle starts

---

## Phase 4: User Story 2 - Execute Pokemon Movement (Priority: P1)

**Goal**: Allow clicking Pokemon to select, show valid move targets, click destination to move

**Independent Test**: Click Pokemon on grid, see green highlighted cells for valid moves, click destination, observe Pokemon move and position update

### Implementation for User Story 2

- [x] T014 [US2] Add executeMovement() function to `lib/combatSimulator.js` - calculate distance, validate movement, update position, return log entry
- [x] T015 [US2] Implement Pokemon selection on cell click in `pages/test-combat.js` - set selectedPokemon state, calculate valid targets using getValidMoveTargets() from gridUtils.js
- [x] T016 [US2] Highlight valid movement targets (green) when Pokemon selected in `pages/test-combat.js` - update highlightedCells.movement Set
- [x] T017 [US2] Implement movement execution when valid destination clicked in `pages/test-combat.js` - call executeMovement(), update grid, clear selection
- [x] T018 [US2] Prevent movement to occupied cells - show error message or ignore click in `pages/test-combat.js`
- [x] T019 [US2] Update has_moved_this_turn flag after movement in `lib/combatSimulator.js`
- [x] T020 [US2] Block further movement when has_moved_this_turn is true - show "Already moved" indicator in `pages/test-combat.js`
- [x] T021 [US2] Clear movement selection on Escape key or click outside valid targets in `pages/test-combat.js`

**Checkpoint**: User Story 2 complete - Pokemon can be moved via click interactions with movement restrictions enforced

---

## Phase 5: User Story 3 - View Move Range Indicators (Priority: P2)

**Goal**: Show attack range when a move is selected, highlight valid targets

**Independent Test**: Select a Pokemon, choose a move from its move list, observe red highlighted cells showing attack range, valid targets distinctly marked

### Implementation for User Story 3

- [x] T022 [P] [US3] Create RangeIndicator component in `components/TestCombat/RangeIndicator.js` per contracts/components-api.md props interface
- [x] T023 [US3] Add move selection UI to show Pokemon's known moves in `pages/test-combat.js` - display move buttons/dropdown when Pokemon selected
- [x] T024 [US3] Parse move range (feet to cells) when move selected in `pages/test-combat.js` - use feetToCells() from gridUtils.js, default melee to 1 cell
- [x] T025 [US3] Calculate cells in range using getCellsInRange() and highlight in attack Set in `pages/test-combat.js`
- [x] T026 [US3] Highlight valid attack targets (opponent Pokemon in range) distinctly in `components/TestCombat/GridCell.js` - brighter border/color
- [x] T027 [US3] Display range info text "Range: X cells (Y ft)" in RangeIndicator in `components/TestCombat/RangeIndicator.js`
- [x] T028 [US3] Clear range highlighting when move deselected or different Pokemon selected in `pages/test-combat.js`

**Checkpoint**: User Story 3 complete - attack range visualization works for all move types

---

## Phase 6: User Story 4 - View Pokemon Speed Statistics (Priority: P2)

**Goal**: Display walking speed and remaining movement in a dedicated panel

**Independent Test**: View selected Pokemon's stats panel, confirm walking speed matches Source data, confirm remaining movement updates after movement

### Implementation for User Story 4

- [x] T029 [P] [US4] Create MovementPanel component in `components/TestCombat/MovementPanel.js` per contracts/components-api.md props interface
- [x] T030 [US4] Display walking speed in cells and feet (e.g., "6 cells (30 ft)") in `components/TestCombat/MovementPanel.js`
- [x] T031 [US4] Display remaining movement as "X/Y cells" in `components/TestCombat/MovementPanel.js`
- [x] T032 [US4] Show movement status ("Ready to move", "Already moved", "No movement remaining") in `components/TestCombat/MovementPanel.js`
- [x] T033 [US4] Add "Move Pokemon" button to enter movement mode from MovementPanel in `components/TestCombat/MovementPanel.js`
- [x] T034 [US4] Integrate MovementPanel into left panel of test-combat page in `pages/test-combat.js`
- [x] T035 [US4] Update MovementPanel display when movement occurs or new round begins in `pages/test-combat.js`

**Checkpoint**: User Story 4 complete - speed statistics accurately displayed and updated

---

## Phase 7: User Story 5 - Step Through Movement Phase (Priority: P3)

**Goal**: Add movement logging and round-based movement reset

**Independent Test**: Use step mode, observe movement logged with from/to positions, advance round, confirm movement_remaining resets

### Implementation for User Story 5

- [x] T036 [US5] Add 'movement' log entry type formatting to BattleLog in `components/TestCombat/BattleLog.js` - format: "POKEMON moves A1 → B2 (X cells)"
- [x] T037 [US5] Generate movement log entry in executeMovement() in `lib/combatSimulator.js` - include from_notation, to_notation, distance, remaining
- [x] T038 [US5] Add movement entries to logEntries state when movement occurs in `pages/test-combat.js`
- [x] T039 [US5] Add resetMovement() function to `lib/combatSimulator.js` - reset movement_remaining and has_moved_this_turn for all combatants
- [x] T040 [US5] Call resetMovement() at round start in existing turn processing in `lib/combatSimulator.js`
- [x] T041 [US5] Log movement calculations in verbose mode (speed, valid targets count) in `lib/combatSimulator.js`

**Checkpoint**: User Story 5 complete - movement fully logged and resets each round

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, cleanup, and validation

- [x] T042 [P] Handle Pokemon faint during movement mode - clear selection, disable movement for fainted Pokemon in `pages/test-combat.js`
- [x] T043 [P] Handle 0 movement remaining (paralyzed/restrained status) - show disabled state in MovementPanel in `components/TestCombat/MovementPanel.js`
- [x] T044 [P] Add keyboard navigation support - arrow keys to select cells, Enter to confirm in `components/TestCombat/BattleGrid.js`
- [x] T045 Run quickstart.md manual test validation - verify all documented features work as specified
- [x] T046 Code cleanup - ensure consistent styling, remove console.logs, add JSDoc comments to new components

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001-T003) - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 and US2 are both P1 but US1 provides visual foundation for US2
  - US3 and US4 are P2, can run in parallel after US2
  - US5 is P3, depends on movement being implemented (US2)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - Provides grid visualization
- **User Story 2 (P1)**: Depends on US1 for grid display - Core movement functionality
- **User Story 3 (P2)**: Can start after US2 - Uses same grid highlighting patterns
- **User Story 4 (P2)**: Can start after US2 - Displays movement state
- **User Story 5 (P3)**: Depends on US2 - Adds logging for movement actions

### Within Each User Story

- Components before page integration
- State management before UI rendering
- Core functionality before edge cases

### Parallel Opportunities

- T002 and T003 can run in parallel (different files)
- T022 and T029 can run in parallel (different new components)
- T042, T043, T044 can all run in parallel (different concerns)

---

## Parallel Example: Foundational Phase

```bash
# After T001 completes, these can run in parallel:
Task: "T002 Add grid state variables to pages/test-combat.js"
Task: "T003 Create GridCell component scaffold in components/TestCombat/GridCell.js"
```

## Parallel Example: User Story 3 & 4

```bash
# After US2 is complete, these stories can be worked in parallel:
# Developer A: User Story 3 (Range Indicators)
Task: "T022 Create RangeIndicator component"
Task: "T023 Add move selection UI"

# Developer B: User Story 4 (Speed Statistics)
Task: "T029 Create MovementPanel component"
Task: "T030 Display walking speed"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T008)
3. Complete Phase 3: User Story 1 (T009-T013) - Grid displays positions
4. Complete Phase 4: User Story 2 (T014-T021) - Movement works
5. **STOP and VALIDATE**: Test grid display and movement independently
6. Deploy/demo if ready - basic movement testing functional

### Incremental Delivery

1. Setup + Foundational → Grid scaffolding ready
2. Add User Story 1 → Grid shows Pokemon positions (visual MVP)
3. Add User Story 2 → Movement testing works (functional MVP!)
4. Add User Story 3 → Range indicators enhance testing
5. Add User Story 4 → Speed stats improve debugging
6. Add User Story 5 → Full movement logging for detailed debugging
7. Each story adds value without breaking previous stories

### Task Count Summary

| Phase | Tasks | Parallel Tasks |
|-------|-------|----------------|
| Setup | 3 | 2 |
| Foundational | 5 | 0 |
| User Story 1 | 5 | 0 |
| User Story 2 | 8 | 0 |
| User Story 3 | 7 | 1 |
| User Story 4 | 7 | 1 |
| User Story 5 | 6 | 0 |
| Polish | 5 | 3 |
| **Total** | **46** | **7** |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- All components follow existing TestCombat/ patterns from 021-combat-test-harness
- Uses existing gridUtils.js functions - no new grid calculation code needed
- Manual UI testing per existing test harness patterns
- Commit after each task or logical group
