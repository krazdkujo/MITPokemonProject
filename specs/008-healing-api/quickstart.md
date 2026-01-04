# Quickstart: Healing API

**Feature**: 008-healing-api
**Date**: 2026-01-03

## What This Feature Does

Provides a single API endpoint that heals all active party Pokemon to full HP and restores all move PP. This is a free operation designed for use in N8N workflows between battles.

## Key Files

| File | Purpose |
|------|---------|
| `pages/api/heal.js` | The API endpoint handler (NEW) |
| `lib/pokemonData.js` | Data utilities (existing - initializeMovePP, buildPlayerPokemonListResponse) |
| `lib/authHelper.js` | JWT authentication (existing) |
| `lib/apiResponse.js` | Response formatting (existing) |

## Implementation Checklist

- [ ] Create `pages/api/heal.js`
- [ ] Import existing utilities (no new lib code needed)
- [ ] Implement POST handler with authentication
- [ ] Query active Pokemon (is_active = true)
- [ ] Update HP and PP for each Pokemon
- [ ] Return merged response with Source data
- [ ] Test with curl/Postman
- [ ] Verify N8N workflow integration

## Quick Reference

### Endpoint

```
POST /api/heal
Authorization: Bearer <jwt_token>
```

### Response Format

```json
{
  "success": true,
  "data": {
    "healed": [/* array of healed Pokemon with Source data */],
    "healed_count": 2,
    "message": "Party healed successfully"
  }
}
```

### Key Functions to Use

```javascript
// Authentication
const { userId, error } = await authenticateRequest(req);

// Database query
const { data, error } = await supabase
  .from('player_pokemon')
  .select('*')
  .eq('user_id', userId)
  .eq('is_active', true);

// PP restoration
const newMovePP = initializeMovePP(pokemon.selected_moves);

// Response formatting
const response = buildPlayerPokemonListResponse(updatedPokemon);
```

## Testing

```bash
# Test with curl
curl -X POST http://localhost:3000/api/heal \
  -H "Authorization: Bearer <your_jwt_token>"

# Expected: 200 OK with healed Pokemon array
```

## Common Issues

1. **401 Unauthorized**: Check JWT token is valid and not expired
2. **Empty healed array**: User has no active Pokemon (all in box)
3. **PP not restoring**: Ensure selected_moves array is populated

## Next Steps After Implementation

1. Run `/speckit.tasks` to generate the task list
2. Implement the endpoint following the tasks
3. Test manually with a damaged party
4. Integrate into N8N battle workflow
