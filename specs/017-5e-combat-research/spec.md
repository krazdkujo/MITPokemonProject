# Feature Specification: Pokemon 5e Combat System Alignment Research

**Feature Branch**: `017-5e-combat-research`
**Created**: 2026-01-04
**Status**: Draft
**Input**: User description: "Build a spec to do research on the pokemon 5e combat system in sources and what exists in the codebase, and how we can align the two as much as possible."

## Clarifications

### Session 2026-01-04

- Q: What is the primary deliverable for this feature? → A: Both (documentation + code implementation of Phase 1 items)
- Q: What is the scope for saving throw move implementation? → A: Implement the entire combat system and all moves
- Q: How should movement and positioning be handled? → A: Grid with 5ft standard (1 cell = 5 feet, matching D&D 5e convention)
- Q: Should the combat system support double battles? → A: Architecture for double, launch single (design for 2v2, implement 1v1 first)
- Q: Should Struggle have recoil damage? → A: Remove recoil (align with 5e - no recoil specified in Source/rules)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Combat System Gap Analysis Report (Priority: P1)

A developer needs to understand the differences between the Pokemon 5e rules documented in Source/ and the current codebase implementation to prioritize alignment work.

**Why this priority**: Without understanding what's missing or different, no meaningful alignment work can be planned or executed. This is the foundation for all subsequent improvements.

**Independent Test**: Can be fully tested by generating a detailed comparison document that maps each 5e rule to its codebase implementation status. Delivers immediate value by providing a clear roadmap.

**Acceptance Scenarios**:

1. **Given** the Pokemon 5e Source rules and existing codebase, **When** a gap analysis is performed, **Then** a comprehensive report lists all combat mechanics with their implementation status (implemented, partial, missing).
2. **Given** the gap analysis report, **When** a developer reviews it, **Then** they can identify specific files/functions that implement each mechanic or note "not implemented" for missing ones.
3. **Given** the gap analysis, **When** prioritization is needed, **Then** each gap is categorized by complexity (simple/medium/complex) and impact (core/enhancement/optional).

---

### User Story 2 - Alignment Recommendations Document (Priority: P2)

A technical lead needs actionable recommendations for aligning the codebase with Pokemon 5e rules, including which deviations are intentional simplifications vs. unintentional omissions.

**Why this priority**: After understanding gaps, the next step is deciding what to fix and what to leave as-is. Some simplifications may be intentional for the web game context.

**Independent Test**: Can be tested by reviewing the recommendations and verifying each one references both the 5e rule and the current implementation.

**Acceptance Scenarios**:

1. **Given** the gap analysis, **When** recommendations are generated, **Then** each gap includes a recommended action (implement, simplify, skip) with rationale.
2. **Given** the recommendations, **When** a developer reads them, **Then** dependencies between changes are clearly identified.

---

### User Story 3 - Implementation Priority Matrix (Priority: P3)

A project manager needs a prioritized list of combat system improvements that can be tackled incrementally.

**Why this priority**: Enables sprint planning and incremental delivery of combat improvements without requiring a complete rewrite.

**Independent Test**: Can be tested by verifying the matrix includes effort estimates and dependency ordering.

**Acceptance Scenarios**:

1. **Given** the recommendations, **When** a priority matrix is created, **Then** items are ordered by value/effort ratio.
2. **Given** the priority matrix, **When** implementation begins, **Then** developers can work on items independently without blocking each other.

---

### Edge Cases

- What happens when a 5e rule is ambiguous or has multiple valid interpretations?
- How does the system handle rules that reference D&D 5e Player Handbook content not in Source/?
- What happens when 5e rules conflict with web game user experience requirements?

## Requirements *(mandatory)*

### Functional Requirements

**Gap Analysis Requirements:**

- **FR-001**: System MUST document all combat-related rules from Source/rules/rules.json
- **FR-002**: System MUST map each rule to corresponding codebase implementation (file, function, line)
- **FR-003**: System MUST categorize each rule's implementation status: "fully implemented", "partially implemented", "not implemented", or "differently implemented"
- **FR-004**: System MUST identify any codebase implementations that have no corresponding 5e rule (custom additions)

**Alignment Assessment Requirements:**

- **FR-005**: System MUST document move mechanics from Source/moves/moves.json and compare to battleEngine.js implementation
- **FR-006**: System MUST document status effect rules and compare to statusEffects.js implementation
- **FR-007**: System MUST document Pokemon stat/attribute handling and compare to combatUtils.js implementation
- **FR-008**: System MUST document type effectiveness rules and compare to typeEffectiveness.js implementation
- **FR-009**: System MUST document experience/leveling rules and compare to experienceUtils.js implementation
- **FR-010**: System MUST document initiative and turn order rules and compare to initiativeUtils.js implementation

**Recommendation Requirements:**

- **FR-011**: System MUST provide implementation recommendations for each identified gap
- **FR-012**: System MUST categorize recommendations by complexity: simple (< 1 day), medium (1-3 days), complex (> 3 days)
- **FR-013**: System MUST identify dependencies between recommendations

**Full Combat System Implementation Requirements (Code Deliverables):**

*Status Effect Fixes:*
- **FR-014**: System MUST implement Burned status damage penalty (roll damage twice, take lower)
- **FR-015**: System MUST implement Flinched status full effects (disadvantage on all d20 rolls, targets have advantage on saves)
- **FR-016**: System MUST implement Frozen break DC calculation (STR save DC 10 + applier's proficiency)
- **FR-017**: System MUST implement Confused d8 behavior outcomes per 5e rules (1-4 normal, 5 nothing, 6 self-Struggle, 7 nearest Struggle, 8 ends)
- **FR-037**: System MUST remove Struggle recoil damage to align with 5e rules (no recoil specified in Source/rules)

*Move System:*
- **FR-018**: System MUST implement saving throw move support for all moves requiring saves (DC = 8 + power mod + prof)
- **FR-019**: System MUST implement all moves from Source/moves/moves.json with correct damage dice, effects, and level scaling
- **FR-020**: System MUST implement move concentration mechanics for moves requiring concentration

*Battle Flow:*
- **FR-021**: System MUST implement Pokemon switching mechanics (action to recall, bonus to send, new Pokemon cannot act until next turn)
- **FR-022**: System MUST implement Attacks of Opportunity when leaving melee range without Disengage
- **FR-023**: System MUST implement PP restoration on short rest (partial) and long rest (full)

*Grid & Positioning:*
- **FR-030**: System MUST use 1 cell = 5 feet conversion for all range and movement calculations
- **FR-031**: System MUST convert all 5e move ranges to grid cells (e.g., 30ft range = 6 cells, melee = adjacent cell)
- **FR-032**: System MUST calculate movement costs as 1 cell = 5 feet of movement speed

*Battle Format:*
- **FR-033**: System architecture MUST support multiple combatants per side (designed for 2v2)
- **FR-034**: System MUST implement 1v1 single battles as the initial battle format
- **FR-035**: Turn system MUST track initiative per-combatant (not per-side) to support future double battles
- **FR-036**: Command system MUST be designed to issue commands to specific Pokemon (supporting future multi-command turns)

*Weather & Terrain:*
- **FR-024**: System MUST implement weather effects (Harsh Sunlight, Rain, Sandstorm, Hail, Snow, Fog) with damage modifiers
- **FR-025**: System MUST implement terrain effects (Electric, Grassy, Misty, Psychic) with damage bonuses and status immunities

*Advanced Systems:*
- **FR-026**: System MUST implement Bond system with levels -3 to +3 affecting Pokemon behavior and granting Bond Points
- **FR-027**: System MUST implement catching mechanics with DC formula (10 + SR + level) and Pokeball modifiers
- **FR-028**: System MUST implement Pokemon ability effects for combat-relevant abilities from Source/abilities/abilities.json
- **FR-029**: System MUST implement Pokemon transformations (Mega Evolution, Z-Moves, Dynamax, Terastallization) per 5e rules

### Key Entities

**Combat Rule Entity**:
- Rule ID (from Source/rules/rules.json)
- Section (e.g., "Combat", "Status Conditions", "Pokemon Leveling")
- Title
- Rule Content Summary
- Implementation Status
- Codebase Reference (file:line or "N/A")
- Gap Type (if applicable): missing, partial, different, custom

**Move Mechanic Entity**:
- Move Category (damage, status, buff, utility)
- 5e Mechanic Description
- Current Implementation Behavior
- Alignment Status
- Alignment Recommendation

**Status Effect Entity**:
- Status Name (from 5e rules)
- 5e Behavior Description
- Current Implementation (from statusEffects.js)
- Differences Identified
- Alignment Recommendation

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Gap analysis covers 100% of rules in Source/rules/rules.json combat-related sections
- **SC-002**: Each identified gap includes a concrete file/function reference or "not implemented" designation
- **SC-003**: 100% of status effects defined in Source/rules/rules.json are analyzed against statusEffects.js
- **SC-004**: Priority matrix enables a developer to pick up any top-5 item and implement it without external dependencies
- **SC-005**: Recommendations document enables decision-making on alignment vs. intentional deviation within 15 minutes of reading
- **SC-006**: All move mechanics (attack rolls, damage calculation, STAB, type effectiveness) are mapped to codebase functions
- **SC-007**: All status effect implementations pass unit tests validating 5e rule compliance
- **SC-008**: All moves from Source/moves/moves.json are implemented with correct mechanics
- **SC-009**: Weather and terrain effects correctly modify damage and apply status immunities
- **SC-010**: Bond system correctly affects Pokemon behavior at each level (-3 to +3)
- **SC-011**: Catching mechanics correctly calculate DC with all Pokeball type modifiers
- **SC-012**: All combat-relevant abilities produce correct effects per Source/abilities/abilities.json
- **SC-013**: Pokemon transformations (Mega, Z-Move, Dynamax, Tera) function per 5e rules

---

## Research Findings: Pokemon 5e Source Rules Summary

### Combat Rules Overview (from Source/rules/rules.json)

**Initiative & Turn Order:**
- Each Pokemon rolls initiative separately using d20 + DEX modifier
- Trainer's turn happens concurrently with their first Pokemon in initiative
- Trainer actions: issue up to 2 commands (action), issue 2 bonus action commands
- If 3+ Pokemon out, only 2 can receive commands; others can only move

**Attack Roll Formula:**
- Attack Roll = d20 + Move Power Modifier + Proficiency Bonus
- Proficiency by level: L1-4: +2, L5-8: +3, L9-12: +4, L13-16: +5, L17-20: +6
- Critical hit on natural 20 (or lower for some moves)
- Critical miss on natural 1

**Damage Formula:**
- Damage = Dice Roll + Move Power Modifier + STAB (if applicable)
- Type effectiveness multiplier applied after all other bonuses
- STAB = Proficiency Bonus (when move type matches Pokemon type)

**Move Power:**
- Moves specify which attributes can power them (STR, DEX, CON, INT, WIS, CHA)
- If multiple options, Pokemon uses best modifier
- "none" power means no modifier added

**Saving Throw DC:**
- DC = 8 + Move Power Modifier + Proficiency Bonus

**Status Conditions (from 5e rules):**

| Status | Volatility | Duration | Key Effects |
|--------|-----------|----------|-------------|
| Asleep (SLP) | Volatile | 3 rounds | Incapacitated, restrained, disadvantage on saves. Wake on d20 roll 11+ |
| Burned (BRN) | Non-Volatile | Until cured | Roll damage twice take lower, prof bonus damage/turn. Fire immune |
| Frozen (FRZ) | Non-Volatile | Until cured/fire | Incapacitated, restrained. STR save DC 10+prof to break. Ice immune |
| Paralyzed (PAR) | Non-Volatile | Until cured | Disadvantage STR/DEX saves, half speed, d4=1 skip turn. Electric immune |
| Poisoned (PSN) | Non-Volatile | Until cured | Disadvantage checks/attacks, prof bonus damage/turn. Poison/Steel immune |
| Badly Poisoned | Non-Volatile | Until cured | Like poisoned but 2x prof damage/turn. Poison/Steel immune |
| Confused (CON) | Volatile | 3 rounds | No reactions, d8 roll for behavior each turn |
| Flinched (FLN) | Volatile | Until next turn | Disadvantage on all d20 rolls |

**Grace Period:** When recovering from status, immune to same status until end of next turn

**Switching Pokemon:**
- Recall: Uses action
- Send out: Uses bonus action
- New Pokemon cannot act until next turn
- Recall doesn't provoke AoO; sending out in threatened space does

**Attacks of Opportunity:**
- Triggered when leaving melee without Disengage
- Uses reaction, costs normal PP

**The Struggle Move:**
- Used when all PP exhausted
- Available anytime regardless of PP

**Type Effectiveness:**
- Super effective: 2x damage
- Not very effective: 0.5x damage
- Immune: 0 damage
- No double vulnerability/resistance stacking for dual types

---

## Research Findings: Current Codebase Implementation

### File-by-File Analysis

**lib/battleEngine.js:**
- `calculateAttackRoll()`: d20 + power mod + prof bonus - **ALIGNED**
- `calculateDamage()`: dice + power mod + STAB + effectiveness - **ALIGNED**
- `buildCombatant()`: Creates combatant from DB record - **ALIGNED**
- `processBattleTurn()`: Handles turn logic with status effects - **PARTIAL** (no AoO)
- `applyStruggleRecoil()`: 1d4 recoil damage - **NEEDS REVIEW** (5e doesn't specify recoil)

**lib/combatUtils.js:**
- `getProficiencyBonus()`: Level-based prof bonus - **ALIGNED**
- `getAttributeModifier()`: (attr - 10) / 2 - **ALIGNED** (D&D 5e standard)
- `getBestPowerModifier()`: Uses best from available powers - **ALIGNED**
- `hasSTAB()`: Checks move type vs Pokemon types - **ALIGNED**
- `calculateDamageBonus()`: Power mod + STAB prof - **ALIGNED**

**lib/statusEffects.js:**
- All 8 status types defined - **ALIGNED**
- Volatility flags correct - **ALIGNED**
- Tick damage for Burn/Poison - **ALIGNED**
- Type immunities - **ALIGNED**
- Paralysis d4 skip check - **ALIGNED**
- Sleep d20 wake check - **ALIGNED**
- Confused d8 behavior - **PARTIAL** (behavior options may differ)
- Grace period logic - **ALIGNED**

**lib/typeEffectiveness.js:**
- Full 18-type chart - **ALIGNED**
- Multiplier calculation - **ALIGNED**
- Dual-type handling - **ALIGNED**

**lib/initiativeUtils.js:**
- `rollInitiative()`: d20 + DEX mod - **ALIGNED**
- `sortByInitiative()`: Highest first, DEX tiebreaker - **ALIGNED**
- Trainer concurrent turn - **NOT IMPLEMENTED**

**lib/experienceUtils.js:**
- XP thresholds L1-20 - **ALIGNED**
- XP formula: 200 x level x SR - **ALIGNED**
- Catch XP bonus (1/5) - **ALIGNED**
- Currency award - **ALIGNED**

**lib/diceParser.js:**
- Level-based dice scaling - **ALIGNED**
- Critical range parsing - **ALIGNED**

**lib/diceRoller.js:**
- Standard dice rolling - **ALIGNED**
- Critical hit/miss detection - **ALIGNED**

**lib/battleState.js:**
- Grid-based positioning - **CUSTOM** (5e doesn't specify grid)
- Turn management - **ALIGNED**
- HP tracking - **ALIGNED**

---

## Gap Analysis Summary

### Fully Implemented (No Action Needed)

1. Attack roll calculation (d20 + power mod + prof)
2. Damage calculation (dice + power mod + STAB + effectiveness)
3. Proficiency bonus by level
4. Attribute modifiers (D&D 5e formula)
5. STAB bonus (proficiency added)
6. Type effectiveness chart (18 types)
7. Basic status effects (8 types with correct volatility)
8. Status type immunities
9. XP calculation formula
10. Initiative rolling (d20 + DEX)
11. Level-based dice scaling
12. Critical hit detection

### Partially Implemented (Needs Enhancement)

1. **Confused Status Behavior**: d8 roll outcomes may not match 5e exactly
   - 5e: 1-4 normal, 5 nothing, 6 self-Struggle, 7 nearest target Struggle, 8 ends
   - Current: Needs verification

2. **Flinched Status Effects**: Should impose disadvantage on all d20 rolls AND cause targets to have advantage on saves
   - Current: May only track basic state

3. **Burned Damage Penalty**: Should roll damage twice, take lower
   - Current: Only tracks tick damage

4. **Frozen Break Condition**: STR save DC 10 + applier's proficiency
   - Current: May use static DC

### Not Implemented (Requires New Features)

1. **Trainer Turn Concurrency**: Trainer acts with first Pokemon
   - Impact: Medium
   - Complexity: Medium

2. **Multi-Pokemon Commands**: 2 commands per action, 2 bonus commands
   - Impact: High (enables double battles)
   - Complexity: Complex

3. **Attacks of Opportunity**: Triggered by leaving melee range
   - Impact: Medium
   - Complexity: Medium

4. **Switching Pokemon Mechanics**: Action to recall, bonus to send, provoke AoO
   - Impact: High
   - Complexity: Medium

5. **Readying Actions**: Hold a move as reaction with concentration
   - Impact: Low
   - Complexity: Medium

6. **Weather Effects**: Advantage/disadvantage on damage rolls
   - Impact: Medium
   - Complexity: Medium

7. **Terrain Effects**: Bonus damage, healing, status immunity
   - Impact: Medium
   - Complexity: Complex

8. **Bond System**: Bond levels affecting Pokemon behavior and granting reroll points
   - Impact: High
   - Complexity: Complex

9. **Catching Mechanics**: DC formula, Pokeball modifiers, advantage conditions
   - Impact: High
   - Complexity: Medium

10. **Saving Throw Moves**: Some moves require saves instead of attack rolls
    - Impact: High
    - Complexity: Medium

11. **Move Concentration**: Some moves require concentration
    - Impact: Medium
    - Complexity: Medium

12. **Ability Effects**: Over 100 abilities with combat effects
    - Impact: Very High
    - Complexity: Very Complex

13. **PP Restoration**: Short/Long rest PP recovery rules
    - Impact: Medium
    - Complexity: Simple

14. **Pokemon Transformations**: Mega Evolution, Z-Moves, Dynamax, Terastallization
    - Impact: High
    - Complexity: Very Complex

### Differently Implemented (Intentional Design Decisions)

1. **Grid-Based Combat**: Codebase uses 10x10 grid with 1 cell = 5 feet conversion
   - Decision: Keep grid system, convert all 5e feet-based ranges to cells (RESOLVED)

2. **Struggle Recoil**: Codebase has 1d4 recoil; 5e doesn't mention recoil
   - Decision: Remove recoil to align with 5e rules (RESOLVED - see FR-037)

---

## Priority Recommendations

### Phase 1: Core Combat Accuracy (High Priority)

| Item | Complexity | Dependencies |
|------|------------|--------------|
| Fix Burned damage penalty | Simple | None |
| Fix Flinched full effects | Simple | None |
| Fix Frozen break DC | Simple | None |
| Verify Confused d8 outcomes | Simple | None |
| Implement saving throw moves | Medium | Move data updates |

### Phase 2: Battle Flow Improvements (Medium Priority)

| Item | Complexity | Dependencies |
|------|------------|--------------|
| Pokemon switching mechanics | Medium | Turn system |
| Attacks of Opportunity | Medium | Position tracking |
| PP restoration rules | Simple | Rest system |
| Weather effects | Medium | New weather system |

### Phase 3: Advanced Features (Lower Priority)

| Item | Complexity | Dependencies |
|------|------------|--------------|
| Trainer concurrent turns | Medium | Initiative system |
| Multi-Pokemon commands | Complex | Turn system |
| Bond system | Complex | New DB table |
| Ability effects | Very Complex | Per-ability work |
| Terrain effects | Complex | Grid system |
| Transformations | Very Complex | Multiple systems |

### Phase 4: Catching & Progression (Separate Track)

| Item | Complexity | Dependencies |
|------|------------|--------------|
| Catch DC formula | Medium | Pokeball data |
| Pokeball type bonuses | Medium | Item system |
| Advantage conditions | Simple | Status tracking |

---

## Assumptions

1. The codebase is intended for a web-based Pokemon game that simplifies some tabletop mechanics
2. Grid-based combat uses 1 cell = 5 feet conversion to align with D&D 5e standards
3. Not all 100+ abilities need immediate implementation; prioritize common abilities
4. Struggle recoil may be an intentional balance feature even if not in 5e rules
5. Architecture supports double battles (2v2) but initial implementation is single battles (1v1)
6. Weather and terrain effects can be added incrementally as specific zones require them
