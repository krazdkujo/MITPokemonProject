# Quickstart: Wild Pokemon Encounter Page

**Feature**: 014-wild-encounter
**Date**: 2026-01-04

## Prerequisites

- Node.js 18+ installed
- Project cloned and dependencies installed (`npm install`)
- Supabase database configured
- At least one user with a Pokemon party

## Development Setup

```bash
# Start development server
npm run dev

# Visit wild encounter page
open http://localhost:3000/wild
```

## File Changes Summary

### New Files

| Path | Purpose |
|------|---------|
| `Source/locations.json` | Location data (4 MVP locations) |
| `lib/locationData.js` | Location loading utilities |
| `pages/api/locations.js` | API to serve locations |
| `components/Wild/LocationCard.js` | Location display component |
| `components/Wild/LocationSelector.js` | Location grid component |
| `components/Wild/EncounterDisplay.js` | Wild Pokemon display |
| `components/Wild/EncounterActions.js` | Battle/Flee buttons |

### Modified Files

| Path | Changes |
|------|---------|
| `pages/wild.js` | Replace placeholder with encounter UI |

## Implementation Order

1. **Data Layer**
   - Create `Source/locations.json`
   - Create `lib/locationData.js`
   - Create `pages/api/locations.js`

2. **UI Components**
   - Create `LocationCard.js`
   - Create `LocationSelector.js`
   - Create `EncounterDisplay.js`
   - Create `EncounterActions.js`

3. **Page Integration**
   - Update `pages/wild.js`
   - Connect state management
   - Add navigation to combat

## Testing Checklist

### Location Selection
- [ ] Page loads and displays location grid
- [ ] Each location shows name, Pokemon, level range
- [ ] Clicking a location highlights it
- [ ] Only one location can be selected at a time
- [ ] Search button disabled when no location selected
- [ ] Search button enabled when location selected

### Encounter Generation
- [ ] Clicking search shows loading state
- [ ] Wild Pokemon appears with sprite, name, level, types
- [ ] Pokemon is from the selected location's pool
- [ ] Level is within location's range
- [ ] Battle and Flee buttons appear

### Battle Flow
- [ ] Clicking Battle calls /api/battle/start
- [ ] Navigates to /combat with battle_id
- [ ] Error shown if all party Pokemon fainted
- [ ] Error shown if API fails

### Flee Flow
- [ ] Clicking Flee clears the encounter
- [ ] Returns to location selection state
- [ ] Can search again immediately

### Error States
- [ ] No party: Shows error with link to starter selection
- [ ] All fainted: Shows error with link to Pokemon Center
- [ ] API error: Shows retry option

## Key Code Patterns

### Using GameContext

```javascript
import { useGame } from '../lib/gameContext';

function WildContent() {
  const { party, loading } = useGame();

  // Check party status
  const hasParty = party.length > 0;
  const hasHealthyPokemon = party.some(p => p.current_hp > 0);
}
```

### Loading Locations

```javascript
import { useState, useEffect } from 'react';

const [locations, setLocations] = useState([]);

useEffect(() => {
  fetch('/api/locations')
    .then(res => res.json())
    .then(data => setLocations(data.locations));
}, []);
```

### Starting Encounter

```javascript
import { apiFetch } from '../lib/authContext';

const startBattle = async () => {
  const wildPokemonId = selectRandomPokemon(selectedLocation);
  const wildLevel = generateEncounterLevel(selectedLocation);
  const playerPokemon = party.find(p => p.current_hp > 0);

  const response = await apiFetch('/api/battle/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      player_pokemon_id: playerPokemon.id,
      opponent_pokemon_id: wildPokemonId,
      opponent_level: wildLevel,
      battle_type: 'wild'
    })
  });

  if (response.success) {
    // Store encounter data and show Battle/Flee options
    setEncounter(response.data.opponent);
    setBattleData(response.data);
  }
};
```

### Navigation to Combat

```javascript
import { useRouter } from 'next/router';

const router = useRouter();

const handleBattle = () => {
  router.push({
    pathname: '/combat',
    query: { battle_id: battleData.battle_id }
  });
};

const handleFlee = () => {
  setEncounter(null);
  setBattleData(null);
};
```

## Styling Reference

Follow existing patterns from other pages:

```javascript
<style jsx>{`
  .location-card {
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .location-card:hover {
    border-color: rgba(251, 191, 36, 0.5);
    transform: translateY(-2px);
  }

  .location-card.selected {
    border-color: #fbbf24;
    background: rgba(251, 191, 36, 0.1);
  }

  .search-button {
    background: #fbbf24;
    color: #1a1a2e;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
  }

  .search-button:disabled {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.3);
    cursor: not-allowed;
  }
`}</style>
```

## Common Issues

### Pokemon sprites not loading
- Ensure Pokemon number exists in `public/images/pokemon/`
- Check console for 404 errors

### Auth errors on battle start
- Verify user is logged in
- Check Authorization header in network tab

### Locations not loading
- Check `/api/locations` endpoint response
- Verify `Source/locations.json` exists and is valid JSON

## Next Steps After Implementation

1. **Manual Testing**: Run through all checklist items
2. **Combat Page**: Combat page needs full battle UI implementation
3. **Polish**: Add animations for encounter reveal
4. **Future**: Add more locations, time-of-day variants
