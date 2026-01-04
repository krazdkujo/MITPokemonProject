# Data Model: Game Navigation Layout

**Feature**: 011-game-layout
**Date**: 2026-01-04

## Overview

This feature is primarily a frontend layout implementation. No new database tables are required. The layout consumes data from existing tables via existing API endpoints.

## Existing Entities Used

### users (existing table)

Referenced for player identity and currency display.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| email | TEXT | User email |
| name | TEXT | Display name (shown in top nav) |
| currency | INTEGER | Player's current balance (shown in top nav) |

### player_pokemon (existing table)

Referenced for party Pokemon display in sidebar.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Owner reference |
| pokemon_id | TEXT | Reference to Source Pokemon data |
| level | INTEGER | Pokemon level |
| current_hp | INTEGER | Current HP (for HP bar display) |
| max_hp | INTEGER | Maximum HP (for HP bar percentage) |
| is_active | BOOLEAN | True if in active party (slot 1-6) |
| slot_number | INTEGER | Party position (1-6 for active) |

## Client-Side State Models

### GameContext State

React Context state managed at layout level:

```typescript
interface GameContextState {
  // Player info
  playerName: string;
  currency: number;

  // Party Pokemon (active only, max 6)
  party: PartyPokemon[];

  // Loading/error states
  loading: boolean;
  error: string | null;

  // Actions
  refreshData: () => Promise<void>;
  updateCurrency: (newAmount: number) => void;
  updateParty: (newParty: PartyPokemon[]) => void;
}
```

### PartyPokemon (Client Model)

Merged data from API response (database + Source):

```typescript
interface PartyPokemon {
  id: string;              // UUID from database
  pokemon_id: string;      // Source reference
  name: string;            // From Source
  level: number;
  current_hp: number;
  max_hp: number;
  slot_number: number;
  sprite_url: string;      // Derived: /images/pokemon/{pokemon_id}.png
  is_fainted: boolean;     // Derived: current_hp === 0
  hp_percentage: number;   // Derived: (current_hp / max_hp) * 100
}
```

### Navigation Link Model

Static configuration for sidebar navigation:

```typescript
interface NavLink {
  href: string;
  label: string;
  icon: string;            // SVG path or component name
}

const NAV_LINKS: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'home' },
  { href: '/combat', label: 'Combat Arena', icon: 'sword' },
  { href: '/pokemart', label: 'PokeMart', icon: 'shop' },
  { href: '/pokecenter', label: 'Pokemon Center', icon: 'heal' },
  { href: '/wild', label: 'Wild Pokemon', icon: 'grass' },
  { href: '/inventory', label: 'Inventory', icon: 'bag' },
];
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         GameLayout                               │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ On Mount: Parallel API Fetch                                │ │
│  │                                                             │ │
│  │  GET /api/player/pokemon ──► party[], has_starter           │ │
│  │  GET /api/player/inventory ──► currency                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ GameContext.Provider                                        │ │
│  │   value: { playerName, currency, party, refreshData, ... } │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│         ┌────────────────────┼────────────────────┐             │
│         ▼                    ▼                    ▼             │
│   ┌──────────┐        ┌───────────┐        ┌──────────┐        │
│   │  TopNav  │        │  SideNav  │        │ Children │        │
│   │          │        │           │        │ (pages)  │        │
│   │ Currency │        │ NavLinks  │        │          │        │
│   │ Player   │        │ MiniParty │        │ useGame()│        │
│   └──────────┘        └───────────┘        └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

## State Updates

### After Purchase (PokeMart)

```javascript
// In page component after successful purchase
const { refreshData } = useGame();
await refreshData(); // Re-fetches currency and party
```

### After Healing (Pokemon Center)

```javascript
// In page component after successful heal
const { refreshData } = useGame();
await refreshData(); // Re-fetches party with updated HP
```

### After Battle/Catch (Combat/Wild)

```javascript
// After battle ends or catch completes
const { refreshData } = useGame();
await refreshData(); // Updates party HP and potentially new Pokemon
```

## No Database Migrations Required

This feature uses existing tables and endpoints. No new migrations needed.
