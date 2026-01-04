# Research: Game Navigation Layout

**Feature**: 011-game-layout
**Date**: 2026-01-04

## Research Topics

### 1. React Context for Layout-Level State Management

**Decision**: Use React Context with useContext hook for sharing player data (currency, party) from GameLayout to child pages.

**Rationale**:
- Follows existing pattern established by AuthContext in the codebase
- Avoids prop drilling through multiple component levels
- Single data fetch at layout mount, shared across all pages
- Native React solution - no additional dependencies needed
- Provides `refreshData()` function for child pages to trigger updates after actions

**Alternatives Considered**:
- **Redux/Zustand**: Overkill for this use case; only need layout-level state, not complex global state
- **Props drilling**: Tedious and error-prone with deep component trees
- **SWR/React Query**: Considered but adds dependency; simple Context + fetch is sufficient for this scope

**Implementation Pattern**:
```javascript
// lib/gameContext.js
const GameContext = createContext({
  currency: 0,
  party: [],
  loading: true,
  error: null,
  refreshData: async () => {},
});

export function GameProvider({ children }) {
  // Fetch player data on mount
  // Provide refreshData for child pages to call after actions
}
```

### 2. Next.js Layout Pattern

**Decision**: Create a GameLayout component that wraps page content, used by each game page individually.

**Rationale**:
- Next.js 14 Pages Router (not App Router) - layout is per-page, not nested
- Each game page imports and uses GameLayout as a wrapper
- Maintains consistency with existing AuthGuard pattern
- Allows pages to opt-in to game layout vs. non-game pages (login, etc.)

**Alternatives Considered**:
- **_app.js global layout**: Would apply to all pages including login; not desirable
- **Next.js App Router nested layouts**: Project uses Pages Router
- **Higher-order component**: Less readable than wrapper component

**Implementation Pattern**:
```javascript
// pages/combat.js
export default function CombatPage() {
  return (
    <GameLayout>
      <CombatContent />
    </GameLayout>
  );
}
```

### 3. Navigation Active State Detection

**Decision**: Use Next.js `useRouter` hook to detect current path and compare with nav link hrefs.

**Rationale**:
- Native Next.js solution, no additional dependencies
- `router.pathname` gives current route for comparison
- Consistent with Next.js navigation patterns

**Alternatives Considered**:
- **Manual state tracking**: Error-prone, duplicates router state
- **CSS-only with :current**: Not supported for SPA navigation

**Implementation Pattern**:
```javascript
const router = useRouter();
const isActive = router.pathname === href;
```

### 4. HP Bar Color Thresholds

**Decision**: Reuse existing HPBar component thresholds with minor adjustment for spec compliance.

**Existing thresholds** (from components/Dashboard/HPBar.js):
- Green: >50%
- Yellow: 25-50%
- Red: <25%

**Spec requirement**:
- Green: >75%
- Yellow/Orange: 25-75%
- Red: <25%

**Rationale**: Create a variant or update thresholds to match spec. Since this is a mini display, we'll create a new MiniHPBar component or pass threshold props to existing HPBar.

**Decision**: Add optional `thresholds` prop to HPBar or create compact version for sidebar.

### 5. Icon Library for Navigation

**Decision**: Use inline SVG icons or simple Unicode characters for navigation links.

**Rationale**:
- No additional icon library dependency
- Full control over styling and colors
- Small bundle size impact
- Consistent with minimalist approach

**Alternatives Considered**:
- **react-icons**: Adds dependency for 6 icons
- **Font Awesome**: Heavy dependency, requires font loading
- **Heroicons**: Good option but adds dependency

**Icon Mapping**:
| Route | Icon Approach |
|-------|---------------|
| /combat | Inline SVG (crossed swords) |
| /pokemart | Inline SVG (shopping bag) |
| /pokecenter | Inline SVG (heart/plus) |
| /wild | Inline SVG (grass/tree) |
| /inventory | Inline SVG (backpack) |
| /dashboard | Inline SVG (home) |

### 6. Currency Update Animation

**Decision**: CSS transition on currency value change using state comparison.

**Rationale**:
- Lightweight, no animation library needed
- Brief highlight/pulse when value changes
- Uses CSS transitions for smooth effect

**Implementation Pattern**:
```javascript
const [prevCurrency, setPrevCurrency] = useState(currency);
const [animating, setAnimating] = useState(false);

useEffect(() => {
  if (currency !== prevCurrency) {
    setAnimating(true);
    setPrevCurrency(currency);
    setTimeout(() => setAnimating(false), 500);
  }
}, [currency]);
```

### 7. API Endpoints for Layout Data

**Decision**: Use existing endpoints, no new APIs needed.

**Endpoints Used**:
| Data | Endpoint | Notes |
|------|----------|-------|
| Party Pokemon | GET /api/player/pokemon | Returns pokemon array with HP data |
| Currency | GET /api/player/inventory | Returns currency in response |

**Optimization**: Fetch both in parallel at layout mount:
```javascript
const [pokemonRes, inventoryRes] = await Promise.all([
  apiFetch('/api/player/pokemon'),
  apiFetch('/api/player/inventory'),
]);
```

### 8. Fainted Pokemon Indicator

**Decision**: Show grayscale/desaturated Pokemon sprite with "X" or crossed-out indicator when current_hp === 0.

**Rationale**:
- Clear visual distinction from low HP (red bar)
- Follows Pokemon game conventions
- Uses CSS filter for grayscale effect

**Implementation**:
```css
.fainted {
  filter: grayscale(100%);
  opacity: 0.6;
}
.fainted-indicator {
  /* X overlay or badge */
}
```

## Summary

All research topics resolved. No external dependencies required beyond existing stack. Implementation follows established codebase patterns (Context, AuthGuard wrapper, existing component reuse).
