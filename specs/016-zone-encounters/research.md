# Research: Zone-Based Pokemon Encounters

**Feature**: 016-zone-encounters
**Date**: 2026-01-04

## Research Tasks

### 1. Zone Data Structure

**Question**: How should zone data be structured and stored?

**Decision**: Static JSON file in Source folder (Source/zones.json)

**Rationale**:
- Follows Constitution Principle I (Two-Tier Data Model) - reference data in Source/
- Aligns with existing pattern from Source/locations.json
- No migrations needed, simple updates via file edits
- Zone configuration is game design data, not user-specific state

**Alternatives Considered**:
- Database table: Rejected - zones are reference data, not user state
- Hardcoded in lib: Rejected - less maintainable than JSON

### 2. Type-to-Terrain Mapping

**Question**: Which Pokemon types map to which terrain zones?

**Decision**: Multi-type mapping with primary and secondary associations

| Terrain | Primary Types | Secondary Types |
|---------|--------------|-----------------|
| Water | water, ice | - |
| Fire | fire | dragon |
| Grass | grass | bug |
| Electric | electric | steel |
| Cave | rock, ground, dark | ghost |
| Forest | bug, grass | normal, fairy |
| Mountain | flying, fighting, dragon | rock |
| Urban | normal, poison, steel | electric, psychic |

**Rationale**:
- Covers all 18 Pokemon types across 8 terrain categories
- Dual-type Pokemon can appear in multiple zones (FR-007)
- Matches intuitive Pokemon habitat expectations
- Some overlap ensures variety in each zone

### 3. SR-to-Difficulty Tier Mapping

**Question**: How do Species Rating (SR) ranges map to difficulty tiers?

**Decision**: Four-tier system based on Pokemon 5e SR guidelines

| Tier | Label | SR Range | Level Equivalent |
|------|-------|----------|-----------------|
| 1 | Easy | 0 - 0.5 | 1-4 |
| 2 | Medium | 0.5 - 2 | 4-6 |
| 3 | Hard | 2 - 6 | 6-11 |
| 4 | Expert | 6+ | 11-20 |

**Rationale**:
- Aligns with existing generateLevelFromSR function in wild.js
- Provides clear progression for new players
- Expert tier covers legendary/evolved Pokemon

### 4. Battle State Persistence Schema

**Question**: What database schema supports full battle state persistence?

**Decision**: New `active_battles` table with JSONB state column

```sql
CREATE TABLE active_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  zone_id TEXT NOT NULL,
  battle_state JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'victory', 'defeat', 'fled', 'abandoned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Rationale**:
- JSONB stores full battle state (positions, HP, PP, status effects, turn order)
- Single row per active battle enables efficient lookup
- Status field enables quick filtering of active battles
- RLS policy: user_id = auth.uid()

**Alternatives Considered**:
- Normalized tables for each battle component: Rejected - over-engineered for turn-by-turn persistence
- Client-side localStorage: Rejected - doesn't survive browser close (requirement)

### 5. Zone Selection API Design

**Question**: How should zone selection trigger encounter creation?

**Decision**: POST /api/zones/encounter with zone_id

**Flow**:
1. Client calls POST /api/zones/encounter { zone_id }
2. Server validates user has no active battle (FR-016)
3. Server selects random Pokemon from zone's type pool within SR range
4. Server creates active_battles record with initial state
5. Server returns battle_id and initial combatant data
6. Client navigates to combat page with battle_id

**Rationale**:
- Single API call creates persistent battle record
- Matches clarification: "Create battle record when zone selection confirms"
- Blocks duplicate battles via active check

### 6. Combat Page Battle Resume

**Question**: How does combat page detect and resume active battles?

**Decision**: Check for active battle on page load

**Flow**:
1. Combat page loads
2. Call GET /api/battle/active to check for active battle
3. If active battle exists: load state from database, render grid
4. If no active battle: redirect to zones page or show empty state

**Rationale**:
- Seamless resume per clarification decision
- No confirmation required
- Works across browser sessions

### 7. Encounter Pool Generation

**Question**: How to efficiently filter 1142 Pokemon by type and SR?

**Decision**: Pre-compute pools per zone at startup, cache in memory

**Implementation**:
```javascript
// lib/zoneData.js
export function getEncounterPool(zoneId) {
  const zone = getZoneById(zoneId);
  const allPokemon = getAllPokemon();

  return allPokemon.filter(p => {
    // Check type match (either type)
    const typeMatch = zone.types.some(t =>
      p.type.includes(t)
    );
    // Check SR range
    const srMatch = p.sr >= zone.srRange.min && p.sr <= zone.srRange.max;
    return typeMatch && srMatch;
  });
}
```

**Rationale**:
- Filtering 1142 Pokemon is fast (~1ms)
- Caching optional but beneficial for repeated access
- Uses existing pokemonData.js pattern

## Dependencies

### Existing Code to Extend

| File | Changes Needed |
|------|----------------|
| lib/locationData.js | Model for new zoneData.js |
| lib/battleState.js | Add serialization for DB persistence |
| lib/battleEngine.js | No changes - works with combatant objects |
| pages/wild.js | Replace with zones page (or adapt) |
| pages/combat.js | Add active battle check on load |

### New Files

| File | Purpose |
|------|---------|
| Source/zones.json | Zone definitions (terrain, SR range, names) |
| lib/zoneData.js | Zone loading and encounter pool utilities |
| pages/api/zones/index.js | GET all zones |
| pages/api/zones/encounter.js | POST start encounter in zone |
| pages/api/battle/active.js | GET active battle for user |
| pages/api/battle/abandon.js | POST abandon active battle |
| sql/006_active_battles.sql | Database migration |
| components/Zones/* | Zone selection UI components |

## Constraints Validated

- [x] 10-second API timeout: All operations are simple queries/filters
- [x] Stateless serverless: State persisted to database, not request
- [x] RLS required: active_battles table will have user_id policy
- [x] Source authoritative: Zone data in Source/, Pokemon data from Source/
- [x] Data merge pattern: Battle state includes pokemon_id, merges with Source on render
