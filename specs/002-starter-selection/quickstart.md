# Quickstart: Starter Pokemon Selection

**Feature**: 002-starter-selection
**Date**: 2026-01-03

## Prerequisites

1. Completed 001-env-auth-setup (environment variables, Supabase connection, test auth)
2. Node.js 18+ installed
3. Development server running (`npm run dev`)

## Database Setup

Run the migration to create the player_pokemon table:

```bash
# Using Supabase CLI
supabase db push

# Or manually in Supabase SQL editor
# Copy contents of sql/002_create_player_pokemon.sql
```

## Testing the Feature

### 1. Start Fresh (No Pokemon)

```bash
# Login as a new test user
curl -X POST http://localhost:3000/api/auth/test-login \
  -H "Content-Type: application/json" \
  -d '{"email": "newplayer@test.com", "name": "New Player"}'

# Save the access_token from the response
```

### 2. Verify Redirect to Starter Selection

Open browser to http://localhost:3000 - should redirect to /starter-select

### 3. View Available Starters

```bash
curl http://localhost:3000/api/pokemon/starters \
  -H "Authorization: Bearer <token>"
```

Expected: List of Pokemon with SR <= 0.5

### 4. Filter by Type

```bash
curl "http://localhost:3000/api/pokemon/starters?types=fire" \
  -H "Authorization: Bearer <token>"
```

Expected: Only Fire-type starters

### 5. Select a Starter

```bash
curl -X POST http://localhost:3000/api/player/pokemon \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"pokemon_id": "charmander", "is_starter": true}'
```

Expected: 201 Created with Pokemon details

### 6. Verify Starter Selected

```bash
curl http://localhost:3000/api/player/pokemon \
  -H "Authorization: Bearer <token>"
```

Expected: `has_starter: true` with the selected Pokemon

### 7. Verify No Double Selection

```bash
curl -X POST http://localhost:3000/api/player/pokemon \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"pokemon_id": "squirtle", "is_starter": true}'
```

Expected: 409 Conflict - "You have already selected a starter Pokemon"

## UI Testing Flow

1. Clear any existing test user data (or use new email)
2. Go to http://localhost:3000/test-auth
3. Login with test credentials
4. Should redirect to /starter-select
5. Browse Pokemon grid
6. Use type filters
7. Click a Pokemon card
8. Confirm in modal
9. Should redirect to /dashboard
10. Refresh page - should stay on dashboard (not redirect to starter-select)

## Common Issues

### "UNAUTHORIZED" on API calls
- Ensure you're passing the access_token from login response
- Token expires after 1 hour

### "Pokemon not found" error
- Verify pokemon_id matches an ID in Source/pokemon/pokemon.json
- IDs are lowercase (e.g., "bulbasaur" not "Bulbasaur")

### Starter selection succeeds but redirect fails
- Check browser console for JavaScript errors
- Verify /dashboard page exists

### RLS errors on database operations
- Ensure migration was run with RLS policies
- Verify auth.uid() returns correct user_id

## Files to Implement

1. `sql/002_create_player_pokemon.sql` - Database migration
2. `lib/pokemonData.js` - Source data utilities
3. `pages/api/pokemon/starters.js` - Starters endpoint
4. `pages/api/player/pokemon.js` - Player Pokemon CRUD
5. `pages/api/player/pokemon/check.js` - Quick has-pokemon check
6. `pages/starter-select.js` - Selection page
7. `pages/dashboard.js` - Post-selection landing
8. `components/starter/StarterGrid.js` - Pokemon grid
9. `components/starter/StarterCard.js` - Pokemon card
10. `components/starter/TypeFilterBar.js` - Type filters
11. `components/starter/ConfirmationModal.js` - Selection modal
12. `components/layout/AuthGuard.js` - Route protection
