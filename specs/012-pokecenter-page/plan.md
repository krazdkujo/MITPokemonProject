# Implementation Plan: Pokemon Center Page

**Branch**: `012-pokecenter-page` | **Date**: 2026-01-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-pokecenter-page/spec.md`

## Summary

Implement the Pokemon Center page (`pages/pokecenter.js`) - a themed healing interface where players can view their party's health status and restore all Pokemon HP and move PP. The implementation leverages existing API endpoints (POST /api/heal, GET /api/player/pokemon) and reuses established UI components (HPBar, PartyCard, GameLayout).

## Technical Context

**Language/Version**: JavaScript (ES2020+) with Node.js 18+
**Primary Dependencies**: Next.js 14, React 18, @supabase/supabase-js
**Storage**: Supabase PostgreSQL (existing player_pokemon table)
**Testing**: Manual testing via browser
**Target Platform**: Web browser (Vercel deployment)
**Project Type**: Web application (Next.js)
**Performance Goals**: Page load < 2 seconds, heal action complete < 5 seconds
**Constraints**: Serverless function timeout 10s, stateless requests
**Scale/Scope**: Single page feature, reuses existing components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Two-Tier Data Model | PASS | Frontend consumes merged API responses; no direct Source file access |
| II. External JWT Authentication | PASS | Uses existing apiFetch() with Bearer tokens |
| III. Row-Level Security | N/A | Frontend only; RLS enforced at API layer |
| IV. Data Merging Pattern | PASS | APIs return pre-merged data via buildPlayerPokemonResponse() |
| V. Serverless Architecture | PASS | Follows Next.js page pattern with GameLayout |
| VI. Pokemon 5e Compliance | N/A | No game mechanics calculations on frontend |
| VII. Educational API Design | PASS | Uses standard response envelope |
| VIII. Spec-Driven Development | PASS | Following spec -> plan -> tasks workflow |

**Gate Result**: PASS - All applicable principles satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/012-pokecenter-page/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api.yaml         # API contract reference
├── checklists/
│   └── requirements.md  # Spec validation checklist
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
pages/
  pokecenter.js          # Main page component (TO IMPLEMENT)
  api/
    heal.js              # Existing - POST healing endpoint
    player/
      pokemon.js         # Existing - GET party endpoint

components/
  Dashboard/
    HPBar.js             # Existing - Reuse for health bars
    PartyCard.js         # Existing - Reuse for Pokemon cards
  layout/
    GameLayout.js        # Existing - Page wrapper

lib/
  gameContext.js         # Existing - Party state management
  apiFetch.js            # Existing - Authenticated API calls
  pokemonData.js         # Existing - Data utilities
```

**Structure Decision**: Web application pattern - single page under `pages/` leveraging existing component library.

## Complexity Tracking

No complexity violations. Feature uses existing infrastructure.

---

## Design Decisions

### 1. Component Architecture

**Decision**: Single-file page component with inline subcomponents.

**Rationale**: The Pokemon Center page is self-contained with no shared components beyond existing ones. Inline components reduce file fragmentation for a cohesive feature.

**Structure**:
```
PokeCenterPage (export default)
└── PokeCenterContent (inner component)
    ├── NurseJoyWelcome (styled header)
    ├── PartyDisplay (mapped PartyCards)
    ├── HealButton (action button)
    └── StatusMessage (success/error/info)
```

### 2. State Management

**Decision**: Leverage GameContext for party data with local UI state.

**Rationale**: GameContext already fetches and caches party data. Local state handles:
- `healing` - Loading state for heal action
- `message` - Success/error message display
- `messageType` - 'success', 'error', or 'info'

**Flow**:
1. Page mounts -> GameContext provides party (already fetched)
2. User clicks "Heal All" -> Set healing=true, call API
3. API responds -> Call refreshData(), show message
4. Context updates -> UI re-renders with new HP values

### 3. HP Bar Animation

**Decision**: CSS transition on width change.

**Rationale**: Simple, performant, and the existing HPBar component already uses inline styles that can be extended with transition property.

### 4. Move PP Detail View

**Decision**: Defer to future enhancement.

**Rationale**: Spec marks this as optional ("on click or detail view"). Core healing functionality takes priority. Can be added as modal in future iteration.

---

## UI Layout Specification

### Page Layout

```
+------------------------------------------+
|              GAME LAYOUT                  |
|  +------------------------------------+  |
|  |     "Welcome to the Pokemon        |  |
|  |      Center! I'll heal your        |  |
|  |      Pokemon back to full          |  |
|  |      health."                      |  |
|  |           - Nurse Joy              |  |
|  +------------------------------------+  |
|                                          |
|  +------+  +------+  +------+            |
|  | PKM1 |  | PKM2 |  | PKM3 |            |
|  | IMG  |  | IMG  |  | IMG  |            |
|  | HP   |  | HP   |  | HP   |            |
|  +------+  +------+  +------+            |
|  +------+  +------+  +------+            |
|  | PKM4 |  | PKM5 |  | PKM6 |            |
|  | IMG  |  | IMG  |  | IMG  |            |
|  | HP   |  | HP   |  | HP   |            |
|  +------+  +------+  +------+            |
|                                          |
|        +--------------------+            |
|        |     HEAL ALL       |            |
|        +--------------------+            |
|                                          |
|     "Your Pokemon have been healed!"     |
+------------------------------------------+
```

### Responsive Behavior

- **Desktop**: 3-column grid for party cards
- **Tablet**: 2-column grid
- **Mobile**: Single column stack

### Color Scheme

Following existing theme:
- Background: `#1a1a2e`
- Card background: `#16213e`
- Accent: `#e94560` (heal button)
- Success: `#4ade80`
- Error: `#f87171`
- HP Green: `#4ade80`
- HP Yellow: `#facc15`
- HP Red: `#ef4444`

---

## API Integration

### Fetch Party Data

Already handled by GameContext on mount. Access via:
```javascript
const { party, loading, error, refreshData } = useGame();
```

### Heal Action

```javascript
const handleHeal = async () => {
  setHealing(true);
  setMessage(null);

  try {
    const response = await apiFetch('/api/heal', { method: 'POST' });
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Healing failed');
    }

    await refreshData(); // Update context with new HP values
    setMessage('Your Pokemon have been healed!');
    setMessageType('success');
  } catch (err) {
    setMessage(err.message || 'Failed to heal. Please try again.');
    setMessageType('error');
  } finally {
    setHealing(false);
  }
};
```

---

## Edge Case Handling

| Case | Detection | UI Response |
|------|-----------|-------------|
| Empty party | `party.length === 0` | Show empty state message with link to starter selection |
| All healthy | `party.every(p => p.current_hp === p.max_hp)` | Disable button, show "already healthy" message |
| Network error | API throws or returns success: false | Show error message with button enabled for retry |
| Loading state | `loading` from context or local `healing` | Show loading spinner/disabled button |

---

## Files to Create

| File | Description |
|------|-------------|
| `pages/pokecenter.js` | Main Pokemon Center page (stub exists, needs implementation) |

## Files to Modify

None required - reusing existing components as-is.

## Existing Files to Leverage

| File | Usage |
|------|-------|
| `components/layout/GameLayout.js` | Page wrapper with auth and navigation |
| `components/Dashboard/HPBar.js` | Health bar display |
| `components/Dashboard/PartyCard.js` | Pokemon card display |
| `lib/gameContext.js` | Party data and refreshData() |
| `lib/apiFetch.js` | Authenticated API calls |

---

## Post-Design Constitution Re-Check

| Principle | Status | Verification |
|-----------|--------|--------------|
| I. Two-Tier Data Model | PASS | No Source file access from frontend |
| II. External JWT Authentication | PASS | apiFetch() handles tokens |
| IV. Data Merging Pattern | PASS | Using pre-merged API responses |
| V. Serverless Architecture | PASS | Standard Next.js page pattern |
| VII. Educational API Design | PASS | Standard response envelope handling |
| VIII. Spec-Driven Development | PASS | Plan complete, ready for tasks |

**Final Gate Result**: PASS - Ready for task generation via `/speckit.tasks`.
