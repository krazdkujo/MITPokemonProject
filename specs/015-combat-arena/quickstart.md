# Quickstart Guide: Combat Arena

**Feature Branch**: `015-combat-arena`
**Created**: 2026-01-04

## Overview

This guide provides a quick reference for implementing and testing the Combat Arena feature.

---

## Prerequisites

1. Running Next.js development server: `npm run dev`
2. Valid authentication token in localStorage
3. At least one Pokemon in party with HP > 0
4. Access to wild encounter data (from wild.js page)

---

## Key Files

### New Files to Create

| File | Purpose |
|------|---------|
| `pages/combat.js` | Main Combat Arena page |
| `lib/gridUtils.js` | Grid coordinate helpers |
| `pages/api/battle/action.js` | Battle action endpoint |
| `pages/api/battle/flee.js` | Flee action endpoint |
| `components/Combat/BattleGrid.js` | 10x10 grid component |
| `components/Combat/GridSquare.js` | Single grid cell |
| `components/Combat/PokemonToken.js` | Pokemon sprite with HP |
| `components/Combat/MoveSelector.js` | Move list panel |
| `components/Combat/BattleLog.js` | Action history log |
| `components/Combat/TurnIndicator.js` | Turn order display |
| `components/Combat/BattleControls.js` | Action buttons |

### Existing Files to Modify

| File | Changes |
|------|---------|
| `pages/api/battle/start.js` | Add grid_mode support |
| `lib/battleEngine.js` | Add position tracking to combatants |

---

## Development Workflow

### Step 1: Grid Utilities

Create `lib/gridUtils.js`:

```javascript
const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

export function toGridNotation(col, row) {
  return `${COLUMNS[col]}${row + 1}`;
}

export function fromGridNotation(notation) {
  const col = COLUMNS.indexOf(notation[0].toUpperCase());
  const row = parseInt(notation.slice(1), 10) - 1;
  return { col, row };
}

export function getManhattanDistance(pos1, pos2) {
  return Math.abs(pos1.col - pos2.col) + Math.abs(pos1.row - pos2.row);
}

export function isValidPosition(col, row) {
  return col >= 0 && col < 10 && row >= 0 && row < 10;
}

export function getValidMoveTargets(position, maxDistance, occupiedPositions) {
  const valid = [];
  for (let col = 0; col < 10; col++) {
    for (let row = 0; row < 10; row++) {
      const dist = getManhattanDistance(position, { col, row });
      if (dist > 0 && dist <= maxDistance) {
        const isOccupied = occupiedPositions.some(
          p => p.col === col && p.row === row
        );
        if (!isOccupied) {
          valid.push({ col, row, notation: toGridNotation(col, row) });
        }
      }
    }
  }
  return valid;
}
```

### Step 2: Basic Grid Component

Create `components/Combat/BattleGrid.js`:

```jsx
import GridSquare from './GridSquare';

const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

export default function BattleGrid({
  grid,
  onSquareClick,
  highlightedSquares,
  phase
}) {
  return (
    <div className="battle-grid">
      {/* Column labels */}
      <div className="grid-row header">
        <div className="grid-label" />
        {COLUMNS.map(col => (
          <div key={col} className="grid-label">{col}</div>
        ))}
      </div>

      {/* Grid rows */}
      {Array.from({ length: 10 }, (_, rowIndex) => (
        <div key={rowIndex} className="grid-row">
          <div className="grid-label">{rowIndex + 1}</div>
          {Array.from({ length: 10 }, (_, colIndex) => (
            <GridSquare
              key={`${colIndex}-${rowIndex}`}
              col={colIndex}
              row={rowIndex}
              cell={grid[rowIndex][colIndex]}
              isHighlighted={highlightedSquares.some(
                s => s.col === colIndex && s.row === rowIndex
              )}
              isDeploymentZone={phase === 'setup' && rowIndex < 2}
              onClick={() => onSquareClick(colIndex, rowIndex)}
            />
          ))}
        </div>
      ))}

      <style jsx>{`
        .battle-grid {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .grid-row {
          display: flex;
          gap: 2px;
        }
        .grid-label {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}
```

### Step 3: Combat Page Structure

Create `pages/combat.js`:

```jsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import GameLayout from '../components/layout/GameLayout';
import BattleGrid from '../components/Combat/BattleGrid';
import MoveSelector from '../components/Combat/MoveSelector';
import BattleLog from '../components/Combat/BattleLog';
import TurnIndicator from '../components/Combat/TurnIndicator';
import BattleControls from '../components/Combat/BattleControls';
import { apiFetch } from '../lib/apiFetch';

export default function CombatPage() {
  const router = useRouter();
  const [battleState, setBattleState] = useState(null);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [selectedMove, setSelectedMove] = useState(null);
  const [highlightedSquares, setHighlightedSquares] = useState([]);
  const [battleLog, setBattleLog] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize battle from query params or state
  useEffect(() => {
    const initBattle = async () => {
      // Get battle params from router query or localStorage
      const params = router.query;
      if (!params.opponent_id) {
        router.push('/wild');
        return;
      }

      // Start battle
      const response = await apiFetch('/api/battle/start', {
        method: 'POST',
        body: JSON.stringify({
          player_pokemon_ids: params.party_ids?.split(',') || [],
          opponent_pokemon_id: params.opponent_id,
          opponent_level: parseInt(params.level) || 5,
          battle_type: 'wild',
          grid_mode: true
        })
      });

      if (response.success) {
        setBattleState(response.data);
      }
      setLoading(false);
    };

    initBattle();
  }, [router.query]);

  // ... action handlers ...

  if (loading) return <div>Loading battle...</div>;
  if (!battleState) return <div>Failed to start battle</div>;

  return (
    <GameLayout>
      <div className="combat-arena">
        <TurnIndicator
          initiativeOrder={battleState.initiative_order}
          combatants={[...battleState.player_pokemon, ...battleState.opponent_pokemon]}
          currentTurnIndex={battleState.current_turn_index}
        />

        <div className="battle-main">
          <BattleGrid
            grid={battleState.grid}
            onSquareClick={handleSquareClick}
            highlightedSquares={highlightedSquares}
            phase={battleState.phase}
          />

          <div className="battle-sidebar">
            <MoveSelector
              pokemon={selectedPokemon}
              onMoveSelect={setSelectedMove}
              selectedMove={selectedMove}
            />
            <BattleControls
              phase={battleState.phase}
              canCatch={battleState.battle_type === 'wild'}
              onAttack={handleAttack}
              onMove={handleMove}
              onCatch={handleCatch}
              onFlee={handleFlee}
            />
          </div>
        </div>

        <BattleLog entries={battleLog} />
      </div>
    </GameLayout>
  );
}
```

---

## Testing Checklist

### Manual Tests

1. [ ] Grid renders with correct labels (A-J, 1-10)
2. [ ] Player trainer appears at A5
3. [ ] Opponent trainer appears at J5
4. [ ] Deployment zone (rows 1-2) highlights during setup
5. [ ] Pokemon can be placed in deployment zone
6. [ ] Cannot place Pokemon on occupied squares
7. [ ] Combat starts after placement confirmed
8. [ ] Turn indicator shows correct order
9. [ ] Attack action highlights valid targets
10. [ ] Damage numbers animate on hit
11. [ ] HP bars update smoothly
12. [ ] Status effects show icons
13. [ ] Fainted Pokemon removed from grid
14. [ ] Victory screen shows on win
15. [ ] Defeat redirects to Pokemon Center
16. [ ] Flee works in wild battles
17. [ ] Battle log records all actions

### API Tests

```bash
# Start battle
curl -X POST http://localhost:3000/api/battle/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"player_pokemon_ids":["uuid"],"opponent_pokemon_id":"rattata","opponent_level":5,"grid_mode":true}'

# Execute attack
curl -X POST http://localhost:3000/api/battle/action \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"battle_id":"uuid","action_type":"attack","actor_id":"uuid","move_id":"tackle","target_id":"uuid","battle_state":{...}}'

# Attempt flee
curl -X POST http://localhost:3000/api/battle/flee \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"battle_id":"uuid","actor_id":"uuid","battle_state":{...}}'
```

---

## Common Issues

### Issue: Grid not rendering
- Check that battleState.grid is properly initialized as 10x10 array
- Verify CSS grid/flex display properties

### Issue: Pokemon placement not working
- Check isDeploymentZone logic (rows 0-1 for player)
- Verify position is not already occupied

### Issue: Turn order incorrect
- Verify initiative_order array is sorted by initiative value
- Check current_turn_index updates after each action

### Issue: Damage not calculating
- Verify move data loaded from Source
- Check that PP is available for the move
- Ensure target is valid (opponent, HP > 0)

---

## Next Steps After Implementation

1. Run `/speckit.tasks` to generate implementation tasks
2. Implement components in priority order (P1 first)
3. Test each component in isolation
4. Integration test full battle flow
5. Manual QA on different screen sizes
