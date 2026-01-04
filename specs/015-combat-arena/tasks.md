# Tasks: Combat Arena Page

**Input**: Design documents from `/specs/015-combat-arena/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested - omitting test tasks per template guidelines.

**Organization**: Tasks grouped by user story (6 stories: 3 P1, 2 P2, 1 P3).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1-US6)
- Paths relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create utility libraries and shared components that all user stories depend on

- [x] T001 Create grid coordinate utilities in lib/gridUtils.js (toGridNotation, fromGridNotation, getManhattanDistance, isValidPosition, getValidMoveTargets)
- [x] T002 [P] Create battle state management utilities in lib/battleState.js (initializeBattleState, updateCombatantPosition, addLogEntry)
- [x] T003 [P] Create components/Combat/ directory structure

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: API routes that MUST be complete before ANY user story UI can be implemented

- [x] T004 Extend pages/api/battle/start.js to support grid_mode parameter and return grid initialization data per contracts/battle-start-extended.md
- [x] T005 [P] Create pages/api/battle/action.js for combat actions (attack, move) per contracts/battle-action-api.md
- [x] T006 [P] Create pages/api/battle/flee.js for flee attempts per contracts/battle-flee-api.md

**Checkpoint**: APIs ready - UI implementation can now begin

---

## Phase 3: User Story 1 - Battle Setup and Pokemon Placement (Priority: P1)

**Goal**: Player can see 10x10 grid with labels, trainers at fixed positions, and place Pokemon in deployment zone (rows 1-2)

**Independent Test**: Load combat page with party, verify grid renders with A-J/1-10 labels, place Pokemon in row 1 or 2, confirm placement is rejected outside deployment zone

### Implementation for User Story 1

- [x] T007 [P] [US1] Create GridSquare component in components/Combat/GridSquare.js (renders single cell with occupant, highlight state)
- [x] T008 [P] [US1] Create PokemonToken component in components/Combat/PokemonToken.js (sprite, HP bar, basic structure - status icons added in US4)
- [x] T009 [US1] Create BattleGrid component in components/Combat/BattleGrid.js (10x10 grid with column A-J and row 1-10 labels, uses GridSquare)
- [x] T010 [US1] Create pages/combat.js page structure with GameLayout wrapper and battle state initialization
- [x] T011 [US1] Implement setup phase in pages/combat.js (party selection panel, deployment zone highlighting rows 1-2)
- [x] T012 [US1] Add placement logic in pages/combat.js (click party Pokemon, click grid square, validate row 1-2, update state)
- [x] T013 [US1] Add trainer sprites to grid at A5 (player) and J5 (opponent) positions
- [x] T014 [US1] Add enemy Pokemon auto-placement in rows 9-10 when battle initializes
- [x] T015 [US1] Add "Start Battle" button that transitions from setup to combat phase

**Checkpoint**: Grid displays correctly, Pokemon can be placed in deployment zone, battle can transition to combat phase

---

## Phase 4: User Story 2 - Turn-Based Combat Execution (Priority: P1)

**Goal**: Player can select Pokemon, choose move, select target, execute attack with damage animation and HP updates

**Independent Test**: Start combat, select player Pokemon, select move from list, click enemy target, verify attack roll executes, damage number animates, HP bar updates

### Implementation for User Story 2

- [x] T016 [P] [US2] Create MoveSelector component in components/Combat/MoveSelector.js (list moves with name, type, power, PP remaining)
- [x] T017 [P] [US2] Create TurnIndicator component in components/Combat/TurnIndicator.js (horizontal list of Pokemon portraits, current turn highlighted)
- [x] T018 [US2] Add Pokemon selection logic in pages/combat.js (click owned Pokemon on grid to select)
- [x] T019 [US2] Add target highlighting in BattleGrid.js (highlight valid attack targets when move selected)
- [x] T020 [US2] Implement attack action flow in pages/combat.js (call /api/battle/action with attack type, process response)
- [x] T021 [US2] Add damage number animation CSS and component logic in PokemonToken.js (float up, fade out)
- [x] T022 [US2] Add HP bar animation in PokemonToken.js (smooth transition on damage, color change at 50%/25%)
- [x] T023 [US2] Implement turn advancement logic in pages/combat.js (update current_turn_index, highlight next combatant)
- [x] T024 [US2] Add opponent AI turn execution (auto-select move and target, execute attack)
- [x] T025 [US2] Add faint detection and animation in PokemonToken.js (fade to grayscale when HP=0)
- [x] T026 [US2] Remove fainted Pokemon from grid and initiative order

**Checkpoint**: Full attack loop works - select Pokemon, select move, select target, see damage, HP updates, turn advances

---

## Phase 5: User Story 6 - Battle End States (Priority: P1)

**Goal**: Victory/defeat screens display when battle concludes, appropriate redirects occur

**Independent Test**: Defeat all enemy Pokemon and verify victory screen with rewards appears; let all player Pokemon faint and verify defeat screen with redirect to Pokemon Center

### Implementation for User Story 6

- [x] T027 [P] [US6] Create BattleEndScreen component in components/Combat/BattleEndScreen.js (overlay with victory/defeat message, rewards, continue button)
- [x] T028 [US6] Add victory detection in pages/combat.js (check if all opponent Pokemon fainted after each action)
- [x] T029 [US6] Add defeat detection in pages/combat.js (check if all player Pokemon fainted after each action)
- [x] T030 [US6] Display BattleEndScreen on victory with XP and currency rewards from API response
- [x] T031 [US6] Display BattleEndScreen on defeat with redirect to /pokecenter
- [x] T032 [US6] Update player Pokemon HP in database after battle ends (call existing update endpoint)
- [x] T033 [US6] Handle flee outcome display (fled successfully message, redirect to previous location)

**Checkpoint**: Complete battle loop works - fight until one side wins, see appropriate end screen, return to game

---

## Phase 6: User Story 3 - Wild Pokemon Capture (Priority: P2)

**Goal**: "Throw Poke Ball" action available in wild battles, capture attempt processes and displays result

**Independent Test**: Start wild battle, verify "Throw Poke Ball" button visible, click it, select target Pokemon, verify capture attempt with roll/threshold feedback

### Implementation for User Story 3

- [ ] T034 [P] [US3] Create BattleControls component in components/Combat/BattleControls.js (Attack, Move, Catch, Flee buttons)
- [ ] T035 [US3] Add battle_type check in pages/combat.js to show/hide Catch button (only for wild battles)
- [ ] T036 [US3] Implement catch action flow in pages/combat.js (call /api/battle/catch, process response)
- [ ] T037 [US3] Add catch attempt animation (Poke Ball throw visual feedback)
- [ ] T038 [US3] Display catch result (success: caught message + end battle; fail: broke free message + continue)

**Checkpoint**: Wild Pokemon can be caught or escape, appropriate feedback shown

---

## Phase 7: User Story 4 - Status Effects Display (Priority: P2)

**Goal**: Status effect icons visible on Pokemon tokens, update when effects applied/removed

**Independent Test**: Use a move that applies status (e.g., Thunder Wave for paralysis), verify status icon appears on target Pokemon token

### Implementation for User Story 4

- [ ] T039 [P] [US4] Create StatusIcon component in components/Combat/StatusIcon.js (small colored badge with abbreviation)
- [ ] T040 [US4] Add status icon mapping in StatusIcon.js (PSN=purple, BRN=orange, PAR=yellow, SLP=gray, FRZ=cyan, CNF=pink, TOX=dark purple)
- [ ] T041 [US4] Integrate StatusIcon into PokemonToken.js (render icons for each status_effect in combatant)
- [ ] T042 [US4] Add status icon pulse animation on apply (CSS keyframe animation)
- [ ] T043 [US4] Update PokemonToken to re-render when status_effects array changes

**Checkpoint**: Status effects visually indicated on Pokemon, icons appear/disappear correctly

---

## Phase 8: User Story 5 - Battle Log and History (Priority: P3)

**Goal**: Scrollable battle log shows all actions with details

**Independent Test**: Execute several actions (attacks, status effects, faints), verify each appears in log with actor, move, target, and result

### Implementation for User Story 5

- [ ] T044 [P] [US5] Create BattleLog component in components/Combat/BattleLog.js (scrollable list of log entries)
- [ ] T045 [P] [US5] Create LogEntry sub-component in BattleLog.js (format entry by type: attack, damage, faint, status)
- [ ] T046 [US5] Integrate BattleLog into pages/combat.js layout (sidebar or bottom panel)
- [ ] T047 [US5] Add log entry generation for attack actions (attacker used move on target - Hit/Miss, damage)
- [ ] T048 [US5] Add log entry generation for faint events (Pokemon fainted!)
- [ ] T049 [US5] Add log entry generation for status effects (Pokemon was poisoned/burned/etc)
- [ ] T050 [US5] Add log entry generation for catch/flee attempts
- [ ] T051 [US5] Add auto-scroll to latest entry on new log additions

**Checkpoint**: Complete battle history visible, all action types logged with appropriate details

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements across all user stories

- [ ] T052 [P] Add movement action to BattleControls (if not included - Move button + target position selection)
- [ ] T053 [P] Add movement highlighting in BattleGrid (show valid move squares within 6 Manhattan distance)
- [ ] T054 Implement movement action flow in pages/combat.js (call /api/battle/action with move type)
- [ ] T055 Add error handling for no active Pokemon (redirect to /pokecenter with message)
- [ ] T056 Add loading states during API calls (disable controls, show spinner)
- [ ] T057 Add responsive layout for mobile (grid scales, side panels become bottom sheets on narrow screens)
- [ ] T058 Run quickstart.md validation (manual testing per checklist)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001 for grid utils)
- **User Stories (Phases 3-8)**: All depend on Foundational phase completion
- **Polish (Phase 9)**: Depends on all P1 and P2 stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P1)**: Depends on US1 (needs grid and Pokemon placement to test combat)
- **User Story 6 (P1)**: Depends on US2 (needs combat to trigger end states)
- **User Story 3 (P2)**: Depends on US2 (needs combat flow to add catch action)
- **User Story 4 (P2)**: Depends on US2 (needs combat to apply status effects)
- **User Story 5 (P3)**: Depends on US2 (needs actions to log)

### Parallel Opportunities

**Setup Phase**:
```
T001 gridUtils.js || T002 battleState.js || T003 directory structure
```

**Foundational Phase**:
```
T005 action.js || T006 flee.js (both after T004 start.js extended)
```

**User Story 1**:
```
T007 GridSquare.js || T008 PokemonToken.js (then T009 BattleGrid needs both)
```

**User Story 2**:
```
T016 MoveSelector.js || T017 TurnIndicator.js
```

**User Story 4 + 5 (can run in parallel after US2)**:
```
Developer A: T039-T043 (Status Icons)
Developer B: T044-T051 (Battle Log)
```

---

## Parallel Example: Foundational Phase

```bash
# After T004 completes, launch both API routes in parallel:
Task: "Create pages/api/battle/action.js for combat actions"
Task: "Create pages/api/battle/flee.js for flee attempts"
```

---

## Implementation Strategy

### MVP First (User Stories 1, 2, 6 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (Grid + Placement)
4. Complete Phase 4: User Story 2 (Combat)
5. Complete Phase 5: User Story 6 (End States)
6. **STOP and VALIDATE**: Full battle loop works
7. Deploy/demo MVP

### Incremental Delivery

1. Setup + Foundational -> APIs ready
2. US1: Grid displays, Pokemon can be placed -> Demo: "Here's the battle arena"
3. US2: Combat works -> Demo: "You can fight now"
4. US6: Battle ends properly -> Demo: "Complete battle loop MVP"
5. US3: Catch wild Pokemon -> Demo: "Gotta catch 'em all"
6. US4: Status effects visible -> Demo: "Tactical depth added"
7. US5: Battle log -> Demo: "Full battle history"

### Recommended Order

1. T001-T003 (Setup)
2. T004-T006 (APIs)
3. T007-T015 (US1: Grid + Setup)
4. T016-T026 (US2: Combat)
5. T027-T033 (US6: End States)
6. **MVP COMPLETE**
7. T034-T038 (US3: Catch)
8. T039-T043 (US4: Status Icons)
9. T044-T051 (US5: Battle Log)
10. T052-T058 (Polish)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Existing battle engine (lib/battleEngine.js) handles all combat calculations
- Existing status effects (lib/statusEffects.js) handles status logic
