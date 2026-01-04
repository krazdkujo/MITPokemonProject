# Quickstart: Player Dashboard

**Feature**: 003-player-dashboard
**Date**: 2026-01-03

## Prerequisites

Before starting implementation:

1. **Branch**: Checkout `003-player-dashboard` branch
2. **Dependencies**: Run `npm install` (no new packages needed)
3. **Database**: Ensure Supabase connection is configured in `.env.local`
4. **Migrations**: Previous migrations (001, 002) must be applied

## Quick Implementation Path

### Step 1: Database Migration

Apply the HP fields migration:

```bash
# From project root
node scripts/run-migrations.js
```

Or manually run in Supabase SQL editor:
```sql
-- Add HP fields to player_pokemon
ALTER TABLE player_pokemon
ADD COLUMN IF NOT EXISTS current_hp INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_hp INTEGER NOT NULL DEFAULT 1;

-- Update existing starter Pokemon with calculated HP
UPDATE player_pokemon
SET max_hp = 10 + (level * 2), current_hp = 10 + (level * 2)
WHERE max_hp = 1;
```

### Step 2: Update API Response

Modify `/pages/api/player/pokemon.js` to include new fields:

```javascript
// In handleGet function, after fetching playerPokemon:

// Calculate summary counts
const activeCount = playerPokemon.filter(p => p.is_active).length;
const boxCount = playerPokemon.filter(p => !p.is_active).length;

// Get distinct pokemon_id count for Pokedex
const { data: pokedexData } = await supabase
  .from('player_pokemon')
  .select('pokemon_id')
  .eq('user_id', userId);
const pokedexCaught = new Set(pokedexData?.map(p => p.pokemon_id) || []).size;

return sendSuccess(res, {
  pokemon: buildPlayerPokemonListResponse(playerPokemon || []),
  has_starter: playerPokemon.length > 0,
  active_count: activeCount,
  box_count: boxCount,
  pokedex_caught: pokedexCaught,
  badge_count: 0, // Placeholder until badges implemented
  total_count: playerPokemon.length,
});
```

### Step 3: Update Data Merging

Add HP fields to `lib/pokemonData.js` buildPlayerPokemonResponse:

```javascript
return {
  id: dbRecord.id,
  pokemon_id: dbRecord.pokemon_id,
  name: sourcePokemon.name,
  type: sourcePokemon.type,
  level: dbRecord.level,
  current_hp: dbRecord.current_hp,    // Add this
  max_hp: dbRecord.max_hp,            // Add this
  is_active: dbRecord.is_active,
  slot_number: dbRecord.slot_number,
  sprite: sourcePokemon.media?.sprite || null,
  artwork: sourcePokemon.media?.main || null,
};
```

### Step 4: Create Dashboard Components

Create `components/Dashboard/` directory with these files:

**HPBar.js** - Reusable HP bar component:
```javascript
export default function HPBar({ current, max }) {
  const percentage = Math.round((current / max) * 100);
  const colorClass = percentage > 50 ? 'hp-green'
    : percentage > 25 ? 'hp-yellow'
    : 'hp-red';

  return (
    <div className="hp-bar">
      <div className={`hp-fill ${colorClass}`} style={{ width: `${percentage}%` }} />
      <span className="hp-text">{current} / {max}</span>
    </div>
  );
}
```

**PartyCard.js** - Single Pokemon card:
```javascript
import HPBar from './HPBar';

export default function PartyCard({ pokemon }) {
  return (
    <div className="party-card">
      <img src={pokemon.sprite || pokemon.artwork} alt={pokemon.name} />
      <h3>{pokemon.name}</h3>
      <div className="types">{pokemon.type.join(' / ')}</div>
      <p>Lv. {pokemon.level}</p>
      <HPBar current={pokemon.current_hp} max={pokemon.max_hp} />
    </div>
  );
}
```

**PartyRoster.js** - Active party grid:
```javascript
import PartyCard from './PartyCard';

export default function PartyRoster({ pokemon }) {
  const activePokemon = pokemon.filter(p => p.is_active)
    .sort((a, b) => a.slot_number - b.slot_number);

  return (
    <div className="party-roster">
      {activePokemon.map(p => <PartyCard key={p.id} pokemon={p} />)}
      {activePokemon.length === 0 && <p>No active Pokemon</p>}
    </div>
  );
}
```

**StatsSummary.js** - Dashboard stats:
```javascript
export default function StatsSummary({ boxCount, pokedexCaught, badgeCount }) {
  return (
    <div className="stats-summary">
      <div className="stat">
        <span className="stat-value">{boxCount}</span>
        <span className="stat-label">In Box</span>
      </div>
      <div className="stat">
        <span className="stat-value">{pokedexCaught}</span>
        <span className="stat-label">Pokedex</span>
      </div>
      <div className="stat">
        <span className="stat-value">{badgeCount}</span>
        <span className="stat-label">Badges</span>
      </div>
    </div>
  );
}
```

### Step 5: Update Dashboard Page

Replace `pages/dashboard.js` content to use new components:

```javascript
import PartyRoster from '../components/Dashboard/PartyRoster';
import StatsSummary from '../components/Dashboard/StatsSummary';
// ... existing imports

function DashboardContent() {
  const [data, setData] = useState(null);
  // ... fetch logic

  return (
    <div className="dashboard">
      <h1>Welcome, Trainer!</h1>
      <StatsSummary
        boxCount={data.box_count}
        pokedexCaught={data.pokedex_caught}
        badgeCount={data.badge_count}
      />
      <PartyRoster pokemon={data.pokemon} />
      <Link href="/stats">View Detailed Stats</Link>
    </div>
  );
}
```

## Testing

### Manual Testing Steps

1. Start dev server: `npm run dev`
2. Login via /test-auth
3. Navigate to /dashboard
4. Verify:
   - Active party displays with correct Pokemon info
   - HP bars show correct colors (green/yellow/red)
   - Box count shows storage Pokemon count
   - Pokedex shows distinct species count
   - Badge count shows 0

### Test Scenarios

| Scenario | Expected Result |
|----------|-----------------|
| New user (no Pokemon) | Empty state message, all counts = 0 |
| User with 1 starter | 1 Pokemon card, active_count = 1, box_count = 0 |
| User with 3 active, 2 in box | 3 cards shown, box_count = 2 |
| Pokemon at full HP | Green HP bar at 100% |
| Pokemon at 30% HP | Yellow HP bar |
| Pokemon at 10% HP | Red HP bar |

## Verification Checklist

- [ ] Migration applied successfully
- [ ] API returns new fields (current_hp, max_hp, pokedex_caught, badge_count)
- [ ] Dashboard displays active party
- [ ] HP bars show correct colors
- [ ] Stats summary shows box/pokedex/badge counts
- [ ] Loading state displays while fetching
- [ ] Error state displays on API failure
- [ ] Stats page link present and functional
