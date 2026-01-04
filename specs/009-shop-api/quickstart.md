# Quickstart: Shop API Endpoint

**Feature**: 009-shop-api
**Date**: 2026-01-04

## Prerequisites

1. Node.js 18+ installed
2. Supabase project configured with environment variables
3. Prior migrations (001-004) applied to database
4. At least one test user with currency (from battle rewards)

## Setup Steps

### 1. Apply Database Migration

Run the migration in Supabase SQL Editor:

1. Open your Supabase dashboard
2. Navigate to SQL Editor
3. Open `sql/005_player_inventory.sql`
4. Execute the migration

Verify by checking that the `player_inventory` table exists with RLS enabled.

### 2. Start Development Server

```bash
npm run dev
```

Server runs at `http://localhost:3000`

### 3. Get Test Auth Token

Use the existing test login endpoint:

```bash
curl -X POST http://localhost:3000/api/auth/test-login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User"}'
```

Save the returned token for subsequent requests.

## Testing the API

### View Item Catalog

```bash
curl http://localhost:3000/api/shop
```

Expected response includes purchasable items with costs.

### Check Current Balance and Inventory

```bash
curl http://localhost:3000/api/player/inventory \
  -H "Authorization: Bearer <your-token>"
```

Note your current `currency` value.

### Purchase Items

```bash
curl -X POST http://localhost:3000/api/shop \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"item_id": "poke-ball", "quantity": 2}'
```

Expected: Success with updated balance and inventory.

### Test Insufficient Funds

Try purchasing more than you can afford:

```bash
curl -X POST http://localhost:3000/api/shop \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"item_id": "ultra-ball", "quantity": 100}'
```

Expected: Error with `INSUFFICIENT_FUNDS` code and details.

### Test Invalid Item

```bash
curl -X POST http://localhost:3000/api/shop \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"item_id": "fake-item", "quantity": 1}'
```

Expected: Error with `ITEM_NOT_FOUND` code.

### Test Non-Purchasable Item

```bash
curl -X POST http://localhost:3000/api/shop \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"item_id": "master-ball", "quantity": 1}'
```

Expected: Error with `ITEM_NOT_PURCHASABLE` code.

## File Structure After Implementation

```
pages/
  api/
    shop.js                    # GET catalog, POST purchase
    player/
      inventory.js             # GET player inventory

lib/
  itemData.js                  # Item catalog utilities

sql/
  005_player_inventory.sql     # Database migration
```

## Verification Checklist

- [ ] GET /api/shop returns item catalog (no auth required)
- [ ] Catalog excludes items with null cost (e.g., Master Ball)
- [ ] POST /api/shop requires authentication
- [ ] Purchase deducts currency correctly
- [ ] Inventory quantity increments on repeat purchases
- [ ] INSUFFICIENT_FUNDS error includes required/available amounts
- [ ] GET /api/player/inventory returns owned items with quantities
- [ ] All responses follow { success, data, error } envelope

## Troubleshooting

### "Table player_inventory does not exist"

Run the migration in `sql/005_player_inventory.sql` in Supabase SQL Editor.

### "User has 0 currency"

Currency is awarded from battle victories. Either:
- Run a successful battle first (POST /api/battle)
- Manually update currency in Supabase: `UPDATE users SET currency = 1000 WHERE email = 'test@example.com'`

### "Unauthorized" on all requests

Check that your token is correctly formatted. The test auth uses base64-encoded JSON with `user_id` field.

### Items not appearing in catalog

Verify `Source/items/items.json` exists and is valid JSON. Items with `cost: null` are intentionally excluded.
