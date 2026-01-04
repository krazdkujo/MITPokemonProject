# Tasks: PokeMart Item Shop Page

**Input**: Design documents from `/specs/013-pokemart-page/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Manual browser testing only (no automated tests requested)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

- **Web app (Next.js)**: `pages/`, `components/`, `lib/` at repository root

---

## Phase 1: Setup

**Purpose**: Verify existing infrastructure is ready (no new setup needed)

- [x] T001 Verify existing stub at pages/pokemart.js exists and is accessible
- [x] T002 [P] Verify GameLayout component works at components/layout/GameLayout.js
- [x] T003 [P] Verify CurrencyBadge component works at components/layout/CurrencyBadge.js
- [x] T004 [P] Verify useGame hook exports currency and refreshData from lib/gameContext.js
- [x] T005 [P] Verify apiFetch is available from lib/apiFetch.js
- [x] T006 [P] Verify GET /api/shop returns item catalog
- [x] T007 [P] Verify POST /api/shop handles purchases

**Checkpoint**: All existing infrastructure verified - implementation can begin

---

## Phase 2: Foundational (Page Structure)

**Purpose**: Core page structure that ALL user stories depend on

- [x] T008 Implement base PokeMartPage export with GameLayout wrapper in pages/pokemart.js
- [x] T009 Implement PokeMartContent inner component with useGame hook in pages/pokemart.js
- [x] T010 Add local state for catalog, activeTab, cart, purchasing, modals in pages/pokemart.js
- [x] T011 Implement catalog fetch on component mount (GET /api/shop) in pages/pokemart.js
- [x] T012 Add base page styles (background, two-column layout, responsive) in pages/pokemart.js
- [x] T013 Implement ShopHeader component with title and CurrencyBadge in pages/pokemart.js

**Checkpoint**: Foundation ready - page loads with header and fetches catalog

---

## Phase 3: User Story 1 - Browse and Purchase Items (Priority: P1) - MVP

**Goal**: Players can browse catalog, add to cart, and complete purchase

**Independent Test**: Visit page, add items to cart, click Purchase with sufficient funds, verify success modal and balance update

### Implementation for User Story 1

- [x] T014 [US1] Implement ItemCard component displaying name, price, description, quantity input in pages/pokemart.js
- [x] T015 [US1] Implement addToCart function to add/update items in cart state in pages/pokemart.js
- [x] T016 [US1] Implement basic item grid showing all items in selected category in pages/pokemart.js
- [x] T017 [US1] Implement ShoppingCart component displaying cart items with quantities and totals in pages/pokemart.js
- [x] T018 [US1] Implement CartItem component for each item row in cart in pages/pokemart.js
- [x] T019 [US1] Calculate and display cart totalCost from cart items in pages/pokemart.js
- [x] T020 [US1] Implement PurchaseButton component with disabled state when cart empty or purchasing in pages/pokemart.js
- [x] T021 [US1] Implement handlePurchase function calling POST /api/shop for each cart item in pages/pokemart.js
- [x] T022 [US1] Call refreshData() after successful purchase to update currency in pages/pokemart.js
- [x] T023 [US1] Clear cart after successful purchase in pages/pokemart.js
- [x] T024 [US1] Implement PurchaseModal showing items bought and new balance in pages/pokemart.js
- [x] T025 [US1] Show success modal after purchase completes in pages/pokemart.js

**Checkpoint**: User Story 1 complete - basic purchase flow works end-to-end

---

## Phase 4: User Story 2 - View Item Catalog by Category (Priority: P2)

**Goal**: Players can browse items organized by category tabs

**Independent Test**: Visit page, click each category tab, verify items filter correctly

### Implementation for User Story 2

- [x] T026 [US2] Implement CategoryTabs component with 4 tabs (Poke Balls, Medicine, Hold Items, TMs) in pages/pokemart.js
- [x] T027 [US2] Add activeTab state and setActiveTab handler in pages/pokemart.js
- [x] T028 [US2] Filter catalog items by type matching activeTab in pages/pokemart.js
- [x] T029 [US2] Exclude items with null cost from filtered results in pages/pokemart.js
- [x] T030 [US2] Style active tab with gold color (#fbbf24) and inactive with muted color in pages/pokemart.js
- [x] T031 [US2] Show "No items in this category" message when filter returns empty in pages/pokemart.js

**Checkpoint**: User Story 2 complete - category navigation works correctly

---

## Phase 5: User Story 3 - Handle Insufficient Funds (Priority: P2)

**Goal**: Players see clear error when trying to purchase without enough currency

**Independent Test**: Add expensive items exceeding balance, click Purchase, verify error modal with amounts

### Implementation for User Story 3

- [x] T032 [US3] Implement InsufficientFundsModal component in pages/pokemart.js
- [x] T033 [US3] Add errorDetails state to store INSUFFICIENT_FUNDS error info in pages/pokemart.js
- [x] T034 [US3] Detect INSUFFICIENT_FUNDS error code in handlePurchase response in pages/pokemart.js
- [x] T035 [US3] Display "You need X currency, but only have Y" message in error modal in pages/pokemart.js
- [x] T036 [US3] Keep cart intact when error modal is dismissed in pages/pokemart.js
- [x] T037 [US3] Add close button to dismiss error modal in pages/pokemart.js

**Checkpoint**: User Story 3 complete - insufficient funds handled gracefully

---

## Phase 6: User Story 4 - Cart Management (Priority: P2)

**Goal**: Players can manage cart items with quantities and see running totals

**Independent Test**: Add items, change quantities, remove items, verify totals update in real-time

### Implementation for User Story 4

- [x] T038 [US4] Implement quantity adjustment buttons (+/-) in CartItem component in pages/pokemart.js
- [x] T039 [US4] Implement updateCartQuantity function to change item quantity in pages/pokemart.js
- [x] T040 [US4] Implement removeFromCart function to delete item from cart in pages/pokemart.js
- [x] T041 [US4] Add remove button (X) to each CartItem in pages/pokemart.js
- [x] T042 [US4] Enforce quantity range 1-99 in quantity controls in pages/pokemart.js
- [x] T043 [US4] Auto-remove item from cart when quantity set to 0 in pages/pokemart.js
- [x] T044 [US4] Display line totals (price x quantity) for each cart item in pages/pokemart.js

**Checkpoint**: User Story 4 complete - cart management fully functional

---

## Phase 7: User Story 5 - Handle Network Errors (Priority: P3)

**Goal**: Players see helpful error messages with retry options on network failure

**Independent Test**: Simulate network error during purchase, verify error with retry button

### Implementation for User Story 5

- [x] T045 [US5] Add loading state for catalog fetch with spinner in pages/pokemart.js
- [x] T046 [US5] Implement error state display for failed catalog fetch in pages/pokemart.js
- [x] T047 [US5] Add retry button to reload catalog on fetch error in pages/pokemart.js
- [x] T048 [US5] Handle network errors in handlePurchase try/catch in pages/pokemart.js
- [x] T049 [US5] Show generic error modal with retry option for network failures in pages/pokemart.js
- [x] T050 [US5] Add retry button to error modal that re-attempts purchase in pages/pokemart.js

**Checkpoint**: User Story 5 complete - network errors handled with retry options

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final refinements across all user stories

- [x] T051 [P] Ensure consistent styling with other game pages (color scheme, fonts) in pages/pokemart.js
- [x] T052 [P] Add responsive layout (stacked on mobile, sidebar on desktop) in pages/pokemart.js
- [x] T053 Review accessibility (keyboard navigation, focus states) in pages/pokemart.js
- [x] T054 Prevent rapid Purchase clicks with purchasing state in pages/pokemart.js
- [x] T055 Manual test all user stories in sequence on localhost
- [x] T056 Verify page works in GameLayout navigation flow

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - verification only
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 (P1): Core purchase - no dependencies on other stories
  - US2 (P2): Category tabs - can run in parallel with US1
  - US3 (P2): Insufficient funds - depends on US1 purchase flow
  - US4 (P2): Cart management - depends on US1 cart structure
  - US5 (P3): Network errors - depends on US1 purchase flow
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1 - Purchase)**: Foundation only - MVP standalone
- **User Story 2 (P2 - Categories)**: Foundation only - can parallelize with US1
- **User Story 3 (P2 - Insufficient Funds)**: Requires US1 purchase flow complete
- **User Story 4 (P2 - Cart Management)**: Requires US1 cart structure complete
- **User Story 5 (P3 - Network Errors)**: Requires US1 purchase flow complete

### Within Each Phase

- Tasks in the same phase without [P] marker must be sequential
- Tasks with [P] marker can run in parallel

### Parallel Opportunities

- T002-T007 can all run in parallel (verification tasks)
- T051-T052 can run in parallel (different concerns)
- US1 and US2 can run in parallel (both only need foundation)
- Single file limits parallelization within user stories

---

## Parallel Example: Setup Verification

```bash
# All verification tasks can run in parallel:
Task: T002 "Verify GameLayout component"
Task: T003 "Verify CurrencyBadge component"
Task: T004 "Verify useGame hook"
Task: T005 "Verify apiFetch"
Task: T006 "Verify GET /api/shop"
Task: T007 "Verify POST /api/shop"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup verification
2. Complete Phase 2: Foundational (page structure)
3. Complete Phase 3: User Story 1 (purchase flow)
4. **STOP and VALIDATE**: Test basic purchase works end-to-end
5. This delivers core value - users can buy items!

### Incremental Delivery

1. Setup + Foundational -> Page loads with header and catalog
2. Add User Story 1 -> Basic purchase works (MVP!)
3. Add User Story 2 -> Category tabs for organization
4. Add User Story 3 -> Insufficient funds error handling
5. Add User Story 4 -> Full cart management
6. Add User Story 5 -> Network error handling
7. Polish -> Responsive design, accessibility

### Single File Strategy

Since all tasks target `pages/pokemart.js`:
- Work sequentially through user stories
- Each story adds functionality to the single file
- Commit after each checkpoint for safe rollback points

---

## Notes

- All implementation in single file: `pages/pokemart.js`
- Reuses existing components: GameLayout, CurrencyBadge
- Uses existing APIs: GET /api/shop, POST /api/shop
- No automated tests - manual browser testing only
- CSS-in-JS styling with `<style jsx>`
- GameContext provides currency via useGame() hook
- Cart uses Map<itemId, CartItem> for O(1) lookups
- Purchase sends individual API calls per cart item
