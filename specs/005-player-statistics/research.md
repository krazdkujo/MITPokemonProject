# Research: Player Statistics Page

**Feature**: 005-player-statistics
**Date**: 2026-01-03
**Status**: Complete

## Research Tasks

### 1. Charting Library Selection

**Decision**: Recharts

**Rationale**:
- React-native component API aligns with existing codebase patterns
- SVG-based rendering ensures crisp display across devices
- Responsive design built-in, matches FR-013 (responsive requirement)
- Widely adopted with active maintenance (important for educational projects)
- Simple API reduces onboarding time for students viewing/modifying code
- No additional configuration needed for Next.js SSR

**Alternatives Considered**:

| Library | Reason Rejected |
|---------|-----------------|
| Chart.js (react-chartjs-2) | Canvas-based, harder to style consistently with existing JSX styling approach |
| Visx | Too low-level for simple bar/pie charts; overkill for this feature |
| Nivo | Heavier bundle, more complex API than needed |
| Native CSS/SVG | Requires more development time for responsive behavior |

**Sources**:
- [8 Best React Chart Libraries for Visualizing Data in 2025](https://embeddable.com/blog/react-chart-libraries)
- [Best React chart libraries (2025 update) - LogRocket](https://blog.logrocket.com/best-react-chart-libraries-2025/)

### 2. Existing API Pattern Analysis

**Decision**: Create new `/api/player/stats` endpoint following existing patterns

**Rationale**:
- Existing `/api/player/pokemon` returns roster data; stats endpoint should be separate concern
- Follow the same authentication pattern using `authenticateRequest` from `lib/authHelper.js`
- Use `lib/pokemonData.js` for merging database records with Source data (per Constitution IV)
- Return consistent JSON envelope using `lib/apiResponse.js` helpers

**Pattern Reference** (from `/api/player/pokemon.js`):
```javascript
// Authentication
const { userId, error: authError } = await authenticateRequest(req);

// Data merging
const pokemon = buildPlayerPokemonListResponse(playerPokemon || []);

// Response envelope
return sendSuccess(res, { ... });
```

### 3. Type Distribution Calculation

**Decision**: Calculate server-side by iterating player Pokemon and counting types from Source data

**Rationale**:
- Source data contains `type: ["grass", "poison"]` arrays
- For each player Pokemon, look up Source data using `getPokemonById(pokemon_id)`
- Count occurrences of each type (dual-types count toward both)
- Return both count and percentage for each type

**Algorithm**:
```
For each player_pokemon record:
  source = getPokemonById(record.pokemon_id)
  For each type in source.type:
    typeCount[type]++
```

### 4. Level Distribution Grouping

**Decision**: Group levels into ranges: 1-5, 6-10, 11-15, 16-20

**Rationale**:
- Max level in system is 20 (from `player_pokemon` constraint: `level <= 20`)
- Four groups provide meaningful visualization without overwhelming users
- Matches natural progression milestones in Pokemon 5e

**Data Structure**:
```javascript
levelDistribution: {
  "1-5": 3,
  "6-10": 5,
  "11-15": 2,
  "16-20": 1
}
```

### 5. Future-Proofing for Battles/Badges

**Decision**: API returns null/empty sections for battle and badge stats when tables don't exist

**Rationale**:
- Spec explicitly states P3 (battles) and P4 (badges) depend on future tables
- UI should handle absence gracefully with "Coming Soon" messaging
- API structure should anticipate these additions to avoid breaking changes

**API Response Structure**:
```javascript
{
  collection: { total, byType: {...} },
  levels: { topPokemon: [...], distribution: {...} },
  battles: null,  // Future: { wins, losses, winRate, mostUsed: [...] }
  badges: null    // Future: { earned: [...], total: 8 }
}
```

### 6. Component Structure

**Decision**: Create `components/Stats/` directory with modular components

**Rationale**:
- Matches existing pattern: `components/Dashboard/`, `components/starter/`
- Each stat card/section is a separate component for maintainability
- Allows easy addition of battle/badge components later

**Component Plan**:
```
components/Stats/
  TypeDistributionChart.js    # Pie or bar chart of types
  LevelDistributionChart.js   # Bar chart of level ranges
  TopPokemonList.js           # Ranked list with sprites
  BattleStatsCard.js          # Placeholder for future
  BadgeProgressCard.js        # Placeholder for future
  EmptyState.js               # Reusable empty state component
```

## Constitution Compliance Check

| Principle | Compliance |
|-----------|------------|
| I. Two-Tier Data Model | PASS - Stats calculated by merging player_pokemon with Source data |
| II. External JWT Auth | PASS - Uses existing authenticateRequest pattern |
| III. Row-Level Security | PASS - Queries use user_id from authenticated JWT |
| IV. Data Merging Pattern | PASS - Uses lib/pokemonData.js utilities |
| V. Serverless Architecture | PASS - Standard Next.js API route |
| VI. Pokemon 5e Compliance | PASS - Types read from Source, not hardcoded |
| VII. Educational API Design | PASS - Consistent JSON envelope, clear error messages |
| VIII. Spec-Driven Development | PASS - Following spec -> plan -> tasks workflow |

## Resolved Clarifications

All technical context items have been resolved:
- **Language/Version**: JavaScript (ES2020+) / Node.js 18+ / Next.js 14
- **Primary Dependencies**: Recharts (new), existing Supabase client
- **Storage**: Existing Supabase PostgreSQL (player_pokemon table)
- **Testing**: Manual testing via browser + API endpoint verification
- **Target Platform**: Web (Next.js on Vercel)
- **Performance Goals**: < 3 seconds page load (per SC-001)
- **Constraints**: Must handle empty states gracefully
- **Scale/Scope**: Single authenticated user viewing their own stats
