# API Contracts: Wild Pokemon Encounter Page

**Feature**: 014-wild-encounter
**Date**: 2026-01-04

## Overview

This feature does not introduce new API endpoints. It uses the existing `/api/battle/start` endpoint for encounter generation and relies on client-side location data loading.

## Contracts

| Contract | Type | Status |
|----------|------|--------|
| [battle-start.md](./battle-start.md) | Existing API (reference) | No changes |
| [locations-data.md](./locations-data.md) | Client-side data | New |

## API Usage Flow

```
1. Page Load
   └─> Load locations from Source/locations.json (client-side)
   └─> Load party from GameContext (already available)

2. Search for Pokemon
   └─> Client generates random Pokemon + level from location
   └─> POST /api/battle/start (existing)
       └─> Returns battle_id, opponent data, initiative

3. Battle Navigation
   └─> router.push('/combat?battle_id=xxx')
```

## No New Endpoints Required

The wild encounter flow is fully supported by existing infrastructure:
- Location data is static (loaded from Source/)
- Party validation uses GameContext (already fetched)
- Battle initialization uses existing `/api/battle/start`
