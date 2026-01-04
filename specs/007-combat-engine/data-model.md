# Data Model: Combat Engine

**Feature**: 007-combat-engine
**Date**: 2026-01-03

## Overview

The combat engine operates as a pure calculation layer. All game data comes from Source JSON files (read-only). The database stores only user-specific combat state (HP, PP). This document defines the in-memory data structures used during combat calculation.

## Entities

### CombatState

Represents the complete state of an active battle.

| Field | Type | Description |
|-------|------|-------------|
| battle_id | string (UUID) | Unique identifier for this battle instance |
| combatants | Combatant[] | All Pokemon participating in the battle |
| initiative_order | string[] | Combatant IDs sorted by initiative (highest first) |
| current_turn_index | number | Index into initiative_order for active combatant |
| round_number | number | Current round (starts at 1) |
| is_complete | boolean | True when battle has ended |
| outcome | 'ongoing' \| 'victory' \| 'defeat' \| 'fled' \| 'caught' | Battle result |
| battle_type | 'wild' \| 'gym' \| 'pvp' \| 'trainer' | Context for death save rules |
| started_at | string (ISO 8601) | Battle start timestamp |
| ended_at | string (ISO 8601) \| null | Battle end timestamp |

### Combatant

A Pokemon participating in combat with current state.

| Field | Type | Description |
|-------|------|-------------|
| combatant_id | string (UUID) | Unique ID for this combatant in this battle |
| pokemon_id | string | Source pokemon ID (e.g., "bulbasaur") |
| owner | 'player' \| 'opponent' \| 'wild' | Who controls this combatant |
| name | string | Pokemon name from Source |
| level | number | Current level (1-20) |
| type | string[] | Pokemon types from Source |
| attributes | Attributes | Current attribute scores |
| ac | number | Armor class from Source |
| max_hp | number | Maximum hit points |
| current_hp | number | Current hit points |
| move_pp | { [moveId: string]: number } | Current PP for each known move |
| known_moves | string[] | Array of move IDs this Pokemon knows |
| abilities | string[] | Ability IDs from Source |
| status_effects | StatusEffect[] | Active status conditions |
| initiative_roll | InitiativeRoll | Initiative calculation result |
| has_acted_this_round | boolean | True after taking action this round |
| is_fainted | boolean | True when current_hp <= 0 |

### Attributes

Standard Pokemon 5e attribute block.

| Field | Type | Description |
|-------|------|-------------|
| str | number | Strength score |
| dex | number | Dexterity score |
| con | number | Constitution score |
| int | number | Intelligence score |
| wis | number | Wisdom score |
| cha | number | Charisma score |

### InitiativeRoll

Result of rolling initiative.

| Field | Type | Description |
|-------|------|-------------|
| natural_roll | number | The d20 roll (1-20) |
| modifier | number | DEX modifier |
| total | number | natural_roll + modifier |

### StatusEffect

An active condition on a Pokemon.

| Field | Type | Description |
|-------|------|-------------|
| effect_id | string | Unique ID for this effect instance |
| status_type | StatusType | The type of status condition |
| is_volatile | boolean | True if clears on switch/combat end |
| remaining_rounds | number \| null | Rounds remaining (null = until cured) |
| applied_at_round | number | Round number when applied |
| source_combatant_id | string \| null | Who applied this effect |
| grace_period_until | number \| null | Round number when grace period ends |

### StatusType (Enum)

```
ASLEEP, BURNED, FROZEN, PARALYZED, POISONED, BADLY_POISONED, CONFUSED, FLINCHED
```

### MoveAction

An attempted use of a move during combat.

| Field | Type | Description |
|-------|------|-------------|
| action_id | string (UUID) | Unique action identifier |
| attacker_id | string | Combatant ID of attacker |
| target_ids | string[] | Combatant ID(s) of target(s) |
| move_id | string | Move ID from Source |
| chosen_power_stat | string | Which power stat was used (str/dex/etc) |
| action_type | 'action' \| 'bonus_action' \| 'reaction' | Move time category |

### AttackRoll

Result of making an attack roll.

| Field | Type | Description |
|-------|------|-------------|
| natural_roll | number | The d20 roll (1-20) |
| power_modifier | number | Modifier from chosen power stat |
| proficiency_bonus | number | Proficiency bonus for attacker level |
| total | number | Sum of all components |
| is_critical | boolean | True if natural roll meets crit threshold |
| is_auto_miss | boolean | True if natural 1 |
| crit_threshold | number | Minimum natural roll for crit (default 20) |

### DamageResult

Complete damage calculation breakdown.

| Field | Type | Description |
|-------|------|-------------|
| dice_expression | string \| null | Dice rolled (e.g., "2d6") |
| dice_rolls | number[] | Individual die results |
| base_dice_total | number | Sum of dice before modifiers |
| power_modifier | number | Bonus from power stat |
| stab_bonus | number | Same Type Attack Bonus (0 if not applicable) |
| subtotal | number | base + power_mod + stab |
| type_multiplier | number | 2.0, 1.0, 0.5, or 0 |
| type_effectiveness | 'immune' \| 'not_effective' \| 'normal' \| 'super_effective' | Effectiveness label |
| is_critical | boolean | Whether crit damage applied |
| final_damage | number | Total after all multipliers, floored, min 0 |

### ActionResult

Full result of executing an action.

| Field | Type | Description |
|-------|------|-------------|
| action | MoveAction | The action attempted |
| attack_roll | AttackRoll \| null | Attack roll if applicable |
| did_hit | boolean | True if attack connected |
| damage_result | DamageResult \| null | Damage calculation if hit |
| status_applied | StatusType \| null | Status condition applied |
| pp_consumed | number | PP spent (usually 1) |
| target_hp_before | number | Target HP before damage |
| target_hp_after | number | Target HP after damage |
| target_fainted | boolean | True if target reached 0 HP |
| struggle_recoil | number \| null | Self-damage if Struggle used |
| special_effects | string[] | Any other effects (speed reduction, etc.) |

### TurnResult

Result of processing a complete turn.

| Field | Type | Description |
|-------|------|-------------|
| round_number | number | Current round |
| turn_number | number | Turn within round |
| combatant_id | string | Who acted |
| actions | ActionResult[] | Actions taken this turn |
| end_of_turn_damage | EndOfTurnDamage[] | Status tick damage |
| status_changes | StatusChange[] | Status effects added/removed |

### EndOfTurnDamage

Damage from status effects at end of turn.

| Field | Type | Description |
|-------|------|-------------|
| combatant_id | string | Who took damage |
| source | 'burn' \| 'poison' \| 'badly_poisoned' | Damage source |
| damage | number | Damage amount (proficiency or 2x proficiency) |
| hp_before | number | HP before tick |
| hp_after | number | HP after tick |

### StatusChange

A change to status conditions.

| Field | Type | Description |
|-------|------|-------------|
| combatant_id | string | Affected combatant |
| status_type | StatusType | The status |
| change | 'applied' \| 'removed' \| 'blocked' | What happened |
| reason | string | Why (e.g., "type immunity", "grace period", "switched out") |

### BattleEndResult

Final battle outcome data.

| Field | Type | Description |
|-------|------|-------------|
| outcome | 'victory' \| 'defeat' \| 'fled' \| 'caught' | How battle ended |
| xp_awarded | number | XP to distribute to player Pokemon |
| currency_awarded | number | Money earned |
| participating_pokemon | string[] | Player Pokemon IDs that took actions |
| turns_elapsed | number | Total turns in battle |
| was_caught | boolean | True if wild Pokemon was caught |

## State Transitions

### Combat Flow

```
INIT -> ROLLING_INITIATIVE -> COMBAT_ACTIVE -> COMBAT_ENDED
                                    ^
                                    |
                              (loop each turn)
```

### Turn Flow

```
START_TURN
  -> Check paralysis roll (may skip turn)
  -> Check confusion roll (may act randomly)
  -> SELECT_ACTION
  -> EXECUTE_ACTION (attack roll, damage, effects)
  -> END_TURN (status tick damage, check fainting)
  -> Check battle end conditions
```

### Status Transitions

```
NONE -> APPLIED (if not immune, no existing non-volatile)
APPLIED -> REMOVED (cured, switched out for volatile, duration expired)
APPLIED -> BLOCKED (grace period, already have non-volatile)
```

## Validation Rules

### Combatant

- `level` must be 1-20
- `current_hp` must be 0 to `max_hp`
- `move_pp[moveId]` must be 0 to move's max PP from Source
- `known_moves` must be valid move IDs from Source
- Only one non-volatile status allowed at a time

### MoveAction

- `move_id` must be in combatant's `known_moves`
- Move must have PP > 0 unless using Struggle
- `chosen_power_stat` must be in move's `power` array

### StatusEffect

- Cannot apply non-volatile if one already exists
- Cannot apply if type immunity applies
- Cannot apply if in grace period for same status
- Volatile effects require `remaining_rounds` to be set

## Database Persistence

Only the following are persisted to the database (player_pokemon table):

| Field | Storage | Notes |
|-------|---------|-------|
| current_hp | INTEGER | Updated after battle or healing |
| move_pp | JSONB | `{ moveId: currentPP }` object |

All other combat data (initiative, status effects, battle state) exists only in memory during the battle and in the API response. The combat engine is stateless between API calls for multi-turn battles; the client must track state and submit it with each request.
