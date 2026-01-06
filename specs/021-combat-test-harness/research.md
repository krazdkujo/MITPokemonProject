# Research: Combat Test Harness

**Date**: 2026-01-06
**Branch**: `021-combat-test-harness`

## Research Tasks

### 1. Existing Combat System Architecture

**Decision**: Reuse existing battle engine without modification

**Rationale**: The combat system is well-structured with clear separation:
- `lib/battleEngine.js` - Core combat calculations (attack rolls, damage, status effects)
- `lib/combatUtils.js` - Utility functions (proficiency bonus, attribute modifiers, STAB)
- `lib/combatAI.js` - AI move selection with scoring system
- `lib/diceRoller.js` - Dice mechanics (d20, damage dice)
- `lib/statusEffects.js` - Status effect processing
- `lib/pokemonData.js` - Pokemon/move data loading from Source JSON

**Key Functions to Use**:
- `buildCombatant(dbRecord, owner)` - Create combatant from Pokemon data
- `buildOpponentCombatant(pokemonId, level)` - Create opponent without DB
- `calculateAttackRoll(attacker, move)` - Returns roll, modifier, total, crit info
- `calculateDamage(attacker, defender, move, attackRoll)` - Returns damage breakdown
- `processSaveMove(attacker, defender, move)` - Handle saving throw moves
- `processStartOfTurnStatus(combatant)` - Check if turn is skipped
- `processEndOfTurnStatus(combatant)` - Apply end-of-turn damage

**Alternatives Considered**:
- Modifying battleEngine to add logging hooks → Rejected: Too invasive, risks production bugs
- Creating wrapper functions → Rejected: Adds complexity, duplicates logic

### 2. Random Number Generator Seeding

**Decision**: Implement custom seedable RNG wrapper

**Rationale**: The existing `diceRoller.js` uses `Math.random()` which cannot be seeded. For reproducible tests, we need a seedable PRNG.

**Implementation Approach**:
- Create `lib/seededRandom.js` with mulberry32 algorithm (fast, well-tested)
- Inject seeded RNG into combat simulator
- Display seed in output for reproduction

**Alternatives Considered**:
- Modifying diceRoller.js globally → Rejected: Would affect production
- Using external library (seedrandom) → Rejected: Adds dependency for minimal feature

### 3. Verbose Logging Format

**Decision**: Structured log entries with clear visual hierarchy

**Rationale**: Logs must be human-readable for debugging while containing all calculation data.

**Log Format Design**:
```
═══════════════════════════════════════════════════════════════════
TURN 1
═══════════════════════════════════════════════════════════════════

▶ PIKACHU (Player) uses THUNDERBOLT
  Target: BULBASAUR (Opponent)
  ├─ Attack Roll: d20(14) + 5 (mod) = 19 vs AC 13 → HIT
  ├─ Damage: 2d6(4,3) + 3 (power) + 2 (STAB) = 12
  ├─ Type: Electric vs Grass/Poison → 1x (normal)
  └─ Result: 12 damage → BULBASAUR HP: 35→23

◀ BULBASAUR (Opponent) uses VINE WHIP
  Target: PIKACHU (Player)
  ├─ Attack Roll: d20(7) + 4 (mod) = 11 vs AC 12 → MISS
  └─ Result: No damage

───────────────────────────────────────────────────────────────────
Turn Summary: Pikachu dealt 12, Bulbasaur dealt 0
HP Status: Pikachu 28/28 | Bulbasaur 23/35
───────────────────────────────────────────────────────────────────
```

**Alternatives Considered**:
- JSON logs → Rejected: Hard to scan visually for debugging
- Minimal logs → Rejected: Insufficient detail for identifying calculation bugs

### 4. UI Component Architecture

**Decision**: Three focused components with shared state

**Rationale**: Clean separation of concerns for maintainability.

**Components**:
1. `PokemonSelector.js` - Dropdown with all Pokemon, level input
2. `BattleLog.js` - Scrollable log panel with auto-scroll
3. `ControlPanel.js` - Start, Next Turn, Auto-run toggle, Speed slider

**State Management**: React useState in parent page (no Context needed for single page)

**Alternatives Considered**:
- Single monolithic component → Rejected: Hard to maintain
- Global state (Context) → Rejected: Overkill for single-page tool

### 5. CLI Argument Parsing

**Decision**: Use process.argv with simple parsing (no external library)

**Rationale**: CLI has only 5 optional arguments; external library adds overhead.

**CLI Interface**:
```bash
npm run test:combat -- --pokemon1 pikachu --pokemon2 bulbasaur --level1 10 --level2 8 --seed 12345
```

**Defaults**:
- pokemon1: "pikachu"
- pokemon2: "bulbasaur"
- level1: 5
- level2: 5
- seed: Date.now()

**Alternatives Considered**:
- yargs/commander → Rejected: Overkill for 5 arguments
- Environment variables → Rejected: Less discoverable than CLI args

### 6. Simplified Combat Flow (No Grid)

**Decision**: Use simplified 1v1 combat without grid positioning

**Rationale**: Grid adds complexity not needed for testing core combat logic. The test harness focuses on attack/damage calculations, not movement/positioning.

**Simplified Flow**:
1. Both Pokemon start in melee range (always in range of all moves)
2. Initiative determines turn order (or alternating for simplicity)
3. Each turn: active Pokemon uses AI-selected move
4. Continue until one Pokemon faints or max turns reached

**Key Simplifications**:
- No grid positioning or movement
- No Attack of Opportunity
- All moves assumed in range
- Simple alternating turns (Player → Opponent → Player...)

**Alternatives Considered**:
- Full grid simulation → Rejected: Adds complexity without improving core logic testing
- Random initiative each turn → Rejected: Makes reproduction harder

## Resolved NEEDS CLARIFICATION Items

No items required clarification from the Technical Context section.

## Summary

The combat test harness will:
1. Reuse existing battle engine code via `buildOpponentCombatant` and attack functions
2. Implement a seedable RNG wrapper for reproducible tests
3. Use structured, human-readable log format with visual hierarchy
4. Build three focused UI components with local React state
5. Parse CLI arguments with simple native parsing
6. Use simplified 1v1 combat without grid positioning
