# Implementation Prompts for Play Screens

**Source**: specs/010-play-screens-prd/spec.md
**Purpose**: Comprehensive prompts to use with `/speckit.specify` to create individual implementation specs for each UI screen
**Created**: 2026-01-04

---

## How to Use This Document

Copy the prompt for each screen and run it with the `/speckit.specify` command to generate an implementation-ready specification. These prompts are designed to be self-contained and include all requirements from the master PRD.

---

## Prompt 1: Combat Arena Page

```
Implement the Combat Arena page for Pokemon 5e battles. This is a Next.js page at pages/combat.js that displays a 10x10 chess-like battle grid.

GRID REQUIREMENTS:
- Display a 10x10 grid with columns labeled A-J (left to right) and rows numbered 1-10 (top to bottom)
- Player trainer appears on the left edge (column A, row 5)
- Opponent trainer appears on the right edge (column J, row 5)
- Player Pokemon can only be placed in rows 1-2 during battle setup
- Enemy Pokemon appear in rows 9-10
- Each grid square can contain one Pokemon, trainer, or be empty
- Use visual highlighting for valid movement squares and valid attack targets

BATTLE FLOW:
1. Battle starts via POST /api/battle/start - returns battle state with initiative order
2. During setup phase, player places their active Pokemon in rows 1-2
3. Turn-based combat using POST /api/battle with move_id and target position
4. Display turn order/initiative clearly (who acts next)
5. Show damage numbers and HP changes animated on the grid when attacks resolve
6. Display status effects (poison, burn, paralysis) as icons on Pokemon
7. When a Pokemon faints (HP = 0), show faint animation and remove from active play
8. For wild battles, show "Throw Poke Ball" option using POST /api/battle/catch

UI COMPONENTS NEEDED:
- BattleGrid component: 10x10 grid with coordinate labels
- GridSquare component: individual cell that can hold Pokemon/trainer sprite
- PokemonToken component: Pokemon sprite with HP bar and status icons
- MoveSelector component: list of available moves with name, type, power, PP
- BattleLog component: scrollable log of all actions and outcomes
- TurnIndicator component: shows current turn and initiative order
- BattleControls component: action buttons (Attack, Move, Use Item, Catch, Flee)

STATE MANAGEMENT:
- Store battle state from API response (combatants, positions, HP, status effects)
- Track selected Pokemon and selected move
- Track valid target squares based on move range
- Update state after each action resolves

ERROR HANDLING:
- If player has no active Pokemon, redirect to Pokemon management with error message
- If battle times out, show reconnection option or graceful failure
- If all player Pokemon faint, show defeat screen and redirect to Pokemon Center

API ENDPOINTS USED:
- POST /api/battle/start - Initialize battle
- POST /api/battle - Execute combat action (attack with move)
- POST /api/battle/catch - Attempt to catch wild Pokemon
- GET /api/player/pokemon - Get player's party for battle setup
```

---

## Prompt 2: PokeMart Shop Page

```
Implement the PokeMart page for purchasing items. This is a Next.js page at pages/pokemart.js that displays the item shop.

LAYOUT REQUIREMENTS:
- Header showing player's current currency balance prominently
- Item catalog organized by category tabs: Poke Balls, Medicine, Hold Items, TMs
- Each item displays: name, sprite/icon, description, price, quantity selector
- Shopping cart summary showing selected items and total cost
- Purchase button that validates funds and completes transaction

CATALOG DISPLAY:
- Fetch items from GET /api/shop on page load
- Group items by their "type" field (pokeball, medicine, tm, holditem)
- Exclude items with null cost (like Master Ball) - they are not purchasable
- Show item description on hover or in detail panel
- Display price with currency icon

PURCHASE FLOW:
1. Player browses catalog and selects items
2. Quantity selector allows 1-99 of each item
3. Cart shows running total as items are added
4. "Purchase" button sends POST /api/shop with item_id and quantity
5. On success: show confirmation with items purchased and new balance
6. On INSUFFICIENT_FUNDS error: show clear message with required vs available amounts
7. Update displayed balance immediately after purchase

UI COMPONENTS NEEDED:
- CurrencyDisplay component: shows current balance in header
- CategoryTabs component: tab navigation for item categories
- ItemCard component: displays single item with price, description, quantity selector
- ShoppingCart component: lists selected items with quantities and total
- PurchaseButton component: validates and submits purchase
- PurchaseConfirmation component: modal showing purchase success
- InsufficientFundsError component: modal showing shortfall amount

STATE MANAGEMENT:
- Fetch and cache item catalog from API
- Track items in cart with quantities
- Calculate total cost in real-time
- Update balance after successful purchase

ERROR HANDLING:
- INSUFFICIENT_FUNDS: Show modal with "You need X currency, but only have Y"
- Network error: Show retry option
- Invalid item: Should not happen if catalog is from API

API ENDPOINTS USED:
- GET /api/shop - Fetch purchasable item catalog
- POST /api/shop - Purchase items (body: {item_id, quantity})
- GET /api/player/inventory - Optionally show current inventory count
```

---

## Prompt 3: Pokemon Center Page

```
Implement the Pokemon Center page for healing Pokemon. This is a Next.js page at pages/pokecenter.js that displays the party and healing interface.

LAYOUT REQUIREMENTS:
- Welcome message from Nurse Joy (thematic flavor)
- Display all active party Pokemon (up to 6) in a row or grid
- Each Pokemon shows: sprite, name, current HP / max HP, HP bar (color-coded)
- Show PP status for each Pokemon's moves (optional detail view)
- Large "Heal All" button centered below party display
- Success message area for healing confirmation

PARTY DISPLAY:
- Fetch party from GET /api/player/pokemon on page load
- Filter to show only is_active = true Pokemon
- For each Pokemon show:
  - Pokemon sprite image from /images/pokemon/{number}.png
  - Name and level
  - HP bar: green (>50%), yellow (25-50%), red (<25%)
  - Current HP / Max HP as text
- Clicking a Pokemon could show move details with PP status

HEAL FUNCTIONALITY:
1. "Heal All" button calls POST /api/heal
2. While healing: show loading state with animation (optional healing sparkle)
3. On success:
   - Update all Pokemon HP to max_hp
   - Update all move PP to maximum
   - Show success message "Your Pokemon have been healed!"
   - Animate HP bars filling up
4. If all Pokemon already at full HP:
   - Disable "Heal All" button
   - Show message "Your Pokemon are already healthy!"

UI COMPONENTS NEEDED:
- PartyDisplay component: grid/row of Pokemon cards
- PokemonHealthCard component: single Pokemon with sprite, HP bar, stats
- HPBar component: color-coded progress bar for health
- HealButton component: large action button with disabled state
- HealingAnimation component: visual feedback during heal
- SuccessMessage component: confirmation after healing

STATE MANAGEMENT:
- Fetch party Pokemon on mount
- Track healing in progress state
- Update Pokemon HP/PP after heal completes
- Derive "needs healing" state from party data

EDGE CASES:
- Empty party: Show message "You have no Pokemon! Select a starter first."
- All healthy: Disable heal button, show "already healthy" message
- Network error during heal: Show error with retry option

API ENDPOINTS USED:
- GET /api/player/pokemon - Fetch player's Pokemon party
- POST /api/heal - Heal all active party Pokemon (restores HP and PP)
```

---

## Prompt 4: Wild Pokemon Encounter Page

```
Implement the Wild Pokemon encounter page. This is a Next.js page at pages/wild.js that lets players find and encounter wild Pokemon.

LAYOUT REQUIREMENTS:
- Map or list of available encounter locations/routes
- Selected location shows: area description, typical Pokemon, level range
- "Search for Pokemon" button to trigger random encounter
- Encounter display showing wild Pokemon that appears
- Action buttons: "Battle" and "Flee"

LOCATION SELECTION:
- Display available areas (Route 1, Viridian Forest, Mt. Moon, etc.)
- Each location shows:
  - Area name and image/icon
  - List of Pokemon species that can be found there
  - Level range (e.g., "Levels 2-5")
- Selecting a location highlights it and enables search button

Note: Location data may need to be defined in Source/locations.json or hardcoded initially. For MVP, use 3-5 simple routes with different Pokemon pools.

ENCOUNTER FLOW:
1. Player selects a location
2. Player clicks "Search for Pokemon"
3. Generate encounter via POST /api/battle/start with encounter_type: "wild"
4. Display the wild Pokemon that appears:
   - Pokemon sprite/image
   - Name, Level, Type(s)
   - Optional: silhouette until battle starts for mystery
5. Player chooses "Battle" or "Flee"
6. "Battle" navigates to Combat Arena page with this opponent
7. "Flee" returns to location selection

UI COMPONENTS NEEDED:
- LocationSelector component: grid/list of available areas
- LocationCard component: single location with name, Pokemon preview, levels
- SearchButton component: triggers encounter generation
- WildEncounter component: displays encountered Pokemon
- EncounterActions component: Battle and Flee buttons
- PokemonReveal component: animated reveal of wild Pokemon

STATE MANAGEMENT:
- Track selected location
- Track current encounter (null or Pokemon data)
- Store encounter data to pass to Combat Arena

NAVIGATION:
- "Battle" should navigate to /combat with state containing:
  - opponent Pokemon data
  - battle_id from /api/battle/start response
- "Flee" clears encounter and returns to location selection

ERROR HANDLING:
- No Pokemon in party: Show error, redirect to starter selection
- Encounter generation fails: Show retry option
- All party Pokemon fainted: Redirect to Pokemon Center

API ENDPOINTS USED:
- POST /api/battle/start - Start wild encounter (returns wild Pokemon and battle state)
- Navigation to /combat page for actual battle
```

---

## Prompt 5: Player Inventory Page

```
Implement the Player Inventory page. This is a Next.js page at pages/inventory.js that displays owned items.

LAYOUT REQUIREMENTS:
- Header showing "Your Inventory" with item count
- Items organized by category: Poke Balls, Medicine, Hold Items, TMs, Key Items
- Each item shows: icon/sprite, name, quantity owned, brief description
- Empty state message when no items owned

INVENTORY DISPLAY:
- Fetch inventory from GET /api/player/inventory on page load
- Group items by their "type" field from Source data
- For each item show:
  - Item icon (from Source or placeholder)
  - Item name
  - Quantity badge (e.g., "x5")
  - Description on hover or expand
- Sort items within category alphabetically or by usefulness

CATEGORY ORGANIZATION:
- Poke Balls: All capture devices
- Medicine: Potions, status healers, revives
- Hold Items: Items Pokemon can hold in battle
- TMs: Technical Machines for teaching moves
- Key Items: Special non-consumable items (if any)

UI COMPONENTS NEEDED:
- InventoryHeader component: title and total item count
- CategorySection component: collapsible section for each item type
- InventoryItem component: single item with icon, name, quantity
- ItemDetail component: expanded view with full description
- EmptyInventory component: message when no items owned

EMPTY STATE:
- If inventory is empty, show friendly message:
  "Your bag is empty! Visit the PokeMart to stock up on supplies."
- Include link/button to navigate to /pokemart

STATE MANAGEMENT:
- Fetch inventory on mount
- Merge with Source item data for full details (name, description, type)
- Group items by category for display

OPTIONAL FEATURES:
- Click item to see full description
- Show "Use" button for usable items (future feature)
- Filter/search items (if inventory grows large)

API ENDPOINTS USED:
- GET /api/player/inventory - Fetch player's owned items with quantities
```

---

## Prompt 6: Main Navigation/Layout Component

```
Implement the main navigation layout for all play screens. This is a layout component used across all game pages.

LAYOUT STRUCTURE:
- Top navigation bar with:
  - Game logo/title
  - Currency balance display
  - Player name/avatar
- Left sidebar with:
  - Navigation links to all pages (Combat, PokeMart, Pokemon Center, Wild, Inventory)
  - Mini party display showing active Pokemon with HP bars
- Main content area for page-specific content
- Optional: Footer with help/settings links

NAVIGATION LINKS:
- Combat Arena (/combat) - sword/battle icon
- PokeMart (/pokemart) - shop/cart icon
- Pokemon Center (/pokecenter) - healing/heart icon
- Wild Pokemon (/wild) - grass/nature icon
- Inventory (/inventory) - bag/backpack icon
- Dashboard (/dashboard) - home icon

PERSISTENT DISPLAYS:
- Currency: Always show current balance, update after purchases
- Party: Show up to 6 Pokemon mini cards with HP status
  - Clicking Pokemon could navigate to Pokemon Center
  - Visual indicator for injured Pokemon (low HP)

UI COMPONENTS NEEDED:
- GameLayout component: wraps all pages
- TopNav component: logo, currency, player info
- SideNav component: navigation links with icons
- MiniPartyDisplay component: compact view of party Pokemon
- CurrencyBadge component: shows balance with update animation
- NavLink component: individual navigation item with active state

STATE MANAGEMENT:
- Fetch player data (currency, party) at layout level
- Share state down to child pages via context or props
- Update currency/party when actions occur (purchase, heal, catch)

RESPONSIVE BEHAVIOR (FUTURE):
- Desktop: sidebar always visible
- Tablet: collapsible sidebar
- Mobile: bottom navigation bar (not in initial scope)

API ENDPOINTS USED:
- GET /api/player/pokemon - For mini party display
- Currency comes from user data (already in auth context or fetched with inventory)
```

---

## Implementation Order Recommendation

| Order | Screen | Branch Name | Complexity | Dependencies |
|-------|--------|-------------|------------|--------------|
| 1 | Navigation Layout | ui-game-layout | Medium | None |
| 2 | Pokemon Center | ui-pokecenter | Low | Layout |
| 3 | Inventory | ui-inventory | Low | Layout |
| 4 | PokeMart | ui-pokemart | Medium | Layout, Inventory |
| 5 | Wild Pokemon | ui-wild-encounters | Medium | Layout |
| 6 | Combat Arena | ui-combat-arena | High | Layout, Wild Pokemon |

**Rationale**: Start with simpler screens to establish patterns, then build to the complex Combat Arena. The Navigation Layout should be first as all pages depend on it.

---

## Notes

- All prompts assume the backend API endpoints are already implemented and functional
- Each prompt is self-contained and can be run independently with `/speckit.specify`
- The prompts focus on WHAT to build, not HOW - implementation details will be determined during planning phase
- Consider creating a shared components library for reusable UI elements across screens
