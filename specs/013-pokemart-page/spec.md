# Feature Specification: PokeMart Item Shop Page

**Feature Branch**: `013-pokemart-page`
**Created**: 2026-01-04
**Status**: Draft
**Input**: User description: "Implement the PokeMart page for purchasing items. This is a Next.js page at pages/pokemart.js that displays the item shop."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse and Purchase Items (Priority: P1)

As a player wanting to stock up on supplies, I want to browse the item catalog, add items to my cart, and complete a purchase so I can use items in battles and adventures.

**Why this priority**: This is the core functionality of the PokeMart - purchasing items is the primary reason players visit this location. Without purchasing capability, the page serves no purpose.

**Independent Test**: Can be fully tested by visiting the page, adding items to cart, and completing a successful purchase with sufficient funds.

**Acceptance Scenarios**:

1. **Given** I have sufficient currency, **When** I visit the PokeMart page, **Then** I see my current balance displayed prominently in the header
2. **Given** I am viewing the item catalog, **When** I select a category tab, **Then** I see only items from that category
3. **Given** I have selected an item, **When** I adjust the quantity and add to cart, **Then** the cart updates with the item and quantity
4. **Given** I have items in my cart, **When** I click "Purchase" with sufficient funds, **Then** the items are purchased, my balance updates, and I see a confirmation

---

### User Story 2 - View Item Catalog by Category (Priority: P2)

As a player, I want to browse items organized by category so I can easily find what I need without scrolling through a long list.

**Why this priority**: Organization and browsing is essential for usability but secondary to the actual purchase flow.

**Independent Test**: Can be tested by navigating between category tabs and verifying items are correctly grouped.

**Acceptance Scenarios**:

1. **Given** I visit the PokeMart, **When** the page loads, **Then** I see category tabs for Poke Balls, Medicine, Hold Items, and TMs
2. **Given** I am on any category tab, **When** I view items, **Then** each item shows name, description, price, and quantity selector
3. **Given** there are items with null cost (like Master Ball), **When** I view the catalog, **Then** those items are not displayed

---

### User Story 3 - Handle Insufficient Funds (Priority: P2)

As a player who doesn't have enough currency, I want clear feedback when I try to purchase items I cannot afford so I know how much more I need.

**Why this priority**: Error handling is essential for user experience and prevents confusion about failed purchases.

**Independent Test**: Can be tested by attempting to purchase items that exceed available balance.

**Acceptance Scenarios**:

1. **Given** my cart total exceeds my balance, **When** I click "Purchase", **Then** I see an error showing "You need X currency, but only have Y"
2. **Given** I see an insufficient funds error, **When** I dismiss it, **Then** my cart remains intact so I can adjust quantities

---

### User Story 4 - Cart Management (Priority: P2)

As a player shopping for multiple items, I want to see a running cart summary with totals so I can manage my purchases before checkout.

**Why this priority**: Cart functionality enables multi-item purchases which improves user experience.

**Independent Test**: Can be tested by adding/removing items and verifying cart totals update correctly.

**Acceptance Scenarios**:

1. **Given** I add an item to cart, **When** I view the cart summary, **Then** I see the item name, quantity, line total, and running total
2. **Given** I have items in cart, **When** I adjust quantity for an item, **Then** the cart total updates in real-time
3. **Given** I have items in cart, **When** I remove an item, **Then** it is removed from the cart and total recalculates

---

### User Story 5 - Handle Network Errors (Priority: P3)

As a player experiencing connectivity issues, I want to see helpful error messages with retry options so I can complete my purchase when connection is restored.

**Why this priority**: Edge case for reliability but not part of primary happy path.

**Independent Test**: Can be tested by simulating network failure during purchase.

**Acceptance Scenarios**:

1. **Given** a network error occurs during purchase, **When** the error is shown, **Then** I see a retry button
2. **Given** a network error occurs during catalog load, **When** I see the error, **Then** I can click to retry loading

---

### Edge Cases

- What happens when catalog fails to load? Show error message with retry option.
- What happens when item is no longer available during purchase? Show clear error message.
- What happens when user rapidly clicks "Purchase"? Button is disabled during purchase to prevent duplicate transactions.
- What happens with quantity of 0? Remove item from cart, or prevent 0 selection.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display the player's current currency balance prominently in the header
- **FR-002**: System MUST display category tabs: Poke Balls, Medicine, Hold Items, TMs
- **FR-003**: System MUST fetch and display purchasable items from the shop catalog on page load
- **FR-004**: System MUST group items by their type field (pokeball, medicine, holditem, tm)
- **FR-005**: System MUST exclude items with null cost from the catalog display
- **FR-006**: System MUST display each item with: name, icon/sprite, description, price with currency icon, and quantity selector
- **FR-007**: System MUST allow quantity selection from 1-99 for each item
- **FR-008**: System MUST display a shopping cart summary showing selected items, quantities, and running total
- **FR-009**: System MUST update cart totals in real-time as items are added, removed, or quantities changed
- **FR-010**: System MUST provide a "Purchase" button to complete the transaction
- **FR-011**: System MUST validate sufficient funds before processing purchase
- **FR-012**: System MUST display a confirmation modal after successful purchase showing items bought and new balance
- **FR-013**: System MUST display an insufficient funds error showing required amount vs available amount
- **FR-014**: System MUST update the displayed balance immediately after successful purchase
- **FR-015**: System MUST disable the Purchase button during transaction processing to prevent duplicates
- **FR-016**: System MUST display error message with retry option if network error occurs

### Key Entities

- **Item**: Purchasable item with id, name, description, type (category), cost, and icon/sprite reference
- **Cart Item**: Item in shopping cart with item reference, selected quantity, and calculated line total
- **Shopping Cart**: Collection of cart items with calculated grand total
- **Player Currency**: Player's current balance available for purchases
- **Transaction**: Purchase record with items bought, quantities, total cost, and timestamp

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view item catalog within 2 seconds of page load
- **SC-002**: Users can complete a purchase (browse, add to cart, checkout) within 30 seconds
- **SC-003**: Cart totals update instantly (under 100ms perceived) when quantities change
- **SC-004**: 100% of purchase attempts show clear success or failure feedback
- **SC-005**: Users with insufficient funds see specific shortage amount on first purchase attempt
- **SC-006**: Users can navigate between all 4 category tabs without page reload
- **SC-007**: Currency balance reflects accurate amount before and after each transaction

## Assumptions

- The shop catalog endpoint already exists and returns items with type, cost, and description fields
- The purchase endpoint already exists and handles funds validation and inventory updates
- Items with null cost are intentionally unpurchasable (e.g., Master Ball)
- Currency is a single denomination (no conversion needed)
- Users must be authenticated to access the PokeMart page
- Item prices are fixed (no dynamic pricing or discounts in initial scope)
- Cart state is session-only (not persisted across page refreshes)
- Purchases are for single items at a time via the API (cart purchases sent as individual transactions)
