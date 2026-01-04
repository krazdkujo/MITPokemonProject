# Quickstart: Game Navigation Layout

**Feature**: 011-game-layout
**Date**: 2026-01-04

## Prerequisites

- Node.js 18+
- Running Supabase instance with existing tables (users, player_pokemon, player_inventory)
- Existing user account with at least one Pokemon

## Development Setup

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

Server runs at http://localhost:3000

## Testing the Layout

### 1. Login

Navigate to http://localhost:3000/test-auth and log in with test credentials.

### 2. Access Dashboard

After login, you'll be redirected to /dashboard. The GameLayout should display:

- **Top Navigation**: Game title, currency badge (e.g., "500"), player name
- **Left Sidebar**:
  - 6 navigation links (Dashboard, Combat, PokeMart, Pokemon Center, Wild, Inventory)
  - Mini party display showing your Pokemon with HP bars

### 3. Test Navigation

Click each navigation link and verify:
- Correct page loads
- Active link is highlighted
- Layout persists across pages
- Currency and party display remain consistent

### 4. Test Party Display

Verify mini party shows:
- Pokemon sprite/image
- HP bar with correct color (green >75%, yellow 25-75%, red <25%)
- Click navigates to Pokemon Center

## File Locations

| Component | Path |
|-----------|------|
| GameLayout | components/layout/GameLayout.js |
| TopNav | components/layout/TopNav.js |
| SideNav | components/layout/SideNav.js |
| MiniPartyDisplay | components/layout/MiniPartyDisplay.js |
| CurrencyBadge | components/layout/CurrencyBadge.js |
| NavLink | components/layout/NavLink.js |
| GameContext | lib/gameContext.js |

## Integration Checklist

After implementation, verify each page works with GameLayout:

- [ ] /dashboard - Dashboard page with layout
- [ ] /combat - Combat Arena (placeholder)
- [ ] /pokemart - PokeMart shop (placeholder)
- [ ] /pokecenter - Pokemon Center healing (placeholder)
- [ ] /wild - Wild Pokemon encounters (placeholder)
- [ ] /inventory - Inventory management (placeholder)

## Common Issues

### Layout not showing
- Ensure page component wraps content with `<GameLayout>`
- Check that AuthGuard is properly configured

### Currency shows 0
- Verify /api/player/inventory endpoint is working
- Check browser console for API errors

### Party not displaying
- Verify /api/player/pokemon endpoint returns active Pokemon
- Ensure user has at least one Pokemon with `is_active: true`

### Navigation links not working
- Check Next.js Link component usage
- Verify target pages exist (even as placeholders)
