# Feature Specification: Play Screens UI - Master PRD

**Feature Branch**: `010-play-screens-prd`
**Created**: 2026-01-04
**Status**: Draft
**Input**: User description: "Master PRD for play screens UI to interact with existing combat, Pokemon Center (healing), and PokeMart (shop) endpoints. Combat uses a 10x10 chess-like grid with trainers on outside and Pokemon starting in first two rows."

## Overview

This PRD defines the user interface requirements for interactive play screens that allow students to engage with the Pokemon 5e game system through a web-based interface. The UI will consume the existing backend API endpoints for combat, healing, wild Pokemon encounters, and item purchasing.

### Existing API Endpoints (Backend)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/battle/start | POST | Start a new battle encounter |
| /api/battle | POST | Execute combat actions (attack, use move) |
| /api/battle/catch | POST | Attempt to catch a wild Pokemon |
| /api/heal | POST | Heal all active party Pokemon |
| /api/shop | GET | Get purchasable item catalog |
| /api/shop | POST | Purchase items |
| /api/player/inventory | GET | View owned items |
| /api/player/pokemon | GET | View player's Pokemon roster |
| /api/player/stats | GET | View player statistics |

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Combat Arena with Grid Movement (Priority: P1)

A student enters the Combat Arena page to battle wild Pokemon or NPC trainers. They see a 10x10 chess-like grid with lettered columns (A-J) and numbered rows (1-10). The player's trainer appears on one edge of the grid, and they can position their Pokemon anywhere in the first two rows. During combat, they can select moves, see damage calculations, and watch the battle unfold turn by turn.

**Why this priority**: Combat is the core gameplay loop. Without a visual combat interface, students cannot experience the Pokemon 5e battle system through the UI.

**Independent Test**: Can be fully tested by navigating to the combat page, starting a battle, positioning Pokemon, and executing moves. Delivers the complete battle experience.

**Acceptance Scenarios**:

1. **Given** a player on the Combat Arena page, **When** they click "Start Battle", **Then** a 10x10 grid appears with their trainer on the left edge and the opponent on the right edge
2. **Given** the grid is displayed, **When** the player views the grid, **Then** columns are labeled A-J (left to right) and rows are numbered 1-10 (top to bottom)
3. **Given** battle initialization, **When** the player places their Pokemon, **Then** they can only place in rows 1-2 (their starting zone)
4. **Given** it is the player's turn, **When** they click on their Pokemon, **Then** they see available moves with PP remaining and can select one to execute
5. **Given** a move is selected, **When** targeting is required, **Then** valid target squares are highlighted on the grid
6. **Given** damage is dealt, **When** the attack resolves, **Then** the grid shows damage numbers, HP changes, and status effects

---

### User Story 2 - PokeMart Shop Page (Priority: P2)

A student visits the PokeMart page to browse available items and purchase consumables using their in-game currency. They see their current balance, a catalog of items organized by category (Poke Balls, Potions, Status Healers), and can add items to their cart and complete purchases.

**Why this priority**: Players need items to catch Pokemon (balls) and heal during adventures (potions). The shop enables the resource management gameplay loop.

**Independent Test**: Can be tested by navigating to the PokeMart page, viewing the catalog, adding items to cart, and completing a purchase.

**Acceptance Scenarios**:

1. **Given** a player on the PokeMart page, **When** the page loads, **Then** they see their current currency balance prominently displayed
2. **Given** the catalog is displayed, **When** viewing items, **Then** items are grouped by category (Poke Balls, Medicine, Hold Items)
3. **Given** an item in the catalog, **When** the player views it, **Then** they see name, description, price, and a quantity selector
4. **Given** a player selects items, **When** they click "Purchase", **Then** their currency is deducted and items appear in inventory
5. **Given** insufficient funds, **When** attempting purchase, **Then** a clear message shows required amount vs available balance
6. **Given** a successful purchase, **When** the transaction completes, **Then** a confirmation shows items purchased and remaining balance

---

### User Story 3 - Pokemon Center Healing Page (Priority: P3)

A student visits the Pokemon Center page to heal their party after battles. They see their active party Pokemon with current HP displayed, and can heal all Pokemon with one action.

**Why this priority**: Healing is essential between battles but is a simpler interaction than combat or shopping.

**Independent Test**: Can be tested by navigating to Pokemon Center with injured Pokemon and clicking heal.

**Acceptance Scenarios**:

1. **Given** a player on the Pokemon Center page, **When** the page loads, **Then** they see all active party Pokemon with current HP / max HP displayed
2. **Given** Pokemon are displayed, **When** any Pokemon has less than full HP, **Then** the "Heal All" button is enabled
3. **Given** the player clicks "Heal All", **When** healing completes, **Then** all Pokemon show full HP and a success message appears
4. **Given** all Pokemon are already at full HP, **When** viewing the page, **Then** the "Heal All" button is disabled with a message "Your Pokemon are already healthy!"
5. **Given** healing is triggered, **When** viewing each Pokemon, **Then** PP for all moves is also restored to maximum

---

### User Story 4 - Wild Pokemon Encounter Page (Priority: P4)

A student visits the Wild Pokemon page to find and encounter wild Pokemon in different areas. They can select a location, trigger an encounter, and choose to battle or flee.

**Why this priority**: Wild encounters provide Pokemon catching opportunities but require combat to function fully.

**Independent Test**: Can be tested by selecting a location and generating a wild encounter.

**Acceptance Scenarios**:

1. **Given** a player on the Wild Pokemon page, **When** the page loads, **Then** they see a list of available locations/routes
2. **Given** locations are displayed, **When** the player selects a location, **Then** they see typical Pokemon found there and level ranges
3. **Given** a location is selected, **When** the player clicks "Search for Pokemon", **Then** a random wild Pokemon encounter is generated
4. **Given** a wild Pokemon appears, **When** viewing the encounter, **Then** they see the Pokemon's name, level, type, and silhouette/image
5. **Given** an encounter is active, **When** the player chooses "Battle", **Then** they are taken to the Combat Arena with this Pokemon as opponent

---

### User Story 5 - Player Inventory Page (Priority: P5)

A student views their inventory to see all owned items, organized by category, with quantities displayed.

**Why this priority**: Supporting page for shop and combat; needed to verify purchases and plan item usage.

**Independent Test**: Can be tested by navigating to inventory after making purchases.

**Acceptance Scenarios**:

1. **Given** a player on the Inventory page, **When** the page loads, **Then** they see all owned items with quantities
2. **Given** items are displayed, **When** viewing the list, **Then** items are grouped by type (Poke Balls, Medicine, etc.)
3. **Given** an empty inventory, **When** viewing the page, **Then** a message indicates "No items - visit the PokeMart to buy supplies"

---

### Edge Cases

- What happens when a player tries to start combat with no active Pokemon? Display error message and redirect to Pokemon management
- What happens when a player tries to buy items with zero currency? Show "Insufficient funds" with link to earn currency through battles
- What happens when all party Pokemon faint during combat? Battle ends in defeat, redirect to Pokemon Center with prompt to heal
- What happens when the player's internet connection drops during combat? Save battle state and allow resume, or gracefully handle timeout
- What happens when a player tries to catch a Pokemon with no Poke Balls? Show error message with link to PokeMart
- What happens when the grid position is already occupied? Prevent placement and show visual indicator of blocked squares

---

## Requirements *(mandatory)*

### Combat Arena Requirements

- **FR-001**: System MUST display a 10x10 grid with columns labeled A-J and rows numbered 1-10
- **FR-002**: System MUST position the player's trainer on the left edge (column A) of the grid
- **FR-003**: System MUST position the opponent trainer on the right edge (column J) of the grid
- **FR-004**: System MUST allow player Pokemon to be placed only in rows 1-2 during battle setup
- **FR-005**: System MUST display each Pokemon on the grid with visible HP bar and status icons
- **FR-006**: System MUST highlight valid movement squares when a Pokemon is selected
- **FR-007**: System MUST highlight valid target squares when a move is selected
- **FR-008**: System MUST display move options with name, type, power, accuracy, and current PP
- **FR-009**: System MUST show damage numbers and HP changes animated on the grid
- **FR-010**: System MUST display turn order/initiative clearly
- **FR-011**: System MUST show battle log with action history
- **FR-012**: System MUST indicate when a Pokemon faints and remove from active play
- **FR-013**: System MUST show catch option for wild Pokemon encounters

### PokeMart Requirements

- **FR-014**: System MUST display player's current currency balance
- **FR-015**: System MUST display item catalog organized by category
- **FR-016**: System MUST show item name, description, type, and price for each item
- **FR-017**: System MUST provide quantity selector (1-99) for each item
- **FR-018**: System MUST calculate and display total cost before purchase
- **FR-019**: System MUST validate sufficient funds before completing purchase
- **FR-020**: System MUST show clear error message when funds are insufficient
- **FR-021**: System MUST update balance and inventory immediately after purchase
- **FR-022**: System MUST exclude non-purchasable items (null cost) from catalog

### Pokemon Center Requirements

- **FR-023**: System MUST display all active party Pokemon with name, sprite, and HP status
- **FR-024**: System MUST show current HP / max HP for each Pokemon
- **FR-025**: System MUST show PP status for each Pokemon's moves
- **FR-026**: System MUST provide "Heal All" button to restore party
- **FR-027**: System MUST restore both HP and PP when healing
- **FR-028**: System MUST display success confirmation after healing
- **FR-029**: System MUST disable healing when all Pokemon are at full health

### Wild Pokemon Requirements

- **FR-030**: System MUST display available encounter locations
- **FR-031**: System MUST show Pokemon species available in each location
- **FR-032**: System MUST generate random wild Pokemon when encounter is triggered
- **FR-033**: System MUST display wild Pokemon details (name, level, type)
- **FR-034**: System MUST provide options to Battle or Flee from encounter
- **FR-035**: System MUST transition to Combat Arena when Battle is chosen

### Navigation Requirements

- **FR-036**: System MUST provide clear navigation between all play screens
- **FR-037**: System MUST show player's current Pokemon party in a persistent sidebar
- **FR-038**: System MUST display currency balance in header/navigation
- **FR-039**: System MUST indicate active quests or objectives if applicable

---

### Key Entities

- **Battle Grid**: 10x10 coordinate system (A-J x 1-10) representing the combat arena
- **Grid Square**: Single cell that can contain one Pokemon, trainer, or terrain feature
- **Turn Order**: Sequence of combatants based on initiative determining action order
- **Battle Log**: Chronological record of all actions and outcomes during combat
- **Item Cart**: Temporary collection of items selected for purchase before checkout
- **Party Display**: Visual representation of player's active Pokemon team

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can complete a full combat encounter (start, attack, win/lose) in under 5 minutes
- **SC-002**: 90% of players successfully make their first purchase without errors
- **SC-003**: Grid coordinate system is understood by 95% of players on first use (can correctly identify square A1, J10, etc.)
- **SC-004**: Players can heal their entire party in under 10 seconds
- **SC-005**: Wild Pokemon encounters load and display in under 2 seconds
- **SC-006**: 85% of combat actions are completed without needing to read help documentation
- **SC-007**: Item purchase flow requires no more than 3 clicks from catalog to confirmation
- **SC-008**: Battle log captures 100% of combat actions for educational review
- **SC-009**: Page transitions between play screens complete in under 1 second

---

## Assumptions

- All backend API endpoints are functional and available (battle, heal, shop, inventory)
- Players have already completed initial authentication and Pokemon selection
- Players have basic familiarity with Pokemon concepts (types, moves, HP)
- Grid-based combat follows Pokemon 5e tabletop rules for movement and range
- Mobile responsiveness is not required for initial release (desktop-first)
- Sound effects and music are not in scope for initial release
- Real-time multiplayer battles are not in scope (single player vs NPC/wild only)
- The grid uses standard chess notation for educational value (letters + numbers)
- Trainers cannot move during combat (only Pokemon move on the grid)

---

## Appendix: Grid Visualization Reference

```
    A   B   C   D   E   F   G   H   I   J
  +---+---+---+---+---+---+---+---+---+---+
1 |P1 |   |   |   |   |   |   |   |   |   |  <- Player Pokemon Zone (Rows 1-2)
  +---+---+---+---+---+---+---+---+---+---+
2 |P2 |P3 |   |   |   |   |   |   |   |   |
  +---+---+---+---+---+---+---+---+---+---+
3 |   |   |   |   |   |   |   |   |   |   |
  +---+---+---+---+---+---+---+---+---+---+
4 |   |   |   |   |   |   |   |   |   |   |
  +---+---+---+---+---+---+---+---+---+---+
5 |[T]|   |   |   |   |   |   |   |   |[O]|  <- Trainers on edges
  +---+---+---+---+---+---+---+---+---+---+
6 |   |   |   |   |   |   |   |   |   |   |
  +---+---+---+---+---+---+---+---+---+---+
7 |   |   |   |   |   |   |   |   |   |   |
  +---+---+---+---+---+---+---+---+---+---+
8 |   |   |   |   |   |   |   |   |   |   |
  +---+---+---+---+---+---+---+---+---+---+
9 |   |   |   |   |   |   |   |   |E2 |E1 |  <- Opponent Pokemon Zone (Rows 9-10)
  +---+---+---+---+---+---+---+---+---+---+
10|   |   |   |   |   |   |   |   |E3 |   |
  +---+---+---+---+---+---+---+---+---+---+

Legend:
[T] = Player Trainer (Column A, Row 5)
[O] = Opponent Trainer (Column J, Row 5)
P1, P2, P3 = Player Pokemon (Rows 1-2)
E1, E2, E3 = Enemy Pokemon (Rows 9-10)
```

---

## Page Structure Summary

| Page | Primary Actions | API Endpoints Used |
|------|----------------|-------------------|
| Combat Arena | Battle, Move, Catch | /api/battle/start, /api/battle, /api/battle/catch |
| PokeMart | Browse, Buy | /api/shop (GET), /api/shop (POST) |
| Pokemon Center | View Party, Heal | /api/player/pokemon, /api/heal |
| Wild Pokemon | Explore, Encounter | /api/battle/start |
| Inventory | View Items | /api/player/inventory |
