# Research: PokeMart Item Shop Page

**Date**: 2026-01-04
**Feature**: 013-pokemart-page

## Summary

Research completed to determine technical patterns and existing infrastructure for implementing the PokeMart page. All necessary APIs and components exist.

---

## Research Tasks

### 1. Shop API Endpoint (GET /api/shop)

**Decision**: Use existing `/api/shop` endpoint for catalog browsing.

**Rationale**: The shop API already exists at `pages/api/shop.js` with full implementation:
- Returns all purchasable items with name, type, cost, description
- Filters out items with null cost automatically
- No authentication required for browsing

**Response Format**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "poke-ball",
        "name": "Poke Ball",
        "type": "pokeball",
        "cost": 250,
        "description": "..."
      }
    ],
    "count": 35
  }
}
```

**Alternatives Considered**: None - API already exists and meets requirements.

---

### 2. Purchase API Endpoint (POST /api/shop)

**Decision**: Use existing `/api/shop` POST endpoint for purchases.

**Rationale**: Endpoint handles:
- Authentication via Bearer token
- Funds validation with INSUFFICIENT_FUNDS error
- Inventory updates
- Returns detailed balance information

**Request Format**:
```json
{
  "item_id": "poke-ball",
  "quantity": 5
}
```

**Success Response**:
```json
{
  "success": true,
  "data": {
    "purchased": { "item_id": "...", "name": "...", "quantity": 5, "total_cost": 1250 },
    "inventory": { "item_id": "...", "quantity": 10 },
    "balance": { "previous": 5000, "spent": 1250, "remaining": 3750 }
  }
}
```

**Error Response (INSUFFICIENT_FUNDS)**:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "Not enough currency to complete purchase",
    "details": {
      "required": 1250,
      "available": 500,
      "item_id": "poke-ball",
      "item_name": "Poke Ball",
      "quantity": 5
    }
  }
}
```

---

### 3. Currency Display Pattern

**Decision**: Reuse CurrencyBadge component and GameContext.

**Rationale**: `components/layout/CurrencyBadge.js` already provides:
- Formatted display with commas for thousands
- Coin icon styling
- Pulse animation on value change
- Gold color (#fbbf24)

GameContext (`lib/gameContext.js`) provides:
- `currency` state from `/api/player/inventory`
- `refreshData()` to update after purchase

**Usage Pattern**:
```javascript
const { currency, refreshData } = useGame();
// After successful purchase:
await refreshData();
```

---

### 4. Modal/Dialog Pattern

**Decision**: Follow existing ConfirmationModal pattern.

**Rationale**: `components/starter/ConfirmationModal.js` provides established pattern:
- Fixed backdrop with semi-transparent overlay
- Centered content box
- Keyboard support (Escape to close)
- Click-outside-to-close
- Loading state handling
- Accessibility attributes (role="dialog", aria-modal, aria-labelledby)

**Implementation**: Create modals for:
- Purchase confirmation (success)
- Insufficient funds (error)

---

### 5. Page Structure Pattern

**Decision**: Follow existing game page pattern (pokecenter.js).

**Rationale**: All game pages use consistent structure:
- Outer export wrapped in GameLayout
- Inner `*Content` component for business logic
- Uses `apiFetch()` for authenticated requests
- styled-jsx for scoped styling
- Three states: loading, error, success

**Pattern**:
```javascript
function PokeMartContent() {
  const { currency, refreshData } = useGame();
  // ... component logic
}

export default function PokeMartPage() {
  return (
    <GameLayout>
      <PokeMartContent />
    </GameLayout>
  );
}
```

---

### 6. Item Data Structure

**Decision**: Items from Source/items/items.json via API.

**Rationale**: Following Two-Tier Data Model principle:
- Item reference data in Source files
- API merges and returns complete item objects
- Frontend doesn't access Source files directly

**Item Categories** (from type field):
- `pokeball` - Poke Balls (Poke Ball, Great Ball, Ultra Ball, etc.)
- `medicine` - Healing items (Potion, Super Potion, etc.)
- `holditem` - Hold items
- `tm` - Technical Machines

---

### 7. Cart State Management

**Decision**: Local component state (not persisted).

**Rationale**: Per spec assumptions, cart is session-only:
- Use React useState for cart items
- Calculate totals locally
- Clear on page refresh (acceptable for MVP)

**Cart Item Structure**:
```javascript
{
  item: { id, name, type, cost, description },
  quantity: number,
  lineTotal: number // item.cost * quantity
}
```

---

### 8. Purchase Flow

**Decision**: Individual API calls per cart item.

**Rationale**: Per spec assumptions, API handles single-item purchases:
- Loop through cart items
- Call POST /api/shop for each
- Aggregate results for confirmation
- Handle partial failures gracefully

**Flow**:
1. Validate total against available balance (client-side)
2. For each cart item: POST /api/shop
3. On success: aggregate purchased items
4. Call refreshData() once at end
5. Show confirmation modal with totals

---

## Technology Decisions

| Category | Decision | Rationale |
|----------|----------|-----------|
| Layout | GameLayout | Consistent with other game pages |
| State | GameContext + local cart | Currency from context, cart local |
| API Client | apiFetch() | Automatic auth handling |
| Currency Display | CurrencyBadge | Existing component |
| Modals | ConfirmationModal pattern | Established accessibility pattern |
| Styling | CSS-in-JS (styled-jsx) | Project standard |

---

## Files to Create/Modify

### Implement (pages/pokemart.js exists as stub)

Main PokeMart page with:
- Category tabs
- Item catalog grid
- Shopping cart sidebar
- Purchase flow with modals

### Components (inline in page file per project pattern)

- CategoryTabs - Tab navigation
- ItemCard - Single item display
- ShoppingCart - Cart summary sidebar
- PurchaseModal - Success confirmation
- InsufficientFundsModal - Error display

---

## Existing Files to Leverage

| File | Usage |
|------|-------|
| `components/layout/GameLayout.js` | Page wrapper |
| `components/layout/CurrencyBadge.js` | Currency display |
| `lib/gameContext.js` | Currency state, refreshData() |
| `lib/apiFetch.js` | Authenticated API calls |
| `pages/api/shop.js` | Existing shop API |
| `pages/api/player/inventory.js` | Currency balance |
| `components/starter/ConfirmationModal.js` | Modal pattern reference |

---

## All NEEDS CLARIFICATION Resolved

- Shop API format: Confirmed via code analysis
- Purchase API format: Confirmed via code analysis
- Item categories: pokeball, medicine, holditem, tm
- Currency display: CurrencyBadge component exists
- Modal pattern: ConfirmationModal provides template
- Cart persistence: Session-only per spec (not persisted)
