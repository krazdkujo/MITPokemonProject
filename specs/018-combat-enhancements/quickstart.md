# Quickstart: Combat System Enhancements

**Feature**: 018-combat-enhancements
**Date**: 2026-01-04

## Prerequisites

- Node.js 18+
- npm
- Supabase project with existing schema (active_battles table)
- Dev server access

## Quick Verification

After implementation, verify each enhancement:

### 1. PP Display Fix

```bash
# Start dev server
npm run dev
```

1. Navigate to `/combat`
2. Start a wild encounter
3. Deploy Pokemon and enter combat phase
4. Click on your Pokemon to select it
5. Open move selector
6. **Verify**: Each move shows PP in "X/Y PP" format (e.g., "15/20 PP")
7. Use a move and verify PP decreases
8. For opponent Pokemon (when it's their turn), hover/view should also show correct PP

### 2. Pokemon Stats on Hover

1. During combat, hover over any Pokemon on the grid
2. **Verify**: Tooltip appears within 0.5 seconds showing:
   - Name and level
   - HP bar with current/max values
   - All 6 attributes with modifiers (e.g., "STR: 14 (+2)")
   - AC value
   - Type(s)
   - Proficiency bonus
   - All known moves with current/max PP
   - Active status effects (if any)
3. Move mouse away, tooltip disappears

### 3. Database Persistence

```bash
# In browser console during combat:
console.log("Battle ID:", /* get from state */)
```

1. Start a battle, deploy Pokemon
2. Make several moves (attack, move position)
3. **Refresh the page**
4. **Verify**: Battle resumes with exact same state:
   - Same Pokemon positions
   - Same HP values
   - Same PP values
   - Same turn order
   - Same round number

### 4. Move Ranges

1. During combat, select a Pokemon
2. Select a move
3. **Verify**: Grid highlights valid target cells based on move range:
   - Melee moves: Only adjacent cells highlighted
   - Ranged moves (30ft): Cells within 6 cells highlighted
   - Self moves: Only own cell highlighted
4. Try to target out-of-range enemy
5. **Verify**: Error message appears explaining range limitation

### 5. Movement Ranges

1. During combat, select a Pokemon
2. Click "Move" action
3. **Verify**: Grid highlights all cells within 6 cells (Manhattan distance)
4. **Verify**: Occupied cells are NOT highlighted
5. Click a valid destination
6. **Verify**: Pokemon moves and grid updates
7. Try to move again
8. **Verify**: Movement disabled or shows 0 remaining

### 6. AI Behavior

1. Start a battle with opponent Pokemon
2. End your turn (or use pass action)
3. Observe opponent AI turn
4. **Verify**: AI demonstrates tactical behavior:
   - Moves toward targets if out of range
   - Prefers type-advantaged moves
   - Uses moves with available PP
   - Turn completes within 3 seconds

## File Locations

| Component | Location |
|-----------|----------|
| Move Selector | `components/Combat/MoveSelector.js` |
| Pokemon Tooltip | `components/Combat/PokemonTooltip.js` (NEW) |
| Grid Highlighting | `components/Combat/GridHighlight.js` (NEW) |
| Combat Page | `pages/combat.js` |
| Battle Start API | `pages/api/battle/start.js` |
| Battle Action API | `pages/api/battle/action.js` |
| Move Range Utils | `lib/moveRanges.js` (NEW) |
| Combat AI | `lib/combatAI.js` (NEW) |
| Grid Utils | `lib/gridUtils.js` |
| Battle Engine | `lib/battleEngine.js` |

## API Testing

```bash
# Test valid targets endpoint (new)
curl -X POST http://localhost:3000/api/battle/valid-targets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "battle_id": "uuid-here",
    "actor_id": "combatant-uuid",
    "move_id": "tackle"
  }'

# Expected response:
{
  "success": true,
  "data": {
    "move_range": 1,
    "range_type": "melee",
    "valid_cells": [{"col": 3, "row": 4}, {"col": 4, "row": 3}],
    "valid_targets": ["opponent-combatant-id"]
  }
}

# Test valid movement endpoint (new)
curl -X POST http://localhost:3000/api/battle/valid-movement \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "battle_id": "uuid-here",
    "actor_id": "combatant-uuid"
  }'

# Expected response:
{
  "success": true,
  "data": {
    "movement_remaining": 6,
    "valid_cells": [/* array of {col, row} objects */]
  }
}

# Test AI turn endpoint (new)
curl -X POST http://localhost:3000/api/battle/ai-turn \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "battle_id": "uuid-here",
    "combatant_id": "ai-combatant-uuid"
  }'

# Expected response includes AI decision reasoning
```

## Common Issues

### PP Still Shows Incorrect Values

- Check that `buildOpponentCombatant` returns full move objects in `known_moves`
- Verify `move_pp` object keys match `known_moves[].id`
- Check MoveSelector receives objects not strings

### Tooltip Not Appearing

- Check hover event listener is attached to grid cell
- Verify PokemonTooltip component is rendered
- Check z-index doesn't hide tooltip behind grid

### Range Highlighting Not Working

- Verify `parseRange()` function returns correct cell count
- Check GridHighlight component receives valid_cells data
- Verify CSS for highlighted cells has visible styling

### AI Turn Too Slow

- Check for infinite loops in scoring logic
- Verify pathfinding terminates properly
- Review database calls (should be minimal during AI turn)

### State Not Persisting

- Check browser console for save errors
- Verify active_battles RLS allows updates
- Check state_hash computation is consistent

## Success Metrics Verification

| Metric | How to Verify |
|--------|---------------|
| SC-001: Tooltip in 0.5s | Use browser DevTools Performance tab |
| SC-002: 100% PP accuracy | Compare displayed PP with database values |
| SC-003: State survives refresh | Test with F5 during combat |
| SC-004: Visual move targets | Observe grid highlighting on move select |
| SC-005: Visual movement range | Observe grid highlighting on move action |
| SC-006: AI type advantage 70% | Log AI decisions, count type-advantaged moves |
| SC-007: AI turn under 3s | Measure time from turn start to completion |
