# Tasks: Shop API Endpoint

**Input**: Design documents from `/specs/009-shop-api/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/shop-api.md

**Tests**: Manual API testing via curl (no automated tests requested)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Paths use Next.js project structure from plan.md

---

## Phase 1: Setup

**Purpose**: Database migration and shared utilities for item handling

- [x] T001 Create SQL migration file sql/005_player_inventory.sql with player_inventory table, indexes, RLS policies, and trigger
- [x] T002 [P] Create lib/itemData.js with getAllItems(), getItemById(), getPurchasableItems(), and buildPlayerInventoryResponse() functions following pokemonData.js patterns
- [x] T003 [P] Add shop-specific error helpers to lib/apiResponse.js (sendInsufficientFundsError, sendItemNotFoundError, sendItemNotPurchasableError)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Apply migration before any API work can begin

**CRITICAL**: Migration must be applied to database before testing any endpoints

- [ ] T004 Run sql/005_player_inventory.sql migration in Supabase SQL Editor - MANUAL: User must execute in Supabase dashboard

**Checkpoint**: Database ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Purchase Items (Priority: P1)

**Goal**: Enable authenticated players to purchase items using in-game currency

**Independent Test**: POST /api/shop with item_id and quantity, verify currency deducted and inventory updated

### Implementation for User Story 1

- [x] T005 [US1] Create pages/api/shop.js with method router for GET and POST requests
- [x] T006 [US1] Implement POST handler in pages/api/shop.js: JWT authentication via authenticateRequest()
- [x] T007 [US1] Implement POST handler: validate request body (item_id required, quantity must be positive integer)
- [x] T008 [US1] Implement POST handler: validate item exists and is purchasable (cost not null) using getItemById()
- [x] T009 [US1] Implement POST handler: query user currency balance from users table
- [x] T010 [US1] Implement POST handler: check sufficient funds, return INSUFFICIENT_FUNDS error with required/available amounts if not
- [x] T011 [US1] Implement POST handler: deduct currency from users table
- [x] T012 [US1] Implement POST handler: upsert inventory row (INSERT ... ON CONFLICT DO UPDATE SET quantity = quantity + $1)
- [x] T013 [US1] Implement POST handler: return success response with purchased item, updated inventory quantity, and balance breakdown
- [x] T014 [US1] Add error handling for database failures in pages/api/shop.js

**Checkpoint**: User Story 1 complete - players can purchase items and see updated balance

---

## Phase 4: User Story 2 - View Available Items (Priority: P2)

**Goal**: Allow players to browse the item catalog before purchasing

**Independent Test**: GET /api/shop returns list of purchasable items with prices

### Implementation for User Story 2

- [x] T015 [US2] Implement GET handler in pages/api/shop.js: call getPurchasableItems() from lib/itemData.js
- [x] T016 [US2] Implement GET handler: return success response with items array and count
- [x] T017 [US2] Verify items with null cost (e.g., Master Ball) are excluded from response

**Checkpoint**: User Story 2 complete - catalog endpoint returns purchasable items

---

## Phase 5: User Story 3 - View Current Inventory (Priority: P3)

**Goal**: Allow authenticated players to view their owned items

**Independent Test**: GET /api/player/inventory returns items with quantities and current currency

### Implementation for User Story 3

- [x] T018 [US3] Create pages/api/player/inventory.js with GET method guard
- [x] T019 [US3] Implement GET handler: JWT authentication via authenticateRequest()
- [x] T020 [US3] Implement GET handler: query player_inventory table for user's items
- [x] T021 [US3] Implement GET handler: query user currency balance
- [x] T022 [US3] Implement GET handler: merge inventory records with Source item data using buildPlayerInventoryResponse()
- [x] T023 [US3] Implement GET handler: return success response with inventory array, count, and currency
- [x] T024 [US3] Handle empty inventory case (return empty array with count 0)

**Checkpoint**: User Story 3 complete - players can view their inventory

---

## Phase 6: Polish & Validation

**Purpose**: End-to-end testing and documentation validation

- [ ] T025 Test purchase flow: create user, add currency, purchase item, verify inventory
- [x] T026 Test insufficient funds error: verify response includes required and available amounts
- [x] T027 Test invalid item_id: verify ITEM_NOT_FOUND error response
- [x] T028 Test non-purchasable item (Master Ball): verify ITEM_NOT_PURCHASABLE error response
- [x] T029 Test quantity validation: verify error for zero, negative, and non-integer values
- [ ] T030 Test inventory increment: purchase same item twice, verify quantity increases
- [ ] T031 Run quickstart.md validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on T001 (migration file created) - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion (T004 migration applied)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on T001-T004, no dependencies on other stories
- **User Story 2 (P2)**: Depends on T001-T004, no dependencies on other stories (can run in parallel with US1)
- **User Story 3 (P3)**: Depends on T001-T004, no dependencies on other stories (can run in parallel with US1/US2)

### Within Each User Story

- Setup (T001-T003) before Foundational (T004)
- Authentication before business logic
- Validation before database operations
- Database operations before response formatting

### Parallel Opportunities

- T002 and T003 can run in parallel (different files)
- After T004, US1, US2, and US3 can be implemented in parallel
- T025-T031 validation tests run sequentially after all stories complete

---

## Parallel Example: Setup Phase

```bash
# These tasks work on different files and can run in parallel:
Task: "Create lib/itemData.js with item catalog utilities"
Task: "Add shop-specific error helpers to lib/apiResponse.js"
```

---

## Parallel Example: User Stories

```bash
# After migration (T004) is applied, all user stories can start in parallel:
# Developer A: User Story 1 (pages/api/shop.js POST)
# Developer B: User Story 2 (pages/api/shop.js GET - same file, but different handler)
# Developer C: User Story 3 (pages/api/player/inventory.js)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004 - apply migration)
3. Complete Phase 3: User Story 1 (T005-T014)
4. **STOP and VALIDATE**: Test purchase flow end-to-end
5. Players can now buy items!

### Incremental Delivery

1. Setup + Foundational -> Database ready
2. Add User Story 1 -> Test purchase -> Deploy (MVP!)
3. Add User Story 2 -> Test catalog -> Deploy
4. Add User Story 3 -> Test inventory -> Deploy
5. Each story adds value without breaking previous stories

### Suggested MVP Scope

- Phase 1 (Setup): 3 tasks
- Phase 2 (Foundational): 1 task
- Phase 3 (User Story 1): 10 tasks
- **Total MVP tasks**: 14 tasks

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- T004 is MANUAL - requires user to run SQL in Supabase dashboard
- All API endpoints follow established patterns from heal.js and battle.js
- Error responses must match contracts/shop-api.md format exactly
- N8N integration requires parseable error details (see INSUFFICIENT_FUNDS)
