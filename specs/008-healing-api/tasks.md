# Tasks: Healing API

**Input**: Design documents from `/specs/008-healing-api/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/heal-api.md

**Tests**: Not explicitly requested - manual testing via curl/Postman specified in plan.md.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

This project uses Next.js structure:
- **API routes**: `pages/api/`
- **Utilities**: `lib/`
- **No new migrations needed** - uses existing player_pokemon table

---

## Phase 1: Setup

**Purpose**: Verify prerequisites and existing dependencies

- [x] T001 Verify existing lib/pokemonData.js exports initializeMovePP and buildPlayerPokemonListResponse functions
- [x] T002 Verify existing lib/authHelper.js exports authenticateRequest function
- [x] T003 Verify existing lib/apiResponse.js exports sendSuccess, sendUnauthorizedError, sendMethodNotAllowed, sendInternalError functions
- [x] T004 Verify existing lib/supabase.js exports createAdminClient function

**Checkpoint**: All required dependencies confirmed - implementation can begin

---

## Phase 2: Foundational

**Purpose**: No foundational tasks required - all infrastructure exists

This feature uses existing:
- Authentication (lib/authHelper.js)
- Database client (lib/supabase.js)
- Response helpers (lib/apiResponse.js)
- Pokemon data utilities (lib/pokemonData.js)
- Database schema (player_pokemon table)

**Checkpoint**: Foundation ready - proceed to User Story 1

---

## Phase 3: User Story 1 - Heal Party After Battle (Priority: P1)

**Goal**: Students can heal all active Pokemon to full HP and restore all move PP via a single API call.

**Independent Test**: Call POST /api/heal with valid JWT, verify all active Pokemon return with current_hp = max_hp and move_pp restored to Source maximums.

### Implementation for User Story 1

- [x] T005 [US1] Create pages/api/heal.js with file structure and imports per contracts/heal-api.md
- [x] T006 [US1] Implement POST method guard returning 405 for non-POST requests in pages/api/heal.js
- [x] T007 [US1] Implement JWT authentication using authenticateRequest() in pages/api/heal.js
- [x] T008 [US1] Implement query for active Pokemon (user_id + is_active = true) in pages/api/heal.js
- [x] T009 [US1] Implement HP restoration loop (current_hp = max_hp for each Pokemon) in pages/api/heal.js
- [x] T010 [US1] Implement PP restoration using initializeMovePP(selected_moves) for each Pokemon in pages/api/heal.js
- [x] T011 [US1] Implement database UPDATE for each healed Pokemon in pages/api/heal.js
- [x] T012 [US1] Implement empty party handling (return success with healed_count: 0) in pages/api/heal.js
- [x] T013 [US1] Add error handling with try/catch and sendInternalError for database failures in pages/api/heal.js

**Checkpoint**: User Story 1 complete - healing core functionality works

---

## Phase 4: User Story 2 - Immediate Response for Workflow Integration (Priority: P2)

**Goal**: Response returns within 2 seconds with complete merged Pokemon data for N8N workflow parsing.

**Independent Test**: Call POST /api/heal, verify response includes healed array with merged Source data (name, type, sprite, artwork) and healed_count.

### Implementation for User Story 2

- [x] T014 [US2] Implement response building using buildPlayerPokemonListResponse() in pages/api/heal.js
- [x] T015 [US2] Structure response per contract: { success: true, data: { healed, healed_count, message } } in pages/api/heal.js
- [x] T016 [US2] Add appropriate message strings ("Party healed successfully" vs "No active Pokemon to heal") in pages/api/heal.js

**Checkpoint**: User Story 2 complete - response format matches N8N expectations

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Manual validation and edge case verification

- [x] T017 Test endpoint with damaged party using curl (HP < max_hp)
- [x] T018 Test endpoint with fainted Pokemon (HP = 0) using curl
- [x] T019 Test endpoint with depleted PP using curl
- [x] T020 Test endpoint with empty active party using curl
- [x] T021 Test endpoint with invalid/missing JWT using curl
- [x] T022 Test idempotency - call endpoint twice, verify same result

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - verification only
- **Foundational (Phase 2)**: N/A - all infrastructure exists
- **User Story 1 (Phase 3)**: Depends on Setup verification
- **User Story 2 (Phase 4)**: Depends on User Story 1 completion (response building uses healed Pokemon data)
- **Polish (Phase 5)**: Depends on User Stories 1 and 2 completion

### User Story Dependencies

- **User Story 1 (P1)**: Independent - core healing logic
- **User Story 2 (P2)**: Depends on US1 - formats the response from US1's healed data

### Within User Story 1

Tasks T005-T013 are sequential (all modify the same file pages/api/heal.js):
1. T005: File creation with imports
2. T006-T007: Request validation (method, auth)
3. T008: Query active Pokemon
4. T009-T011: Healing logic and database update
5. T012-T013: Edge cases and error handling

### Within User Story 2

Tasks T014-T016 are sequential (build on US1's data flow):
1. T014: Merge with Source data
2. T015: Structure final response
3. T016: Message formatting

### Parallel Opportunities

Due to single-file implementation, parallel opportunities are limited:
- **Phase 1**: T001, T002, T003, T004 can all run in parallel (different files)
- **Phase 5**: T017-T022 can all run in parallel (independent tests)

---

## Parallel Example: Phase 1 Setup Verification

```bash
# Verify all dependencies in parallel:
Task: "Verify existing lib/pokemonData.js exports initializeMovePP and buildPlayerPokemonListResponse"
Task: "Verify existing lib/authHelper.js exports authenticateRequest function"
Task: "Verify existing lib/apiResponse.js exports sendSuccess, sendUnauthorizedError, sendMethodNotAllowed, sendInternalError"
Task: "Verify existing lib/supabase.js exports createAdminClient function"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Verify dependencies exist
2. Complete Phase 3: User Story 1 (healing logic)
3. **STOP and VALIDATE**: Test with curl - does HP restore?
4. If working, proceed to User Story 2

### Full Implementation

1. Phase 1: Verify dependencies (T001-T004)
2. Phase 3: Core healing (T005-T013)
3. Phase 4: Response formatting (T014-T016)
4. Phase 5: Manual testing (T017-T022)

### Single Developer Flow

Since all implementation is in one file (pages/api/heal.js):
1. Create file with full structure
2. Implement sequentially T005 -> T016
3. Run all Phase 5 tests

---

## Notes

- All implementation tasks modify pages/api/heal.js - must be done sequentially
- No new lib modules needed - all utilities exist
- No database migrations needed - uses existing schema
- Manual testing specified (no automated test tasks)
- Total: 22 tasks (4 setup, 9 US1, 3 US2, 6 polish)
