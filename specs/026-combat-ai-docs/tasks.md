# Tasks: Combat AI Documentation

**Input**: Design documents from `/specs/026-combat-ai-docs/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Not applicable - documentation feature with manual review validation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each documentation section.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Documentation output**: `docs/combat-ai-system.md`
- **Source reference**: `lib/combatAI.js`, `lib/combatSimulator.js`
- **Spec artifacts**: `specs/026-combat-ai-docs/`

---

## Phase 1: Setup

**Purpose**: Create documentation structure and verify source files

- [x] T001 Create docs/ directory if not exists
- [x] T002 Create initial docs/combat-ai-system.md with document header and table of contents outline
- [x] T003 [P] Verify lib/combatAI.js exists and note current line numbers for AI_WEIGHTS (15-34)
- [x] T004 [P] Verify lib/combatSimulator.js exists and note current line numbers for AI_MODE (49-52)

---

## Phase 2: Foundational (Document Structure)

**Purpose**: Create the document skeleton that all user story content will populate

**CRITICAL**: Document structure must be complete before writing section content

- [x] T005 Write document introduction section explaining purpose and audience in docs/combat-ai-system.md
- [x] T006 Create section headers for all major documentation areas (Overview, Weights, Decision Flow, Components, Examples, Edge Cases) in docs/combat-ai-system.md
- [x] T007 Add navigation links between sections in docs/combat-ai-system.md
- [x] T008 Create placeholder for AI Modes comparison table in docs/combat-ai-system.md

**Checkpoint**: Document structure ready - content writing can begin

---

## Phase 3: User Story 1 - Understanding AI Weights (Priority: P1)

**Goal**: Complete documentation of all AI weight constants so developers can understand and tune AI behavior

**Independent Test**: Reader can look up any weight constant and find its value, purpose, and when it applies

### Implementation for User Story 1

- [x] T009 [US1] Write AI_WEIGHTS overview explaining scoring philosophy in docs/combat-ai-system.md
- [x] T010 [P] [US1] Document Type Matchup weights (TYPE_ADVANTAGE_2X, TYPE_ADVANTAGE_4X, TYPE_DISADVANTAGE_HALF, TYPE_DISADVANTAGE_QUARTER) in docs/combat-ai-system.md
- [x] T011 [P] [US1] Document Move Property weights (MOVE_POWER_PER_10, STATUS_ON_HEALTHY, STATUS_ON_STATUSED, LOW_PP_WARNING) in docs/combat-ai-system.md
- [x] T012 [P] [US1] Document Target Selection weights (TARGET_LOW_HP) in docs/combat-ai-system.md
- [x] T013 [P] [US1] Document Range weights (IN_RANGE, OUT_OF_RANGE) with explanation of -1000 penalty rationale in docs/combat-ai-system.md
- [x] T014 [US1] Create weight reference table with all 11 constants, values, categories, and descriptions in docs/combat-ai-system.md
- [x] T015 [US1] Add "Tuning Tips" subsection explaining how to adjust weights for different difficulty levels in docs/combat-ai-system.md
- [x] T016 [US1] Verify all weight values match lib/combatAI.js:15-34

**Checkpoint**: US1 complete - developers can understand all AI weight constants

---

## Phase 4: User Story 2 - Understanding Decision Flow (Priority: P2)

**Goal**: Document the complete AI decision-making process from evaluation to action selection

**Independent Test**: Reader can follow decision tree for a sample scenario and predict AI behavior

### Implementation for User Story 2

- [x] T017 [US2] Write Decision Flow overview explaining the main orchestration in docs/combat-ai-system.md
- [x] T018 [US2] Document executeAITurn() flow with ASCII decision tree in docs/combat-ai-system.md
- [x] T019 [US2] Document scoreMoveOption() scoring algorithm step-by-step in docs/combat-ai-system.md
- [x] T020 [US2] Document selectMoveTactical() enhanced scoring (post-movement range, self-target detection) in docs/combat-ai-system.md
- [x] T021 [US2] Create visual flowchart showing complete AI turn decision tree in docs/combat-ai-system.md
- [x] T022 [US2] Write Example Scenario 1: Fire move vs Grass type (in range) with score calculation in docs/combat-ai-system.md
- [x] T023 [P] [US2] Write Example Scenario 2: Move out of range requiring movement in docs/combat-ai-system.md
- [x] T024 [P] [US2] Write Example Scenario 3: Status move decision (healthy vs statused target) in docs/combat-ai-system.md
- [x] T025 [US2] Document AI_MODE differences (random vs tactical) with comparison table in docs/combat-ai-system.md
- [x] T026 [US2] Verify all decision flows match lib/combatAI.js and lib/combatSimulator.js implementation

**Checkpoint**: US2 complete - developers can trace AI decisions from start to finish

---

## Phase 5: User Story 3 - Understanding AI Components (Priority: P3)

**Goal**: Document all component functions with inputs, outputs, and interactions

**Independent Test**: Reader can look up any function and understand its purpose, parameters, and role

### Implementation for User Story 3

- [x] T027 [US3] Write Component Reference overview explaining module organization in docs/combat-ai-system.md
- [x] T028 [P] [US3] Document calculateTypeEffectiveness() function (combatAI.js:43-50) in docs/combat-ai-system.md
- [x] T029 [P] [US3] Document scoreMoveOption() function signature, parameters, return type (combatAI.js:61-131) in docs/combat-ai-system.md
- [x] T030 [P] [US3] Document findBestTarget() function (combatAI.js:141-169) in docs/combat-ai-system.md
- [x] T031 [P] [US3] Document calculateOptimalMovement() function (combatAI.js:179-266) in docs/combat-ai-system.md
- [x] T032 [P] [US3] Document executeAITurn() function (combatAI.js:276-360) in docs/combat-ai-system.md
- [x] T033 [US3] Document helper functions from combatSimulator.js (selectMove, isSelfTargetMove, checkIfDamagingMove, getMoveRange, executeAIMovement) in docs/combat-ai-system.md
- [x] T034 [US3] Create component relationship diagram showing function call hierarchy in docs/combat-ai-system.md
- [x] T035 [US3] Document integration points (typeEffectiveness.js, moveRanges.js, gridUtils.js) in docs/combat-ai-system.md
- [x] T036 [US3] Verify all function signatures and line numbers match current implementation

**Checkpoint**: US3 complete - developers can understand all AI components and their interactions

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, final review, and quality assurance

- [x] T037 Write Edge Cases section documenting Struggle fallback behavior in docs/combat-ai-system.md
- [x] T038 [P] Document "No Valid Targets" handling in docs/combat-ai-system.md
- [x] T039 [P] Document "Out of Range with Movement" behavior in docs/combat-ai-system.md
- [x] T040 [P] Document tie-breaking behavior (first evaluated wins) in docs/combat-ai-system.md
- [x] T041 [P] Document immunity detection (score -= 2000) in docs/combat-ai-system.md
- [x] T042 Add Quick Reference section at end with weight cheat sheet in docs/combat-ai-system.md
- [x] T043 Review all code references against current source files for accuracy
- [x] T044 Verify Success Criteria SC-001: 100% of AI weight constants documented
- [x] T045 Verify Success Criteria SC-003: At least 3 worked examples included
- [x] T046 Verify Success Criteria SC-005: Visual decision flowchart included
- [x] T047 Final proofreading and formatting consistency check

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - creates document structure
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (different sections)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - Documents AI weights section
- **User Story 2 (P2)**: Can start after Foundational - Documents decision flow section (may reference US1 weights)
- **User Story 3 (P3)**: Can start after Foundational - Documents components section

### Within Each User Story

- Overview tasks before detail tasks
- Reference tables after individual item documentation
- Verification tasks last

### Parallel Opportunities

Within Phase 1:
- T003, T004 can run in parallel (different source files)

Within US1:
- T010, T011, T012, T013 can run in parallel (different weight categories)

Within US2:
- T023, T024 can run in parallel (different example scenarios)

Within US3:
- T028, T029, T030, T031, T032 can run in parallel (different functions)

Within Polish:
- T038, T039, T040, T041 can run in parallel (different edge cases)

---

## Parallel Example: User Story 1

```bash
# After T009 (overview) completes, launch weight documentation in parallel:
Task: "Document Type Matchup weights in docs/combat-ai-system.md"
Task: "Document Move Property weights in docs/combat-ai-system.md"
Task: "Document Target Selection weights in docs/combat-ai-system.md"
Task: "Document Range weights in docs/combat-ai-system.md"

# Then continue with T014 (reference table) which combines all the above
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (AI Weights)
4. **STOP and VALIDATE**: Verify weight documentation is complete and accurate
5. Document provides immediate value for AI tuning work

### Incremental Delivery

1. Complete Setup + Foundational → Document skeleton ready
2. Add User Story 1 (Weights) → Developers can tune AI difficulty
3. Add User Story 2 (Decision Flow) → Developers can debug AI behavior
4. Add User Story 3 (Components) → Developers can modify AI code
5. Each story adds documentation value independently

### Suggested MVP Scope

- **MVP**: User Story 1 only (AI Weights documentation)
- Provides immediate value for game balancing
- Can be completed and validated quickly
- Foundation for more detailed documentation later

---

## Notes

- All tasks reference docs/combat-ai-system.md as the output file
- Source verification tasks ensure documentation accuracy
- No automated tests - validation is manual review against source code
- Parallel tasks marked [P] work on different sections, no merge conflicts
- Each checkpoint allows validation before proceeding

---

## Implementation Summary

**Status**: COMPLETE

**Discovery**: Comprehensive documentation already existed at `docs/COMBAT_AI_SYSTEM.md` (renamed to `docs/combat-ai-system.md`).

**Updates Made**:
1. Added missing `MOVE_POWER_PER_10` weight constant to Weight Constants section
2. Added `MOVE_POWER_PER_10` to Quick Reference table
3. Renamed file to lowercase for consistency with plan

**Success Criteria Verification**:
- SC-001: 11/11 AI weight constants documented
- SC-003: 3+ worked examples included (Fire vs Grass in range, out of range with movement, unreachable move)
- SC-005: Visual flowcharts included (Architecture diagram, Turn execution flow)
