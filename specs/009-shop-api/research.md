# Research: Shop API Endpoint

**Feature**: 009-shop-api
**Date**: 2026-01-04

## Research Summary

This feature follows established patterns from prior API endpoints. No major unknowns identified - decisions below document the approach.

---

## Decision 1: Item Catalog Loading Pattern

**Decision**: Create `lib/itemData.js` following the `lib/pokemonData.js` pattern with caching.

**Rationale**: The codebase already has a well-established pattern for loading Source JSON files with in-memory caching (see `getAllPokemon()`, `getMoveById()`, etc. in pokemonData.js:22-31). This pattern:
- Loads data once per serverless cold start
- Provides consistent access functions
- Follows Constitution IV (Data Merging Pattern)

**Alternatives Considered**:
- Inline loading in API route - Rejected because it duplicates code and misses caching
- Direct fs.readFileSync in each function - Rejected because no caching benefits

**Implementation**:
```javascript
// lib/itemData.js
let itemsCache = null;

export function getAllItems() {
  if (itemsCache) return itemsCache;
  const filePath = path.join(process.cwd(), 'Source', 'items', 'items.json');
  itemsCache = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return itemsCache;
}

export function getItemById(itemId) {
  return getAllItems().find(item => item.id === itemId) || null;
}

export function getPurchasableItems() {
  return getAllItems().filter(item => item.cost !== null);
}
```

---

## Decision 2: Migration Numbering

**Decision**: Use `005_player_inventory.sql` for the new migration.

**Rationale**: Existing migrations are numbered 000-004:
- `000_reset_database.sql`
- `001_create_users_table.sql`
- `002_create_player_pokemon.sql`
- `003_add_hp_fields.sql`
- `004_battle_system.sql`

Next available is 005.

---

## Decision 3: Atomic Purchase Transaction

**Decision**: Use sequential Supabase queries within a single API request. Check balance first, then deduct currency and upsert inventory in sequence.

**Rationale**: Supabase's client library does not support multi-statement transactions in serverless environments. However, the risk of race conditions is low for a single-player educational platform. If atomicity becomes critical, we could:
1. Use a PostgreSQL function/stored procedure
2. Implement optimistic concurrency with version checks

For V1, sequential queries are sufficient given the low-risk educational context.

**Alternatives Considered**:
- PostgreSQL stored procedure - Overkill for V1; adds complexity
- Supabase RPC with transaction - Would require custom function setup in Supabase

**Implementation Approach**:
1. Query user currency balance
2. Validate sufficient funds
3. Update user currency (deduct)
4. Upsert inventory row (increment quantity or insert)
5. Return updated state

---

## Decision 4: Inventory Table Design

**Decision**: Simple `player_inventory` table with `user_id`, `item_id`, `quantity` and a composite unique constraint.

**Rationale**:
- Matches the Two-Tier Data Model (Constitution I) - only store user-specific state
- `item_id` references Source items.json, not duplicated data
- Upsert pattern uses `ON CONFLICT (user_id, item_id) DO UPDATE SET quantity = quantity + $1`

**Schema**:
```sql
CREATE TABLE player_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);
```

---

## Decision 5: API Endpoint Structure

**Decision**:
- `GET /api/shop` - Returns purchasable item catalog (filtered to exclude null-cost items)
- `POST /api/shop` - Processes purchase (requires auth, item_id, quantity)
- `GET /api/player/inventory` - Returns player's owned items (requires auth)

**Rationale**:
- Follows RESTful patterns (GET for read, POST for action)
- Shop endpoint handles both catalog and purchase (common e-commerce pattern)
- Inventory is player-specific data, so it goes under `/api/player/` (follows `/api/player/pokemon` pattern)

**Alternatives Considered**:
- Separate `/api/shop/catalog` and `/api/shop/purchase` - More verbose, less RESTful
- Combined shop and inventory - Mixes concerns

---

## Decision 6: Error Response Format

**Decision**: Follow existing `lib/apiResponse.js` patterns with specific error codes for shop operations.

**New Error Codes**:
- `INSUFFICIENT_FUNDS` - Player lacks currency for purchase
- `ITEM_NOT_FOUND` - Requested item_id not in catalog
- `ITEM_NOT_PURCHASABLE` - Item exists but has null cost
- `INVALID_QUANTITY` - Quantity is not a positive integer

**Example Response**:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "Not enough currency to complete purchase",
    "details": {
      "required": 500,
      "available": 100,
      "item_name": "Poke Ball",
      "quantity": 2
    }
  }
}
```

---

## Decision 7: Merge Pattern for Inventory Response

**Decision**: Create `buildPlayerInventoryResponse()` function that merges inventory records with Source item data.

**Rationale**: Follows Constitution IV (Data Merging Pattern). Database stores minimal data (`item_id`, `quantity`), API response includes full item details (name, description, type, cost).

**Implementation**:
```javascript
export function buildPlayerInventoryResponse(dbRecords) {
  return dbRecords.map(record => {
    const item = getItemById(record.item_id);
    return {
      item_id: record.item_id,
      quantity: record.quantity,
      name: item?.name || 'Unknown Item',
      type: item?.type || 'unknown',
      description: item?.description || '',
      cost: item?.cost || null
    };
  });
}
```

---

## Open Questions Resolved

| Question | Resolution |
|----------|------------|
| Next migration number? | 005 (after 004_battle_system.sql) |
| Atomic transactions? | Sequential queries acceptable for V1 |
| Auth for catalog? | GET /api/shop does not require auth (browsing) |
| Auth for inventory? | GET /api/player/inventory requires auth |
| Item selling? | Not in scope for V1 (spec assumption) |
