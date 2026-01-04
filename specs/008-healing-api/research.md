# Research: Healing API

**Feature**: 008-healing-api
**Date**: 2026-01-03

## Research Summary

This feature has no NEEDS CLARIFICATION items. All technical decisions are well-defined by the existing codebase patterns and constitution principles.

## Decisions Made

### 1. API Endpoint Location

**Decision**: `pages/api/heal.js`

**Rationale**: Follows the existing flat API structure used by similar endpoints (battle.js, health.js). No need for a subdirectory since this is a single-purpose endpoint.

**Alternatives Considered**:
- `pages/api/player/heal.js` - Rejected because heal operates on party Pokemon, not player metadata. The existing `/api/player/pokemon.js` is for roster management, not battle state operations.
- `pages/api/battle/heal.js` - Rejected because healing is a separate action from battle, called between battles.

### 2. PP Restoration Method

**Decision**: Use `initializeMovePP(selectedMoves)` from lib/pokemonData.js to rebuild PP from Source data.

**Rationale**: This function already exists and correctly reads max PP values from Source move data. Reinitializing ensures PP matches the Pokemon's current selected_moves array.

**Alternatives Considered**:
- Store max_pp alongside current pp - Rejected because it duplicates Source data (violates Principle I).
- Loop through move_pp and reset each to max - Rejected because it requires fetching max PP for each move anyway; initializeMovePP does this efficiently.

### 3. Database Update Strategy

**Decision**: Single UPDATE query with WHERE clause for all active Pokemon belonging to the user.

**Rationale**: More efficient than individual updates. Supabase supports batch updates within a single query using filters.

**Alternatives Considered**:
- Individual UPDATE per Pokemon - Rejected for performance reasons.
- Use a database function/procedure - Rejected as overkill for a simple update.

### 4. Response Format

**Decision**: Return healed Pokemon array using `buildPlayerPokemonListResponse()`.

**Rationale**: Matches the response format used by `/api/player/pokemon` GET endpoint. Students already know this format from dashboard workflows.

**Alternatives Considered**:
- Return just confirmation without Pokemon data - Rejected because N8N workflows need the updated state immediately.
- Return minimal data (just HP values) - Rejected because merged Source data is needed for display in workflows.

## Existing Code Analysis

### Relevant Existing Endpoints

| Endpoint | Pattern Used | Applicable Here |
|----------|--------------|-----------------|
| `/api/player/pokemon.js` | Auth + query + merge response | Yes - same auth and response pattern |
| `/api/battle.js` | Auth + update HP/PP + response | Yes - same database update pattern for HP/PP |
| `/api/health.js` | Simple health check | No - different purpose |

### Required Imports

Based on existing patterns:
```javascript
import { createAdminClient } from '../../lib/supabase';
import { authenticateRequest } from '../../lib/authHelper';
import {
  sendSuccess,
  sendUnauthorizedError,
  sendMethodNotAllowed,
  sendInternalError,
} from '../../lib/apiResponse';
import {
  buildPlayerPokemonListResponse,
  initializeMovePP,
} from '../../lib/pokemonData';
```

## Dependencies Verified

| Dependency | Location | Status |
|------------|----------|--------|
| authenticateRequest | lib/authHelper.js | Exists, returns { userId, error } |
| createAdminClient | lib/supabase.js | Exists, creates Supabase client |
| buildPlayerPokemonListResponse | lib/pokemonData.js | Exists, merges db records with Source |
| initializeMovePP | lib/pokemonData.js | Exists, creates PP object from move IDs |
| sendSuccess | lib/apiResponse.js | Exists, formats success response |
| sendUnauthorizedError | lib/apiResponse.js | Exists, formats 401 response |
| sendMethodNotAllowed | lib/apiResponse.js | Exists, formats 405 response |
| sendInternalError | lib/apiResponse.js | Exists, formats 500 response |

## Open Questions

None - all technical details are resolved.
