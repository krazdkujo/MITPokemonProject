# Quickstart: Player Statistics Page

**Feature**: 005-player-statistics
**Branch**: `005-player-statistics`

## Prerequisites

- Node.js 18+
- Existing project setup with `npm install` completed
- Supabase database with `player_pokemon` table
- At least one user with Pokemon in the database for testing

## New Dependency

This feature introduces one new dependency:

```bash
npm install recharts
```

**Why Recharts?** See [research.md](./research.md#1-charting-library-selection) for full rationale.

## Files to Create

### API Route
- `pages/api/player/stats.js` - Statistics endpoint

### Page
- `pages/stats.js` - Statistics page with AuthGuard

### Components
Create `components/Stats/` directory with:
- `TypeDistributionChart.js` - Pie/bar chart for type breakdown
- `LevelDistributionChart.js` - Bar chart for level ranges
- `TopPokemonList.js` - Ranked list of highest-level Pokemon
- `EmptyState.js` - Reusable empty state component
- `StatsCard.js` - Reusable card wrapper for stat sections

## Quick Implementation Reference

### API Pattern (from existing `/api/player/pokemon.js`)

```javascript
import { createAdminClient } from '../../../lib/supabase';
import { sendSuccess, sendUnauthorizedError, sendInternalError } from '../../../lib/apiResponse';
import { authenticateRequest } from '../../../lib/authHelper';
import { buildPlayerPokemonListResponse, getPokemonById } from '../../../lib/pokemonData';

export default async function handler(req, res) {
  const { userId, error: authError } = await authenticateRequest(req);
  if (!userId) {
    return sendUnauthorizedError(res, authError || 'Authentication required');
  }
  // ... handle GET request
}
```

### Page Pattern (from existing `dashboard.js`)

```javascript
import AuthGuard from '../components/layout/AuthGuard';

function StatsContent() {
  // Fetch and display stats
}

export default function Stats() {
  return (
    <AuthGuard requirePokemon={false}>
      <StatsContent />
    </AuthGuard>
  );
}
```

### Component Pattern (from existing `PartyRoster.js`)

```javascript
export default function TypeDistributionChart({ data }) {
  if (!data || data.length === 0) {
    return <EmptyState message="Catch Pokemon to see type statistics" />;
  }

  return (
    <div className="type-chart">
      {/* Recharts component */}
      <style jsx>{`...`}</style>
    </div>
  );
}
```

## Testing

### Manual Test Flow

1. Log in as a test user with Pokemon
2. Navigate to Dashboard
3. Click "View Detailed Stats" link
4. Verify:
   - Type distribution chart shows correct counts
   - Level distribution chart shows correct ranges
   - Top Pokemon list shows highest levels first
   - All Pokemon sprites load correctly

### API Test

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/player/stats
```

Expected response structure:
```json
{
  "success": true,
  "data": {
    "collection": {
      "totalPokemon": 5,
      "uniqueSpecies": 4,
      "typeDistribution": [...]
    },
    "levels": {
      "topPokemon": [...],
      "distribution": {...}
    },
    "battles": null,
    "badges": null
  }
}
```

## Key Decisions Summary

| Decision | Choice | Reference |
|----------|--------|-----------|
| Charting library | Recharts | [research.md](./research.md#1-charting-library-selection) |
| API endpoint | `/api/player/stats` | [contracts/api-player-stats.yaml](./contracts/api-player-stats.yaml) |
| Level grouping | 1-5, 6-10, 11-15, 16-20 | [research.md](./research.md#4-level-distribution-grouping) |
| Dual-type counting | Count in both categories | [spec.md](./spec.md) FR-003 |
| Empty states | Show guidance messages | [spec.md](./spec.md) FR-006 |

## Related Documentation

- [Specification](./spec.md) - User stories and requirements
- [Research](./research.md) - Technical decisions and rationale
- [Data Model](./data-model.md) - Entity definitions
- [API Contract](./contracts/api-player-stats.yaml) - OpenAPI specification
