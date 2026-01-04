# Research: Player Dashboard

**Feature**: 003-player-dashboard
**Date**: 2026-01-03

## Research Topics

### 1. HP Fields in player_pokemon Table

**Question**: The spec requires displaying current_hp/max_hp but the existing schema only has level. How should HP be managed?

**Decision**: Add `current_hp` and `max_hp` INTEGER fields to player_pokemon table via migration.

**Rationale**:
- HP is dynamic player state, not reference data, so it belongs in the database (Constitution Principle I)
- current_hp changes during battles; max_hp may change on level up
- Pokemon 5e uses Hit Dice from Source data to calculate HP, but the calculated value is stored per-Pokemon

**Alternatives Considered**:
1. Calculate HP on every request from Source base stats - Rejected because HP changes during gameplay
2. Store only current_hp, calculate max_hp from level - Rejected because max_hp can be affected by items/effects
3. Add both current_hp and max_hp fields - **Selected** - allows both to be tracked independently

**Implementation**:
- Add migration `sql/003_add_hp_fields.sql`
- Update `buildPlayerPokemonResponse()` in lib/pokemonData.js to include HP fields
- Calculate initial max_hp from Pokemon 5e Hit Dice when Pokemon is created

### 2. Badge Storage Mechanism

**Question**: The spec requires badge display but no badge table exists. How should badges be stored?

**Decision**: Create a `player_badges` table with badge_id and earned_at timestamp. Display badge count (0) until gym battles are implemented.

**Rationale**:
- Badges are user-specific state (which badges earned) so they belong in the database
- Badge reference data (name, icon, gym leader) would go in Source if needed later
- For MVP, simply count badges; detailed badge display is future work

**Alternatives Considered**:
1. Store badges as JSON array on users table - Rejected because it doesn't allow easy querying/RLS
2. Create separate player_badges table with proper FK - **Selected** - follows established patterns
3. Store badge IDs in player_pokemon table - Rejected because badges are player-level, not Pokemon-level

**Implementation**:
- Create `sql/004_create_player_badges.sql` migration (can be deferred to gym battle feature)
- Dashboard initially shows "0 Badges" placeholder
- API returns badge_count: 0 until table exists

### 3. Pokedex Progress Calculation

**Question**: How to efficiently count distinct Pokemon species caught by a player?

**Decision**: Use SQL COUNT(DISTINCT pokemon_id) on player_pokemon table.

**Rationale**:
- Simple SQL aggregation is efficient for expected data volumes (dozens to hundreds of Pokemon per player)
- No need for separate Pokedex table; the data is derived from player_pokemon

**Alternatives Considered**:
1. Separate pokedex_entries table - Rejected because it duplicates data already derivable from player_pokemon
2. Cache count in users table - Rejected because it requires sync logic and could get out of sync
3. COUNT(DISTINCT) query - **Selected** - simple, accurate, performant for expected scale

**Implementation**:
- Add API endpoint that returns: `{ pokedex_caught: <count>, total_pokemon: <from Source metadata> }`
- Query: `SELECT COUNT(DISTINCT pokemon_id) FROM player_pokemon WHERE user_id = $1`

### 4. HP Bar Color Coding Pattern

**Question**: What colors should the HP bar display at different health levels?

**Decision**: Use standard Pokemon game HP bar colors - green (>50%), yellow (25-50%), red (<25%).

**Rationale**:
- Matches player expectations from Pokemon games
- Provides quick visual assessment of Pokemon health status
- Accessible color choices with sufficient contrast

**Alternatives Considered**:
1. Single color with varying opacity - Rejected because less intuitive
2. Gradient from green to red - Rejected because harder to read at a glance
3. Three-tier color system (green/yellow/red) - **Selected** - familiar and clear

**Implementation**:
- HPBar component calculates percentage: (current_hp / max_hp) * 100
- Apply CSS class based on percentage threshold
- Colors: green (#4ade80), yellow (#facc15), red (#f87171)

### 5. Dashboard API Strategy

**Question**: Should dashboard data come from one API call or multiple?

**Decision**: Extend existing GET /api/player/pokemon to return all needed data in one call.

**Rationale**:
- Reduces network round-trips for better performance
- The existing endpoint already returns Pokemon list; adding summary stats is minimal overhead
- Follows Educational API Design principle of returning complete game state

**Alternatives Considered**:
1. Separate endpoints for party, box count, pokedex, badges - Rejected because multiple round-trips hurt performance
2. Single /api/player/dashboard endpoint - Rejected because it duplicates Pokemon fetching logic
3. Extend /api/player/pokemon response - **Selected** - reuses existing code, single request

**Implementation**:
- Enhance GET /api/player/pokemon to return:
```json
{
  "success": true,
  "data": {
    "pokemon": [...],
    "active_count": 3,
    "box_count": 12,
    "pokedex_caught": 5,
    "badge_count": 0,
    "has_starter": true
  }
}
```

### 6. Component Organization Pattern

**Question**: How should dashboard components be organized following V1 patterns?

**Decision**: Create components/Dashboard/ directory with feature-specific components.

**Rationale**:
- Follows existing pattern (components/starter/, components/auth/, components/layout/)
- Keeps dashboard components isolated and easily maintainable
- Allows reuse of HPBar component elsewhere if needed

**Alternatives Considered**:
1. Put components in components/Roster/ - Rejected because "Dashboard" is more accurate for this feature
2. Flat structure in components/ - Rejected because it doesn't match existing organization
3. components/Dashboard/ directory - **Selected** - consistent with project patterns

**Implementation**:
- Create components/Dashboard/ with PartyCard, PartyRoster, StatsSummary, HPBar
- Update pages/dashboard.js to use new components
- Reuse existing type badge styles from StarterCard

## Resolved Clarifications

All NEEDS CLARIFICATION items from Technical Context have been resolved:

1. HP Fields: Add current_hp and max_hp to player_pokemon table
2. Badge Storage: Placeholder for now (0 badges), table created with gym feature
3. Pokedex: COUNT(DISTINCT pokemon_id) query
4. HP Bar Colors: Green/yellow/red threshold system
5. API Strategy: Extend existing /api/player/pokemon endpoint
6. Components: Use components/Dashboard/ directory

## Next Steps

Proceed to Phase 1: Generate data-model.md and API contracts.
