# Tasks: Remove Random Mode from Combat Harness

**Input**: Design documents from `/specs/027-combat-ai-harness/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: No automated tests requested - manual verification via test harness

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No setup required - this is a refactor of existing files

*No tasks in this phase - all files already exist*

---

## Phase 2: Foundational (Core Library Changes)

**Purpose**: Remove AI_MODE infrastructure from combatSimulator.js - BLOCKS UI/API changes

**Why Foundational**: The UI and API depend on the simulator's exports. Removing AI_MODE first prevents import errors.

- [x] T001 Remove `AI_MODE` constant export from `lib/combatSimulator.js`
- [x] T002 Remove `aiMode` parameter from `createSimulation()` config object in `lib/combatSimulator.js`
- [x] T003 Remove `aiMode` property from simulation state object in `lib/combatSimulator.js`
- [x] T004 Remove random selection branch in `selectMove()` function, always call `selectMoveTactical()` in `lib/combatSimulator.js`
- [x] T005 Remove conditional check for AI reasoning logging (always log reasoning) in `lib/combatSimulator.js`

**Checkpoint**: Simulator now only supports tactical mode. API and UI updates can proceed.

---

## Phase 3: User Story 1 - Combat AI Tuning via Test Harness (Priority: P1)

**Goal**: Remove AI mode selection UI so test harness always uses tactical AI for consistent tuning observations

**Independent Test**: Start any battle in web harness (`/test-combat`), verify no AI mode toggle visible and AI reasoning logs appear for every move

### Implementation for User Story 1

- [x] T006 [P] [US1] Remove `aiMode` state variable from `pages/test-combat.js`
- [x] T007 [P] [US1] Remove `setAiMode` calls and any AI mode toggle UI component from `pages/test-combat.js`
- [x] T008 [US1] Remove `aiMode` from API request body in `handleStart()` function in `pages/test-combat.js`
- [x] T009 [US1] Remove `AI_MODE` import from `pages/api/test-combat/start.js`
- [x] T010 [US1] Remove `aiMode` parameter handling and validation from `pages/api/test-combat/start.js`
- [x] T011 [US1] Remove `aiMode` from `createSimulation()` call in `pages/api/test-combat/start.js`
- [x] T012 [US1] Remove `aiMode` from simulation response object in `pages/api/test-combat/start.js`

**Checkpoint**: Web harness uses tactical mode only. AI reasoning visible in all battle logs.

---

## Phase 4: User Story 2 - Consistent Test Results for AI Comparison (Priority: P2)

**Goal**: Ensure seeded battles produce identical tactical decisions for reliable A/B testing

**Independent Test**: Run same battle twice with identical seed, verify identical AI decisions and outcomes

### Implementation for User Story 2

*Note: This story is satisfied by the foundational changes - tactical mode is already deterministic with seeds. These tasks verify the behavior.*

- [x] T013 [US2] Verify `selectMoveTactical()` produces deterministic results with same seed in `lib/combatSimulator.js`
- [x] T014 [US2] Test reproducibility: run CLI battle with seed, verify same outcome on repeat in `scripts/test-combat.js`

**Checkpoint**: Same seed produces identical battle outcomes. A/B testing is reliable.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup and validation

- [x] T015 Run quickstart.md verification steps to validate all changes
- [x] T016 [P] Update any JSDoc comments that reference AI_MODE or aiMode parameter
- [x] T017 Verify no console errors or warnings in browser when running test harness

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No tasks - skip
- **Foundational (Phase 2)**: No dependencies - start immediately
- **User Story 1 (Phase 3)**: Depends on Foundational (T001-T005) - AI_MODE must be removed first
- **User Story 2 (Phase 4)**: Depends on Foundational (T001-T005) - verification after tactical-only mode
- **Polish (Phase 5)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational phase only
- **User Story 2 (P2)**: Depends on Foundational phase only, can run in parallel with US1

### Within Each Phase

**Foundational (T001-T005)**:
- T001-T003: Can run in parallel (different sections of same file, but logically grouped)
- T004: Depends on T001 (needs AI_MODE removed before removing branch)
- T005: Independent, can run in parallel

**User Story 1 (T006-T012)**:
- T006-T007: Can run in parallel (different state/UI sections)
- T008: Depends on T006-T007 (state must be removed before API call)
- T009-T012: Sequential within API file, depends on T001 (AI_MODE import)

### Parallel Opportunities

```bash
# Foundational - can batch T001-T003:
Task: "Remove AI_MODE constant from lib/combatSimulator.js"
Task: "Remove aiMode from createSimulation config in lib/combatSimulator.js"
Task: "Remove aiMode from simulation state in lib/combatSimulator.js"

# User Story 1 - can batch T006-T007:
Task: "Remove aiMode state variable from pages/test-combat.js"
Task: "Remove AI mode toggle UI from pages/test-combat.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (T001-T005) - Remove AI_MODE from simulator
2. Complete Phase 3: User Story 1 (T006-T012) - Remove UI and API handling
3. **STOP and VALIDATE**: Run quickstart.md verification
4. Merge if ready

### Incremental Delivery

1. Foundational → Simulator uses tactical only
2. User Story 1 → UI/API cleanup complete
3. User Story 2 → Verify reproducibility
4. Polish → Documentation and final validation

### Single Developer Strategy

Recommended order:
1. T001-T005 sequentially in `lib/combatSimulator.js`
2. T009-T012 sequentially in `pages/api/test-combat/start.js`
3. T006-T008 sequentially in `pages/test-combat.js`
4. T013-T017 validation tasks

---

## Files Modified Summary

| File | Tasks | Changes |
|------|-------|---------|
| `lib/combatSimulator.js` | T001-T005 | Remove AI_MODE, aiMode config, random selection branch, conditional logging |
| `pages/test-combat.js` | T006-T008 | Remove aiMode state, UI toggle, API param |
| `pages/api/test-combat/start.js` | T009-T012 | Remove AI_MODE import, aiMode handling |
| `scripts/test-combat.js` | N/A | No changes needed (no --aiMode flag exists) |

---

## Notes

- [P] tasks = different files or independent code sections
- [Story] label maps task to user story for traceability
- Estimated effort: ~50 lines removed across 3 files
- Risk: Low - purely subtractive change
- Commit after each phase for easy rollback
