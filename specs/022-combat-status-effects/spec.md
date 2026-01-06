# Feature Specification: Combat Status Effects Integration

**Feature Branch**: `022-combat-status-effects`
**Created**: 2026-01-06
**Status**: Draft
**Input**: User description: "Ensure combat takes all status effects and extra effects in moves into account when calculating. Show effects in combat log."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Status Effect Application in Combat Log (Priority: P1)

When a player's Pokemon uses a move that inflicts a status condition (burn, paralysis, poison, sleep, freeze, confusion, flinch), the combat log clearly displays whether the status was applied, blocked (immunity/existing status), or missed the trigger threshold.

**Why this priority**: Status effects are core to Pokemon combat strategy. Without clear feedback, players cannot understand why effects did or didn't apply, leading to confusion and frustration.

**Independent Test**: Player uses Flamethrower against a target - combat log shows the burn check result with threshold info ("Burned! (failed save by 5+)" or "No burn (saved)").

**Acceptance Scenarios**:

1. **Given** a player uses Thunder Wave on an opponent, **When** the opponent fails the CON save, **Then** the combat log shows "OPPONENT is now PARALYZED!" with the save roll details.
2. **Given** a player uses Fire Punch on an Electric-type Pokemon, **When** the burn would apply, **Then** the combat log shows "Burn blocked: Fire-type immunity" (or appropriate type immunity message).
3. **Given** a Pokemon already has a non-volatile status, **When** a move would apply another non-volatile status, **Then** the combat log shows "Status blocked: already has [existing status]".

---

### User Story 2 - See Ongoing Status Damage in Combat Log (Priority: P1)

When a Pokemon has a damage-over-time status (Burn, Poison, Badly Poisoned), the end-of-turn damage is clearly shown in the combat log with the damage amount, source, and resulting HP.

**Why this priority**: Players need to understand tick damage to plan their strategy around status conditions and healing.

**Independent Test**: A Burned Pokemon ends its turn - combat log shows "POKEMON takes 2 BURNED damage (25 -> 23 HP)".

**Acceptance Scenarios**:

1. **Given** a Pokemon is Burned, **When** the turn ends, **Then** the combat log displays tick damage equal to proficiency bonus with HP before/after.
2. **Given** a Pokemon is Badly Poisoned, **When** the turn ends, **Then** the combat log shows double proficiency bonus damage.
3. **Given** a Pokemon faints from status damage, **When** tick damage reduces HP to 0, **Then** the combat log shows "POKEMON fainted from BURNED damage!".

---

### User Story 3 - View Turn-Affecting Status Effects (Priority: P1)

When a Pokemon's turn is skipped or modified due to status (Paralyzed skip, Asleep, Frozen, Confused behavior), the combat log clearly explains what happened and why.

**Why this priority**: Turn-affecting statuses dramatically impact battle flow. Clear feedback prevents player confusion about why their Pokemon didn't act.

**Independent Test**: A Paralyzed Pokemon rolls a 1 on the d4 check - combat log shows "POKEMON is paralyzed and cannot move! (rolled 1 on d4)".

**Acceptance Scenarios**:

1. **Given** a Paralyzed Pokemon starts its turn, **When** the d4 roll is 1, **Then** the combat log shows skip message with the roll result.
2. **Given** a Sleeping Pokemon starts its turn, **When** the wake check fails, **Then** the combat log shows "POKEMON is fast asleep... (wake roll: 8, needs 11+)".
3. **Given** a Confused Pokemon acts, **When** the d8 roll is 6, **Then** the combat log shows "POKEMON hurt itself in confusion! (d8: 6 - self-Struggle)".
4. **Given** a Frozen Pokemon attempts to break free, **When** it succeeds, **Then** the combat log shows "POKEMON broke free of the ice! (STR save: 15 vs DC 12)".

---

### User Story 4 - See Move Extra Effects in Combat Log (Priority: P2)

When a move has additional effects beyond damage (stat changes, healing, AC reduction, recoil, etc.), these effects are displayed in the combat log with relevant details.

**Why this priority**: Many moves have effects described only in their text. Showing these effects helps players understand the full impact of moves.

**Independent Test**: Player uses Absorb - combat log shows damage dealt AND "POKEMON healed for 3 HP (50% of damage dealt)".

**Acceptance Scenarios**:

1. **Given** a move heals the user (Absorb, Drain Punch), **When** it hits, **Then** the combat log shows healing amount and HP changes.
2. **Given** a move reduces target's AC (Acid Spray), **When** target fails CON save, **Then** the combat log shows "OPPONENT's AC reduced by 1 (now 12)".
3. **Given** a move has recoil (Flare Blitz, Take Down), **When** it hits, **Then** the combat log shows recoil damage taken by attacker.
4. **Given** a move grants a buff (Dragon Dance), **When** used, **Then** the combat log shows "Attack bonus doubled for 1 minute (concentration)".

---

### User Story 5 - Burn Penalty Applied to Damage (Priority: P2)

When a Burned Pokemon deals damage, the burn penalty (roll damage dice twice, take lower) is applied and shown in the combat log.

**Why this priority**: The burned damage penalty is a significant tactical consideration that players need visibility into.

**Independent Test**: A Burned Pokemon uses Tackle - combat log shows "Damage: 1d4(3,1->1) [BURNED: lower roll used]".

**Acceptance Scenarios**:

1. **Given** a Burned Pokemon attacks, **When** damage is calculated, **Then** both rolls are shown with the lower one highlighted as used.
2. **Given** a Burned Pokemon uses a save-based move, **When** damage is dealt, **Then** the burn penalty still applies to the damage roll.

---

### User Story 6 - Flinch Effects on Combat (Priority: P2)

When a Flinched Pokemon attacks or is targeted, the disadvantage/advantage modifiers are shown in the combat log.

**Why this priority**: Flinch is a powerful status that affects multiple aspects of combat. Clear visibility helps players understand its impact.

**Independent Test**: A Flinched Pokemon attacks - combat log shows "Attack Roll: d20(15,8->8) DIS [FLINCHED]".

**Acceptance Scenarios**:

1. **Given** a Flinched Pokemon makes an attack, **When** the roll happens, **Then** the combat log shows disadvantage with both rolls and reason.
2. **Given** a Flinched Pokemon uses a move requiring a save, **When** target saves, **Then** the combat log shows "DEFENDER rolls with ADV (attacker flinched)".

---

### Edge Cases

- What happens when a move triggers multiple effects simultaneously (damage + status + stat change)?
  - All effects are shown in sequence in the combat log, each on its own line.
- How does the system handle immunity to both damage type AND status type?
  - Both immunities are logged separately: "No damage (Flying immune to Ground)" and "Paralysis blocked: Electric-type immunity".
- What happens when status damage kills a Pokemon before it can act?
  - Status damage is processed at end of turn, so Pokemon always gets to act first (per Pokemon 5e rules).
- How are concentration-based buffs tracked and displayed when broken?
  - Combat log shows "CONCENTRATION BROKEN: [Move Name] effect ends" when damage causes concentration loss.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST apply all status effects defined in move descriptions when conditions are met (hit threshold, failed save, etc.).
- **FR-002**: System MUST display status application results in combat log with success/failure reason.
- **FR-003**: System MUST process end-of-turn status damage (Burn, Poison) and display in combat log with HP changes.
- **FR-004**: System MUST process start-of-turn status checks (Paralysis skip, Sleep wake, Frozen break, Confusion behavior) and display results.
- **FR-005**: System MUST apply Burned damage penalty (roll twice, take lower) and show both rolls in combat log.
- **FR-006**: System MUST apply Flinched disadvantage on attacks and advantage to targets' saves, showing these modifiers in log.
- **FR-007**: System MUST parse and apply move extra effects (healing, stat changes, AC reduction, recoil) when applicable.
- **FR-008**: System MUST display all combat calculations with enough detail for players to understand the outcome.
- **FR-009**: Combat log entries MUST include relevant dice rolls, modifiers, thresholds, and results.
- **FR-010**: System MUST respect type immunities for both damage and status effects, logging blocked effects.

### Key Entities

- **StatusEffect**: Tracks active status conditions on a combatant (type, duration, source, tick count for scaling effects).
- **MoveEffect**: Represents parsed extra effects from move descriptions (healing percentage, stat modifier, AC change, recoil amount).
- **CombatLogEntry**: Structured log entry with type (attack, status, damage, heal, buff), actor, target, and detailed calculation breakdown.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of moves with status effect triggers (burn, paralysis, etc. in description) correctly apply the status when conditions are met.
- **SC-002**: Combat log entries for status-related events include all relevant dice rolls and thresholds (no "black box" outcomes).
- **SC-003**: Players can reproduce any combat outcome given the same seed - all randomness is logged with roll values.
- **SC-004**: All 8 status types (Burned, Paralyzed, Poisoned, Badly Poisoned, Asleep, Frozen, Confused, Flinched) function per Pokemon 5e rules.
- **SC-005**: Test harness can verify status effect application with deterministic outcomes using seeded random.
- **SC-006**: Combat log provides clear, human-readable explanation for every status-related combat event.
