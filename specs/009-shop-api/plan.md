# Implementation Plan: Shop API Endpoint

**Branch**: `009-shop-api` | **Date**: 2026-01-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-shop-api/spec.md`

## Summary

Build a shop API endpoint (`pages/api/shop.js`) that allows authenticated players to purchase items using their in-game currency. The endpoint validates JWT authentication, checks currency balance, processes purchases atomically, and manages a new `player_inventory` table. Follows established patterns from heal.js and battle.js endpoints.

## Technical Context

**Language/Version**: JavaScript (ES2020+) with Node.js 18+
**Primary Dependencies**: Next.js 14, @supabase/supabase-js, existing lib/pokemonData.js utilities
**Storage**: Supabase PostgreSQL with RLS (users table for currency, new player_inventory table)
**Testing**: Manual API testing via curl/Postman, N8N workflow integration testing
**Target Platform**: Vercel serverless (Next.js API routes)
**Project Type**: Web application (Next.js)
**Performance Goals**: Purchase flow completes in under 2 seconds
**Constraints**: 10 second API route timeout, stateless request handling
**Scale/Scope**: Single-player educational platform, existing user base from prior features

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Check (Phase 0)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Two-Tier Data Model | Pass | Items loaded from Source/items/items.json; only user inventory (item_id, quantity) stored in database |
| II. External JWT Authentication | Pass | Uses existing authenticateRequest() from lib/authHelper.js |
| III. Row-Level Security | Pass | New player_inventory table will have RLS with user_id = auth.uid() policies |
| IV. Data Merging Pattern | Pass | Will create itemData.js utilities following pokemonData.js patterns |
| V. Serverless Architecture | Pass | Standard Next.js API route in pages/api/shop.js |
| VI. Pokemon 5e Compliance | Pass | Item costs and effects from Source/items/items.json |
| VII. Educational API Design | Pass | Follows { success, data, error } envelope; includes remaining balance in response |
| VIII. Spec-Driven Development | Pass | Following speckit workflow; artifacts in specs/009-shop-api/ |

### Post-Design Check (Phase 1)

| Principle | Status | Verification |
|-----------|--------|--------------|
| I. Two-Tier Data Model | Pass | data-model.md confirms only user_id, item_id, quantity stored; all item details from Source |
| II. External JWT Authentication | Pass | contracts/shop-api.md shows Bearer token required for POST /shop and GET /player/inventory |
| III. Row-Level Security | Pass | data-model.md includes full RLS policies with user_id = auth.uid() |
| IV. Data Merging Pattern | Pass | research.md defines buildPlayerInventoryResponse() following pokemonData.js pattern |
| V. Serverless Architecture | Pass | quickstart.md confirms standard Next.js API routes under pages/api/ |
| VI. Pokemon 5e Compliance | Pass | Item costs, types, and effects all from Source/items/items.json |
| VII. Educational API Design | Pass | contracts/shop-api.md includes N8N integration notes, detailed error structures |
| VIII. Spec-Driven Development | Pass | All Phase 1 artifacts generated: research.md, data-model.md, contracts/, quickstart.md |

## Project Structure

### Documentation (this feature)

```text
specs/009-shop-api/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── shop-api.md      # API contract documentation
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
pages/
  api/
    shop.js              # NEW: Shop API endpoint (GET catalog, POST purchase)
    player/
      inventory.js       # NEW: Player inventory endpoint (GET)

lib/
  supabase.js            # Existing: Supabase client
  authHelper.js          # Existing: JWT authentication
  apiResponse.js         # Existing: Response envelope utilities
  itemData.js            # NEW: Item catalog loading and merging utilities

sql/
  005_player_inventory.sql  # NEW: player_inventory table with RLS

Source/
  items/
    items.json           # Existing: Item catalog (Poke Balls, Potions, etc.)
```

**Structure Decision**: Follows established Next.js API route pattern. Shop endpoint at `/api/shop` for catalog and purchases. Separate inventory endpoint at `/api/player/inventory` for viewing owned items (follows `/api/player/pokemon` pattern).

## Complexity Tracking

> No violations identified. Design follows established patterns.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
