# Quickstart: Pokemon Center Page

**Feature**: 012-pokecenter-page
**Date**: 2026-01-04

## Prerequisites

- Node.js 18+ installed
- Project dependencies installed (`npm install`)
- Supabase local or remote instance running
- Test user account with Pokemon in party

## Development Setup

### 1. Start Development Server

```bash
npm run dev
```

Server runs at `http://localhost:3000`

### 2. Navigate to Pokemon Center

Visit: `http://localhost:3000/pokecenter`

### 3. Test Authentication

Ensure you have a valid test auth token:
```javascript
// Browser console
localStorage.getItem('pokemon_test_auth')
```

If missing, log in via the main application first.

---

## Key Files

| File | Purpose |
|------|---------|
| `pages/pokecenter.js` | Main page component (to implement) |
| `lib/gameContext.js` | Party state management |
| `lib/apiFetch.js` | Authenticated API calls |
| `components/Dashboard/HPBar.js` | Health bar component |
| `components/Dashboard/PartyCard.js` | Pokemon card display |
| `pages/api/heal.js` | Healing endpoint (existing) |
| `pages/api/player/pokemon.js` | Party fetch endpoint (existing) |

---

## Testing the Heal Flow

### Manual Testing

1. Log in to the application
2. Select a starter Pokemon (if not already done)
3. Damage Pokemon via `/wild` encounters or `/combat`
4. Navigate to `/pokecenter`
5. Verify party displays with HP bars
6. Click "Heal All"
7. Verify HP bars fill to max
8. Verify success message displays

### API Testing (curl)

```bash
# Get party status
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/player/pokemon

# Heal party
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/player/pokemon
```

---

## Component Usage Examples

### Using GameContext

```javascript
import { useGame } from '../lib/gameContext';

function PokeCenterContent() {
  const { party, loading, error, refreshData } = useGame();

  const handleHeal = async () => {
    const response = await apiFetch('/api/heal', { method: 'POST' });
    if (response.ok) {
      await refreshData(); // Update context
    }
  };

  return (/* ... */);
}
```

### Using HPBar Component

```javascript
import HPBar from '../components/Dashboard/HPBar';

<HPBar current={pokemon.current_hp} max={pokemon.max_hp} />
```

### Using PartyCard Component

```javascript
import PartyCard from '../components/Dashboard/PartyCard';

<PartyCard pokemon={pokemon} onClick={() => showDetails(pokemon)} />
```

---

## Edge Cases to Test

| Scenario | Expected Behavior |
|----------|-------------------|
| Empty party | Show "No Pokemon" message |
| All healthy | Disable "Heal All" button |
| Network error | Show error with retry option |
| Single Pokemon | Display centered |
| Full party (6) | Display in grid |
| Fainted Pokemon | Show with reduced opacity |

---

## Common Issues

### Token Expired
Re-login to refresh authentication token.

### Party Not Loading
Check browser console for API errors. Verify Supabase connection.

### HP Not Updating After Heal
Ensure `refreshData()` is called after successful heal API response.
