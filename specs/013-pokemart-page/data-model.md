# Data Model: PokeMart Item Shop Page

**Date**: 2026-01-04
**Feature**: 013-pokemart-page

## Overview

The PokeMart page is a frontend feature that leverages existing database tables and API endpoints. No new database entities are required.

---

## Existing Entities Used

### 1. Item (Source Data)

**File**: `Source/items/items.json`

| Field | Type | Description |
|-------|------|-------------|
| id | STRING | Unique item identifier (e.g., "poke-ball") |
| name | STRING | Display name (e.g., "Poke Ball") |
| type | STRING | Category: pokeball, medicine, holditem, tm |
| cost | NUMBER/NULL | Purchase price in currency (null = not purchasable) |
| description | STRING | Item description text |

**Category Values**:
- `pokeball` - Poke Balls for capturing Pokemon
- `medicine` - Healing items (Potions, Antidotes, etc.)
- `holditem` - Items Pokemon can hold
- `tm` - Technical Machines for teaching moves

---

### 2. Player Inventory (Database)

**Table**: `player_inventory`

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users table |
| item_id | TEXT | Reference to Source item ID |
| quantity | INTEGER | Number of items owned (>= 1) |
| created_at | TIMESTAMPTZ | When first acquired |
| updated_at | TIMESTAMPTZ | Last modified timestamp |

**Constraints**:
- quantity >= 1
- Unique constraint on (user_id, item_id)

**RLS Policy**: `user_id = auth.uid()`

---

### 3. Users (Database)

**Table**: `users`

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| currency | INTEGER | Player's currency balance (default: 0) |
| email | TEXT | Player email (from JWT) |
| name | TEXT | Player display name |

**Constraints**:
- currency >= 0

---

## Frontend State Models

### Shop Item (API Response)

Merged response from Source data:

```typescript
interface ShopItem {
  id: string;           // e.g., "poke-ball"
  name: string;         // e.g., "Poke Ball"
  type: string;         // e.g., "pokeball"
  cost: number;         // e.g., 250 (null items excluded)
  description: string;  // Item description
}
```

### Cart Item (Frontend State)

```typescript
interface CartItem {
  item: ShopItem;       // Reference to shop item
  quantity: number;     // Selected quantity (1-99)
  lineTotal: number;    // item.cost * quantity
}
```

### Shopping Cart (Frontend State)

```typescript
interface ShoppingCart {
  items: Map<string, CartItem>;  // Keyed by item.id
  totalItems: number;            // Sum of all quantities
  totalCost: number;             // Sum of all line totals
}
```

### Purchase Result

```typescript
interface PurchaseResult {
  purchased: {
    item_id: string;
    name: string;
    quantity: number;
    total_cost: number;
  };
  inventory: {
    item_id: string;
    name: string;
    quantity: number;  // New total after purchase
  };
  balance: {
    previous: number;
    spent: number;
    remaining: number;
  };
}
```

### Insufficient Funds Error

```typescript
interface InsufficientFundsError {
  code: "INSUFFICIENT_FUNDS";
  message: string;
  details: {
    required: number;
    available: number;
    item_id: string;
    item_name: string;
    quantity: number;
  };
}
```

---

## State Transitions

### Cart Management

```
[Empty Cart] --add item--> [Has Items] --remove all--> [Empty Cart]
     ^                          |
     |                          v
     +--------<--clear----------+
```

**Cart Operations**:
- **Add Item**: Insert or increment quantity in cart map
- **Update Quantity**: Change quantity for existing item
- **Remove Item**: Delete from cart map
- **Clear Cart**: Reset to empty state

### Purchase Flow

```
[Cart Ready] --validate--> [Validating] --pass--> [Processing]
                               |                       |
                               v                       v
                          [Error Modal]         [Success Modal]
                               |                       |
                               v                       v
                          [Cart Ready]           [Cart Cleared]
```

**Purchase States**:
- **Cart Ready**: Items in cart, Purchase button enabled
- **Validating**: Checking funds (client-side)
- **Processing**: API calls in progress
- **Success Modal**: Purchase confirmed, showing results
- **Error Modal**: INSUFFICIENT_FUNDS or network error

---

## Derived State (Frontend)

### Can Purchase Check

```javascript
const canPurchase = cart.items.size > 0 && cart.totalCost <= currency;
```

### Category Filter

```javascript
const filteredItems = items.filter(item =>
  item.type === selectedCategory && item.cost !== null
);
```

### Cart Total Calculation

```javascript
const totalCost = Array.from(cart.items.values())
  .reduce((sum, cartItem) => sum + cartItem.lineTotal, 0);
```

---

## Validation Rules

| Rule | Entity | Description |
|------|--------|-------------|
| VR-001 | Quantity | Must be 1-99 |
| VR-002 | Cost | Only items with non-null cost purchasable |
| VR-003 | Funds | totalCost <= currency for purchase |
| VR-004 | Item | item_id must exist in catalog |

---

## No New Database Changes Required

The PokeMart page operates entirely on existing:
- `Source/items/items.json` (item reference data)
- `player_inventory` table (user's inventory)
- `users` table (currency balance)
- GET `/api/shop` endpoint (catalog)
- POST `/api/shop` endpoint (purchase)
- GET `/api/player/inventory` endpoint (balance check)
