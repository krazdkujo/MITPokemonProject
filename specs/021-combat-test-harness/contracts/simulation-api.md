# Combat Simulation API Contracts

**Date**: 2026-01-06
**Branch**: `021-combat-test-harness`

## Overview

The combat test harness exposes a JavaScript module API for the shared simulation logic. Both the web UI and CLI consume this API. There are no HTTP endpoints as this is a client-side/CLI-only feature.

---

## Module: `lib/combatSimulator.js`

### `createSimulation(config)`

Create a new combat simulation instance.

**Parameters**:
```typescript
interface SimulationConfig {
  pokemon1: {
    id: string;           // Required: Pokemon ID from Source
    level?: number;       // Optional: default 5
    moves?: string[];     // Optional: specific move IDs
  };
  pokemon2: {
    id: string;
    level?: number;
    moves?: string[];
  };
  seed?: number;          // Optional: RNG seed for reproducibility
  maxTurns?: number;      // Optional: default 100
}
```

**Returns**:
```typescript
interface Simulation {
  id: string;                    // Unique simulation ID
  config: SimulationConfig;      // Resolved config with defaults
  combatant1: TestCombatant;     // Player Pokemon
  combatant2: TestCombatant;     // Opponent Pokemon
  state: 'ready' | 'running' | 'paused' | 'completed';
  currentTurn: number;
  log: CombatLogEntry[];
  seed: number;                  // Seed used (for reproduction)
}
```

**Errors**:
- `Error("Pokemon not found: {id}")` - Invalid Pokemon ID
- `Error("Level must be 1-20")` - Invalid level

---

### `runNextTurn(simulation)`

Execute a single combat turn.

**Parameters**:
- `simulation: Simulation` - Active simulation instance

**Returns**:
```typescript
interface TurnResult {
  turnNumber: number;
  actor: TestCombatant;          // Pokemon that acted
  target: TestCombatant;         // Pokemon targeted
  action: ActionResult;          // Full action details
  log: CombatLogEntry[];         // Log entries for this turn
  battleEnded: boolean;
  winner: 'player' | 'opponent' | null;
}
```

**Side Effects**:
- Mutates `simulation.combatant1` and `simulation.combatant2` HP/PP/status
- Appends entries to `simulation.log`
- Updates `simulation.currentTurn`

---

### `runToCompletion(simulation, onTurn?)`

Run simulation until one Pokemon faints or max turns reached.

**Parameters**:
- `simulation: Simulation` - Active simulation instance
- `onTurn?: (result: TurnResult) => void` - Optional callback after each turn

**Returns**:
```typescript
interface SimulationResult {
  winner: 'player' | 'opponent' | 'draw';
  totalTurns: number;
  seedUsed: number;
  combatant1Summary: CombatantSummary;
  combatant2Summary: CombatantSummary;
  log: CombatLogEntry[];
  durationMs: number;
}

interface CombatantSummary {
  name: string;
  finalHp: number;
  maxHp: number;
  totalDamageDealt: number;
  totalDamageReceived: number;
  attacksMade: number;
  attacksHit: number;
  criticalHits: number;
}
```

---

### `formatLogEntry(entry)`

Format a log entry for display.

**Parameters**:
- `entry: CombatLogEntry` - Raw log entry

**Returns**:
- `string` - Formatted, human-readable log line

---

### `formatBattleSummary(result)`

Format the final battle summary.

**Parameters**:
- `result: SimulationResult` - Completed simulation result

**Returns**:
- `string` - Multi-line formatted summary

---

## Module: `lib/combatLogger.js`

### `createLogger(options?)`

Create a logger instance for formatting combat events.

**Parameters**:
```typescript
interface LoggerOptions {
  colorize?: boolean;    // Use ANSI colors (CLI only), default: true
  timestamps?: boolean;  // Include timestamps, default: false
  verbose?: boolean;     // Include all calculation details, default: true
}
```

**Returns**:
```typescript
interface Logger {
  logTurnStart(turnNumber: number): string;
  logAttack(attacker: string, move: string, target: string, attackRoll: AttackRoll): string;
  logDamage(damage: DamageResult, hpBefore: number, hpAfter: number, targetName: string): string;
  logMiss(attacker: string, move: string, target: string, attackRoll: AttackRoll): string;
  logStatus(target: string, statusType: string, applied: boolean, reason?: string): string;
  logTurnEnd(combatant1Hp: string, combatant2Hp: string): string;
  logBattleEnd(winner: string, totalTurns: number): string;
}
```

---

## Module: `lib/seededRandom.js`

### `createSeededRandom(seed?)`

Create a seedable random number generator.

**Parameters**:
- `seed?: number` - Optional seed value (default: Date.now())

**Returns**:
```typescript
interface SeededRandom {
  seed: number;           // Seed used
  random(): number;       // Returns 0-1 (like Math.random)
  rollD20(): number;      // Returns 1-20
  rollDice(expr: string): number;  // Parse and roll dice expression
  rollDiceDetailed(expr: string): {
    rolls: number[];
    total: number;
    expression: string;
  };
}
```

---

## CLI Interface

### Command

```bash
npm run test:combat -- [options]
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--pokemon1` | string | "pikachu" | First Pokemon ID |
| `--pokemon2` | string | "bulbasaur" | Second Pokemon ID |
| `--level1` | number | 5 | Level of first Pokemon |
| `--level2` | number | 5 | Level of second Pokemon |
| `--seed` | number | Date.now() | RNG seed for reproducibility |

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Simulation completed successfully |
| 1 | Invalid Pokemon ID |
| 2 | Invalid level (not 1-20) |
| 3 | Internal error |

### Example Output

```
════════════════════════════════════════════════════════════════════
COMBAT SIMULATION
════════════════════════════════════════════════════════════════════
Seed: 1704537600000
Pokemon 1: Pikachu (Level 5) - HP: 28/28
Pokemon 2: Bulbasaur (Level 5) - HP: 35/35
════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════
TURN 1
═══════════════════════════════════════════════════════════════════

▶ PIKACHU uses THUNDER SHOCK
  Target: BULBASAUR
  ├─ Attack Roll: d20(14) + 5 = 19 vs AC 13 → HIT
  ├─ Damage: 1d8(6) + 3 (power) + 2 (STAB) = 11
  ├─ Type: Electric vs Grass/Poison → 1x (normal)
  └─ Result: 11 damage → BULBASAUR HP: 35→24

◀ BULBASAUR uses VINE WHIP
  Target: PIKACHU
  ├─ Attack Roll: d20(18) + 4 = 22 vs AC 12 → HIT
  ├─ Damage: 1d6(4) + 2 (power) + 2 (STAB) = 8
  ├─ Type: Grass vs Electric → 1x (normal)
  └─ Result: 8 damage → PIKACHU HP: 28→20

───────────────────────────────────────────────────────────────────
HP: Pikachu 20/28 | Bulbasaur 24/35
───────────────────────────────────────────────────────────────────

[... more turns ...]

════════════════════════════════════════════════════════════════════
BATTLE COMPLETE
════════════════════════════════════════════════════════════════════
Winner: PIKACHU (Player)
Total Turns: 7
Duration: 45ms
Seed: 1704537600000 (use --seed 1704537600000 to reproduce)

Pikachu: 8/28 HP | Dealt 42 damage | 5/7 attacks hit | 1 crit
Bulbasaur: 0/35 HP | Dealt 20 damage | 3/6 attacks hit | 0 crits
════════════════════════════════════════════════════════════════════
```
