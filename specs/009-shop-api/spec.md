# Feature Specification: Shop API Endpoint

**Feature Branch**: `009-shop-api`
**Created**: 2026-01-04
**Status**: Draft
**Input**: User description: "Build the shop API endpoint where students can purchase items. Version 1 didn't implement items or inventory, but the pattern would follow the established API architecture. Create pages/api/shop.js that validates JWT, checks player resources, processes purchases."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Purchase Items (Priority: P1)

A student (player) browses available items in the shop and purchases consumable items such as Poke Balls, Potions, or Revives using their earned in-game currency. The system validates they have sufficient funds, deducts the cost, and adds items to their inventory.

**Why this priority**: This is the core functionality of the shop - without the ability to purchase items, the shop has no purpose. Students need consumables to catch Pokemon (balls) and heal them (potions/revives).

**Independent Test**: Can be fully tested by sending a POST request with player_id, item_id, and quantity. Delivers immediate value by enabling item acquisition.

**Acceptance Scenarios**:

1. **Given** a player with 1000 currency and an empty inventory, **When** they purchase 2 Poke Balls (250 each), **Then** 500 currency is deducted and 2 Poke Balls appear in their inventory
2. **Given** a player with existing items in inventory, **When** they purchase more of the same item, **Then** the quantity is incremented (not a new row)
3. **Given** a player with 100 currency, **When** they attempt to purchase an item costing 250, **Then** they receive a clear error stating insufficient funds with the required amount

---

### User Story 2 - View Available Items (Priority: P2)

A student can retrieve the catalog of items available for purchase, including their names, descriptions, types, and prices, so they can decide what to buy.

**Why this priority**: Before purchasing, players need to know what is available. This enables informed purchasing decisions.

**Independent Test**: Can be tested by sending a GET request to the shop endpoint and receiving a list of purchasable items with prices.

**Acceptance Scenarios**:

1. **Given** an authenticated request, **When** the catalog is requested, **Then** the full list of purchasable items is returned
2. **Given** items with null cost (e.g., Master Ball), **When** the catalog is returned, **Then** those items are excluded since they are not purchasable

---

### User Story 3 - View Current Inventory (Priority: P3)

A student can view their current inventory to see what items they own and in what quantities, helping them decide if they need to purchase more.

**Why this priority**: Inventory visibility helps players make informed purchasing decisions and is essential for downstream systems (using items in battle, catching, healing).

**Independent Test**: Can be tested by sending a GET request to the inventory endpoint to retrieve their items and quantities.

**Acceptance Scenarios**:

1. **Given** an authenticated player with items in inventory, **When** they request their inventory, **Then** they receive a list of items with quantities
2. **Given** an authenticated player with no items, **When** they request their inventory, **Then** they receive an empty list

---

### Edge Cases

- What happens when an item_id does not exist in the catalog? Return a validation error with "ITEM_NOT_FOUND"
- What happens when quantity is zero or negative? Return a validation error requiring positive quantity
- What happens when the purchase would result in exactly zero currency? Allow it - player can spend all their money
- What happens if the user has no inventory row yet? Create a new row on first purchase
- What happens when an item has null cost? Return error indicating item is not purchasable

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST authenticate all purchase requests via JWT before processing
- **FR-002**: System MUST validate that requested item_id exists in the Source items catalog
- **FR-003**: System MUST validate that the item is purchasable (cost is not null)
- **FR-004**: System MUST validate that quantity is a positive integer
- **FR-005**: System MUST check player's currency balance before allowing purchase
- **FR-006**: System MUST return error code "INSUFFICIENT_FUNDS" with required/available amounts when balance is too low
- **FR-007**: System MUST atomically deduct currency and add items to inventory
- **FR-008**: System MUST increment existing inventory quantity when purchasing items already owned
- **FR-009**: System MUST create new inventory record when purchasing items not yet owned
- **FR-010**: System MUST return the updated inventory and remaining balance after successful purchase
- **FR-011**: System MUST return the purchasable item catalog (items with non-null cost) on GET requests
- **FR-012**: System MUST follow the established API response format (success/error envelope)
- **FR-013**: System MUST support viewing player inventory with authentication

### Key Entities

- **Item Catalog**: Read-only data from Source/items/items.json containing id, name, type, cost, description
- **Player Inventory**: Tracks items owned by each player (user_id, item_id, quantity)
- **Player Currency**: Integer balance on the users table (already exists)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can complete a purchase flow in under 2 seconds (request to response)
- **SC-002**: 100% of insufficient funds errors include both required amount and available balance for N8N parsing
- **SC-003**: All purchase transactions are atomic - no partial updates on failure
- **SC-004**: Item catalog correctly reflects all purchasable items from Source data
- **SC-005**: Error responses follow established format with code, message, and parseable details

## Assumptions

- Currency system already exists on users table (confirmed in 004_battle_system.sql migration)
- Item catalog structure in Source/items/items.json is stable and matches expected schema (id, name, type, cost, description)
- Items with null cost (e.g., Master Ball) should never be purchasable through the shop
- The shop does not implement item selling (one-way purchase only for V1)
- No purchase limits per item or per transaction
- No discounts or pricing modifiers in V1
