# Data Model: Complete Move Effects

**Feature**: 024-complete-move-effects
**Date**: 2026-01-06

## Entity Overview

This feature extends existing entities in the combat system. No new database tables are required.

## Core Entities

### Move (Source Data - Read Only)

Location: `Source/moves/moves.json`

```typescript
interface Move {
  id: string;                    // Unique identifier (e.g., "absorb")
  name: string;                  // Display name (e.g., "Absorb")
  type: string;                  // Pokemon type (e.g., "grass")
  power: string[] | "none";      // Stat(s) for power modifier (e.g., ["str", "dex"])
  time: string;                  // Action cost (e.g., "1 action", "1 bonus action", "1 reaction")
  pp: number;                    // Power points available
  duration: string;              // Effect duration (e.g., "instantaneous", "1 minute, concentration")
  range: string;                 // Range/area (e.g., "melee", "30ft", "self (30ft cone)")
  description: string;           // Full move description with mechanics
  higherLevels?: string;         // Scaling at higher levels
}
```

### Combatant (Runtime - Extended)

Location: `lib/combatSimulator.js`, `lib/battleEngine.js`

```typescript
interface Combatant {
  // Existing fields
  combatant_id: string;
  pokemon_id: string;
  name: string;
  level: number;
  type: string[];
  attributes: Attributes;
  ac: number;
  max_hp: number;
  current_hp: number;
  move_pp: Record<string, number>;
  known_moves: Move[];
  status_effects: StatusEffect[];
  position: GridPosition;
  walking_speed: number;
  movement_remaining: number;

  // NEW: Action economy tracking
  has_action: boolean;           // Can use "1 action" moves
  has_bonus_action: boolean;     // Can use "1 bonus action" moves
  has_reaction: boolean;         // Can use "1 reaction" moves

  // NEW: Two-turn move state
  charging_move: ChargingState | null;
  is_invulnerable: boolean;
  invulnerable_until: string;    // Move ID that grants invulnerability
  is_recharging: boolean;
  recharge_until_round: number;

  // NEW: Combat state for conditional effects
  took_damage_this_round: boolean;
  damage_taken_since_last_turn: number;
  last_move_used: string | null;

  // NEW: Control effect tracking
  is_grappling: string | null;   // combatant_id of grappled target
  grappled_by: string | null;    // combatant_id of grappler
  cannot_flee: boolean;
  flee_prevented_until_round: number;

  // NEW: Stat modification tracking
  stat_modifiers: StatModifier[];
  ac_modifiers: ACModifier[];
  speed_modifiers: SpeedModifier[];
}

interface Attributes {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

interface GridPosition {
  col: number;
  row: number;
}
```

### MoveEffect (Parsed Effect Data)

Location: `lib/moveEffectParser.js` (extended)

```typescript
interface MoveEffect {
  // Existing effects
  healing: HealingEffect | null;
  recoil: RecoilEffect | null;
  acEffect: ACEffect | null;
  speedEffect: SpeedEffect | null;

  // NEW: Extended effects
  multiHit: MultiHitEffect | null;
  conditionalDamage: ConditionalDamageEffect | null;
  chargeMove: ChargeMoveEffect | null;
  controlEffect: ControlEffect | null;
  aoeEffect: AoEEffect | null;
  autoHit: boolean;
  statEffect: StatEffect | null;

  hasEffects: boolean;
}

interface HealingEffect {
  type: 'drain' | 'fixed' | 'dice';
  percentage: number | null;     // For drain: 50 = half
  diceExpr: string | null;       // For dice: "4d4"
  addMoveMod: boolean;           // Add MOVE modifier
  amount: number | null;         // For fixed healing
}

interface RecoilEffect {
  percentage: number;            // 25 = quarter, 50 = half
  typeless: boolean;             // Always true for recoil
  onMiss: boolean;               // Recoil on miss (jump kick)
  missAmount: number | null;     // Fixed miss damage
}

interface MultiHitEffect {
  minHits: number;               // Minimum guaranteed hits
  maxHits: number;               // Maximum possible hits
  continueDie: string;           // Die to roll for continuation (e.g., "d4")
  continueThreshold: number;     // Minimum roll to continue (e.g., 3)
  damagePerHit: string;          // Damage dice per additional hit
}

interface ConditionalDamageEffect {
  condition: 'target_damaged_this_round' | 'user_damaged_since_last_turn' | 'target_has_status';
  statusType?: string;           // If condition is target_has_status
  multiplier: number;            // Usually 2 for "double damage"
  affectsBaseDice: boolean;      // Double dice vs double final
}

interface ChargeMoveEffect {
  type: 'charge' | 'recharge' | 'invulnerable';
  chargeTurns: number;           // Turns to charge (usually 1)
  bypassCondition?: string;      // e.g., "harsh sunlight" for Solar Beam
  invulnerableFrom: string[];    // Move types that can still hit (e.g., ["earthquake"] for Dig)
}

interface ControlEffect {
  type: 'grapple' | 'restrain' | 'prevent_flee' | 'trap';
  duration: number | null;       // Rounds, null = until save
  escapeAbility: string;         // Save ability (e.g., "STR")
  escapeDC: 'move_dc';           // Always attacker's Move DC
  ongoingDamage?: string;        // Dice for ongoing damage (e.g., "1d4")
}

interface AoEEffect {
  shape: 'cone' | 'line' | 'sphere' | 'radius';
  size: number;                  // In feet
  width?: number;                // For lines (default 5ft)
  centered_on: 'self' | 'point'; // Origin point
}

interface StatEffect {
  target: 'self' | 'target' | 'allies';
  stat: string;                  // 'all' or specific stat
  amount: number;
  duration: number | null;       // Rounds or null for combat
  stackable: boolean;
  maxStack: number | null;
}

interface ACModifier {
  source: string;                // Move ID that applied this
  amount: number;                // +/- value
  expiresRound: number | null;
  stackable: boolean;
  currentStack: number;
}

interface SpeedModifier {
  source: string;
  type: 'flat' | 'halve' | 'zero';
  amount: number | null;         // For flat changes
  expiresRound: number | null;
}

interface StatModifier {
  source: string;
  stat: string;
  amount: number;
  expiresRound: number | null;
  stackCount: number;
}
```

### ChargingState (Two-Turn Move Tracking)

```typescript
interface ChargingState {
  moveId: string;                // Move being charged
  startedRound: number;          // Round charge started
  executesRound: number;         // Round move executes
  targetPosition?: GridPosition; // Locked target for some moves
  targetId?: string;             // Locked target combatant
}
```

### ActionResult (Extended)

Location: `lib/battleEngine.js`

```typescript
interface ActionResult {
  // Existing fields
  pokemon_name: string;
  move_id: string;
  move_name: string;
  is_save_move: boolean;
  attack_roll?: AttackRollResult;
  save?: SaveResult;
  hit: boolean;
  damage: DamageResult | null;
  status_applied: StatusApplication | null;
  pp_consumed: number;
  target_hp_before: number;
  target_hp_after: number;
  target_fainted: boolean;

  // Existing effects
  healing_effect: HealingResult | null;
  recoil_effect: RecoilResult | null;
  ac_effect: ACResult | null;

  // NEW: Extended effect results
  multi_hit_results: MultiHitResult | null;
  conditional_damage: ConditionalDamageResult | null;
  charge_state: ChargeStateResult | null;
  control_applied: ControlResult | null;
  aoe_targets: AoETargetResult[] | null;
  auto_hit: boolean;
  stat_changes: StatChangeResult[] | null;
  speed_changes: SpeedChangeResult[] | null;
}

interface MultiHitResult {
  totalHits: number;
  rolls: number[];               // Each continuation roll
  damagePerHit: number[];        // Damage for each hit
  totalDamage: number;
}

interface ConditionalDamageResult {
  conditionMet: boolean;
  condition: string;
  multiplierApplied: number;
  baseDamage: number;
  finalDamage: number;
}

interface ChargeStateResult {
  type: 'started_charge' | 'executed' | 'started_recharge' | 'became_invulnerable';
  moveId: string;
  executesRound?: number;
  recoversRound?: number;
}

interface ControlResult {
  type: string;
  applied: boolean;
  reason?: string;               // If not applied
  escapeAbility: string;
  escapeDC: number;
}

interface AoETargetResult {
  combatant_id: string;
  name: string;
  position: GridPosition;
  in_area: boolean;
  save_result?: SaveResult;
  damage_taken: number;
  status_applied?: StatusApplication;
}

interface StatChangeResult {
  target: string;                // combatant_id
  stat: string;
  previousValue: number;
  newValue: number;
  modifier: number;
  source: string;
  duration: number | null;
}

interface SpeedChangeResult {
  target: string;
  previousSpeed: number;
  newSpeed: number;
  changeType: string;
  source: string;
  duration: number | null;
}
```

## State Transitions

### Combatant Turn State

```
START_TURN
  → has_action = true
  → has_bonus_action = true
  → took_damage_this_round = false
  → movement_remaining = walking_speed + speed_modifiers
  → Check charging_move for execution
  → Check is_recharging for recovery

DURING_TURN
  → Use action → has_action = false
  → Use bonus action → has_bonus_action = false
  → Use movement → movement_remaining decreases
  → Take damage → took_damage_this_round = true
                → damage_taken_since_last_turn += damage

END_TURN
  → Process concentration saves if damaged
  → Process grapple/restrain escape attempts
  → Decrement effect durations
  → damage_taken_since_last_turn = took_damage_this_round ? damage : 0

REACTION_TRIGGER
  → has_reaction = true at turn start
  → Use reaction → has_reaction = false
  → Resets at start of next turn
```

### Two-Turn Move State

```
CHARGE_START
  → charging_move = { moveId, startedRound, executesRound }
  → is_invulnerable = true (for Fly, Dig, etc.)
  → has_action = false

CHARGE_EXECUTE (next turn)
  → Execute move with locked target
  → charging_move = null
  → is_invulnerable = false

RECHARGE_START (after Hyper Beam, etc.)
  → is_recharging = true
  → recharge_until_round = current_round + 1

RECHARGE_END
  → is_recharging = false
  → Can use the move again
```

## Validation Rules

### Move Effect Parsing
- If move has `power: "none"`, skip damage calculation
- If move has concentration duration, require concentration tracking
- Multi-hit moves must have at least 1 guaranteed hit
- Conditional damage multiplier defaults to 2 if not specified
- AoE size must be positive integer

### Combat State
- Cannot use action move if `has_action = false`
- Cannot use bonus action move if `has_bonus_action = false`
- Cannot use reaction move if `has_reaction = false`
- Cannot use move if `is_recharging = true` and `move_id` matches
- Auto-hit bypasses attack roll but not type effectiveness
- Grappled combatants move with grappler (or break grapple)

### Effect Stacking
- AC modifications stack up to specified `maxStack` (usually -3 or +5)
- Stat modifications stack up to specified `maxStack` (usually +5)
- Speed modifications do not stack (newest wins)
- Status effects do not stack (refresh duration)
