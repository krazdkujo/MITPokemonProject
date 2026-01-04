# API Contracts: Game Navigation Layout

**Feature**: 011-game-layout
**Date**: 2026-01-04

## No New API Endpoints

This feature does not introduce any new API endpoints. The layout consumes data from existing endpoints:

### Existing Endpoints Used

#### GET /api/player/pokemon

**Purpose**: Fetch player's party Pokemon for mini party display

**Response** (existing):
```json
{
  "success": true,
  "data": {
    "pokemon": [
      {
        "id": "uuid",
        "pokemon_id": "bulbasaur",
        "name": "Bulbasaur",
        "level": 5,
        "current_hp": 18,
        "max_hp": 22,
        "is_active": true,
        "slot_number": 1,
        "type": ["Grass", "Poison"],
        "sprite": "bulbasaur.png"
      }
    ],
    "has_starter": true,
    "active_count": 1,
    "box_count": 0,
    "total_count": 1
  }
}
```

**Layout Usage**: Filters for `is_active === true`, displays up to 6 Pokemon with HP bars.

---

#### GET /api/player/inventory

**Purpose**: Fetch player's currency balance

**Response** (existing):
```json
{
  "success": true,
  "data": {
    "inventory": [...],
    "count": 0,
    "currency": 500
  }
}
```

**Layout Usage**: Extracts `currency` field for display in top navigation.

---

## Contract Notes

- Both endpoints require Bearer token authentication
- Both endpoints are already implemented and tested
- No modifications to existing endpoints required
- Layout will call both endpoints in parallel on mount
