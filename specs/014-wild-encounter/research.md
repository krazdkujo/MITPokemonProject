# Research: Wild Pokemon Encounter Page

**Feature**: 014-wild-encounter
**Date**: 2026-01-04

## Executive Summary

Research confirms the wild encounter page can be built primarily with existing infrastructure. The main new work involves creating location data, a location data loader, and UI components for the encounter flow. All core battle mechanics are already implemented.

---

## 1. Existing Battle API Integration

### Decision: Use existing `/api/battle/start` endpoint

**Rationale**: The endpoint already supports wild encounters and provides all needed functionality.

**Existing Contract** (from `pages/api/battle/start.js`):
```javascript
// Request
POST /api/battle/start
{
  player_pokemon_id: string,   // UUID from player_pokemon table
  opponent_pokemon_id: string, // Pokemon ID from Source (e.g., "rattata")
  opponent_level: number,      // 1-20
  battle_type: "wild"          // Optional, defaults to "wild"
}

// Response
{
  success: true,
  data: {
    battle_id: string,
    battle_type: "wild",
    player_pokemon: { id, pokemon_id, name, level, current_hp, max_hp, ... },
    opponent: { pokemon_id, name, level, current_hp, max_hp, type, ... },
    initiative_order: ["player" | "opponent", ...],
    first_to_act: "player" | "opponent",
    round_number: 1
  }
}
```

**Alternatives Considered**:
1. Create new wild-specific endpoint - Rejected: Would duplicate existing logic
2. Modify existing endpoint - Rejected: Already supports wild type

---

## 2. Location Data Structure

### Decision: Create `Source/locations.json` as static file

**Rationale**: Follows Two-Tier Data Model principle. Locations are reference data (like Pokemon species), not user-specific state.

**Proposed Structure**:
```json
{
  "locations": [
    {
      "id": "route-1",
      "name": "Route 1",
      "description": "A peaceful path connecting Pallet Town to Viridian City.",
      "levelRange": { "min": 2, "max": 5 },
      "pokemon": [
        { "id": "rattata", "weight": 50 },
        { "id": "pidgey", "weight": 50 }
      ],
      "unlockRequirement": null,
      "terrain": "grass"
    }
  ]
}
```

**Alternatives Considered**:
1. Database table for locations - Rejected: No user-specific state needed
2. Hardcoded in component - Rejected: Less maintainable, violates data separation

---

## 3. Pokemon Selection for Encounters

### Decision: Weight-based random selection from location's Pokemon pool

**Rationale**: Provides varied encounters while allowing control over rarity.

**Algorithm**:
```javascript
function selectRandomPokemon(location) {
  const totalWeight = location.pokemon.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;

  for (const entry of location.pokemon) {
    random -= entry.weight;
    if (random <= 0) return entry.id;
  }
  return location.pokemon[0].id; // Fallback
}

function selectRandomLevel(levelRange) {
  return Math.floor(Math.random() * (levelRange.max - levelRange.min + 1)) + levelRange.min;
}
```

**Alternatives Considered**:
1. Equal probability - Rejected: Less interesting gameplay
2. Time-of-day variants - Rejected: Out of MVP scope

---

## 4. State Management for Encounter Flow

### Decision: Use React useState within the page component

**Rationale**: Encounter state is ephemeral and page-local. No need for context or global state.

**State Structure**:
```javascript
const [selectedLocation, setSelectedLocation] = useState(null);
const [encounter, setEncounter] = useState(null);  // Wild Pokemon data
const [battleData, setBattleData] = useState(null); // Response from /api/battle/start
const [isSearching, setIsSearching] = useState(false);
const [error, setError] = useState(null);
```

**Alternatives Considered**:
1. Add to GameContext - Rejected: Encounter is page-specific, not global
2. URL query params - Rejected: Encounter state is transient

---

## 5. Navigation to Combat Page

### Decision: Use Next.js router.push with query parameters

**Rationale**: Next.js router is already available, and query params persist through navigation.

**Implementation**:
```javascript
import { useRouter } from 'next/router';

const handleBattle = () => {
  router.push({
    pathname: '/combat',
    query: {
      battle_id: battleData.battle_id,
      encounter_type: 'wild'
    }
  });
};
```

**Alternatives Considered**:
1. Store in localStorage - Rejected: Query params are simpler and more debuggable
2. Context API - Rejected: Overly complex for one-time navigation

---

## 6. Party Validation

### Decision: Use existing GameContext party data

**Rationale**: GameContext already provides party with HP information.

**Implementation**:
```javascript
const { party } = useGame();

const hasValidParty = party.length > 0;
const hasHealthyPokemon = party.some(p => p.current_hp > 0);

if (!hasValidParty) {
  // Redirect to starter selection
}

if (!hasHealthyPokemon) {
  // Redirect to Pokemon Center
}
```

**Alternatives Considered**:
1. Server-side validation only - Rejected: Poor UX, should validate early
2. Separate API call - Rejected: Data already available in GameContext

---

## 7. Component Architecture

### Decision: Create focused components in `components/Wild/`

**Rationale**: Follows existing project patterns (Dashboard/, layout/).

**Components**:
| Component | Responsibility |
|-----------|----------------|
| `LocationSelector` | Grid of location cards, handles selection |
| `LocationCard` | Individual location display with Pokemon preview |
| `EncounterDisplay` | Shows wild Pokemon with sprite, stats, types |
| `EncounterActions` | Battle and Flee buttons |

**Alternatives Considered**:
1. Single monolithic component - Rejected: Poor maintainability
2. Generic reusable components - Rejected: Over-engineering for single use case

---

## 8. Player Pokemon Selection for Battle

### Decision: Auto-select first healthy Pokemon from party

**Rationale**: Simplifies MVP. Player can switch Pokemon during combat if needed.

**Implementation**:
```javascript
const getFirstHealthyPokemon = (party) => {
  return party.find(p => p.current_hp > 0);
};
```

**Alternatives Considered**:
1. Pokemon selection modal - Considered: Nice-to-have for future
2. Always use party leader - Similar to chosen approach

---

## 9. MVP Location Data

### Decision: Include 4 locations with balanced Pokemon pools

**Locations for MVP**:
1. **Route 1** - Levels 2-4, Rattata, Pidgey
2. **Viridian Forest** - Levels 3-6, Caterpie, Weedle, Pikachu (rare)
3. **Route 22** - Levels 3-5, Nidoran (M/F), Spearow, Mankey
4. **Mt. Moon Entrance** - Levels 6-10, Zubat, Geodude, Clefairy (rare)

**Rationale**: Provides progression and variety. Uses Gen 1 Pokemon that exist in Source data.

---

## 10. Styling Approach

### Decision: Use styled-jsx consistent with existing pages

**Rationale**: All existing game pages use styled-jsx with the established color palette.

**Color Palette** (from existing components):
- Primary yellow: `#fbbf24`, hover: `#f59e0b`
- Background: `linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)`
- Text: White with opacity variants
- Type colors: Already defined in PartyCard.js

---

## Open Questions Resolved

| Question | Resolution |
|----------|------------|
| Where to store location data? | Source/locations.json (Two-Tier Model) |
| How to pass data to combat page? | Query parameters via router.push |
| How to validate party? | Use existing GameContext |
| Which Pokemon to send to battle? | First healthy Pokemon from party |

---

## Dependencies Verified

| Dependency | Status | Location |
|------------|--------|----------|
| Battle start API | Exists | pages/api/battle/start.js |
| Pokemon data utilities | Exists | lib/pokemonData.js |
| GameContext with party | Exists | lib/gameContext.js |
| GameLayout wrapper | Exists | components/layout/GameLayout.js |
| Combat page | Exists (placeholder) | pages/combat.js |
| Pokemon sprites | Exists | public/images/pokemon/ |
