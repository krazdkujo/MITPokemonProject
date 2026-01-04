# Research: Pokemon Center Page

**Date**: 2026-01-04
**Feature**: 012-pokecenter-page

## Summary

Research completed to determine technical patterns and existing infrastructure for implementing the Pokemon Center page. All NEEDS CLARIFICATION items have been resolved through codebase analysis.

---

## Research Tasks

### 1. Healing API Endpoint (POST /api/heal)

**Decision**: Use existing `/api/heal` endpoint - already implemented and functional.

**Rationale**: The healing API already exists at `pages/api/heal.js` with full implementation including:
- Authentication via Bearer token
- Queries active party Pokemon (is_active = true)
- Updates both `current_hp` to `max_hp` and `move_pp` (restores all PP)
- Returns merged Pokemon objects with Source data

**Response Format**:
```json
{
  "success": true,
  "data": {
    "healed": [...],
    "healed_count": 1,
    "message": "Party healed successfully"
  }
}
```

**Alternatives Considered**: None - API already exists and meets requirements.

---

### 2. Player Pokemon API (GET /api/player/pokemon)

**Decision**: Use existing endpoint for fetching party data.

**Rationale**: Endpoint at `pages/api/player/pokemon.js` returns all necessary data:
- UUID, pokemon_id, name, type, level
- current_hp, max_hp for health status
- is_active, slot_number for party filtering
- sprite, artwork paths for images

**Response Format**:
```json
{
  "success": true,
  "data": {
    "pokemon": [...],
    "has_starter": true,
    "active_count": 1
  }
}
```

**Alternatives Considered**: Direct database query - rejected because API handles data merging with Source.

---

### 3. Page Structure Pattern

**Decision**: Follow existing page pattern with GameLayout wrapper and inner content component.

**Rationale**: All game pages (dashboard.js, wild.js, pokemart.js) follow consistent pattern:
- Inner `*Content` component handles data fetching and state
- Outer export wrapped in GameLayout
- Uses `apiFetch()` for authenticated requests
- Three states: loading, error, success

**Pattern**:
```javascript
function PokeCenterContent() {
  const { party, refreshData } = useGame();
  // ... component logic
}

export default function PokeCenterPage() {
  return (
    <GameLayout>
      <PokeCenterContent />
    </GameLayout>
  );
}
```

**Alternatives Considered**: Custom layout - rejected for consistency.

---

### 4. State Management Approach

**Decision**: Leverage existing GameContext for shared party state.

**Rationale**: GameContext (`lib/gameContext.js`) already provides:
- `party` array with active Pokemon (filtered, sorted)
- `refreshData()` function to reload after healing
- `loading` and `error` states
- Pre-calculated `is_fainted` and `hp_percentage` for each Pokemon

**Usage**:
```javascript
const { party, refreshData, loading } = useGame();
// After heal: await refreshData();
```

**Alternatives Considered**: Local state only - rejected because other components (TopNav, SideNav) need updated data.

---

### 5. HP Bar Component

**Decision**: Reuse existing HPBar component from Dashboard.

**Rationale**: `components/Dashboard/HPBar.js` already implements:
- Color coding: green (>50%), yellow (25-50%), red (<25%)
- Display format: "current / max"
- Smooth bar visualization

**Alternatives Considered**: New component - rejected to avoid duplication.

---

### 6. Party Display Component

**Decision**: Reuse PartyCard component with potential enhancement.

**Rationale**: `components/Dashboard/PartyCard.js` displays:
- Pokemon sprite with fallback
- Name, types, level
- HPBar component
- Hover effects

May need slight adaptation for Pokemon Center context (clickable for PP details).

**Alternatives Considered**: MiniPartyCard - rejected as too compact for main healing interface.

---

### 7. Move PP Display

**Decision**: Add optional detail view when clicking a Pokemon.

**Rationale**: Move PP data is available in healed response. Need to:
- Store selected Pokemon state
- Display modal or expandable section
- Show move names with PP/maxPP

**Implementation**: Modal component triggered by PartyCard click.

---

### 8. Authentication Pattern

**Decision**: Use apiFetch() for automatic token handling.

**Rationale**: `lib/apiFetch.js` automatically:
- Retrieves token from localStorage
- Adds Authorization header
- Handles common error cases

GameLayout already gates unauthenticated users.

---

## Technology Decisions

| Category | Decision | Rationale |
|----------|----------|-----------|
| Layout | GameLayout | Consistent with other game pages |
| State | GameContext | Shared party state across components |
| API Client | apiFetch() | Automatic auth handling |
| HP Display | HPBar | Existing component with correct colors |
| Party Display | PartyCard | Full-size cards for healing context |
| Styling | CSS-in-JS (style jsx) | Project standard |

---

## Files to Create

1. `pages/pokecenter.js` - Main page component (exists as stub, needs implementation)

## Files to Potentially Modify

1. `components/Dashboard/PartyCard.js` - Add click handler prop (optional)

## Existing Files to Leverage

1. `lib/gameContext.js` - useGame() hook
2. `lib/apiFetch.js` - Authenticated fetch
3. `components/Dashboard/HPBar.js` - Health bar
4. `components/Dashboard/PartyCard.js` - Pokemon cards
5. `components/layout/GameLayout.js` - Page wrapper

---

## All NEEDS CLARIFICATION Resolved

- Healing API format: Confirmed via code analysis
- Party API format: Confirmed via code analysis
- HP bar colors: green >50%, yellow 25-50%, red <25%
- State management: GameContext with refreshData()
- Authentication: apiFetch() handles automatically
- Component reuse: HPBar, PartyCard, GameLayout
