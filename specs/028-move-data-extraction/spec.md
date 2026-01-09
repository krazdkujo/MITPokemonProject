# Feature Specification: Move Data Extraction

**Feature Branch**: `028-move-data-extraction`
**Created**: 2026-01-08
**Status**: Draft
**Input**: User description: "Extract structured data from move descriptions into separate fields for save, damage, flavor, and extra actions"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Combat System Reads Structured Move Data (Priority: P1)

The combat system needs to programmatically access move mechanics (damage dice, save types, effects) without parsing natural language descriptions at runtime. By extracting this data into structured fields, the combat engine can directly use the values for calculations.

**Why this priority**: This is the core purpose of the feature - enabling reliable, consistent combat calculations across all 800 moves.

**Independent Test**: Can be fully tested by loading any move and verifying the extracted fields match the original description's mechanics.

**Acceptance Scenarios**:

1. **Given** a move with an attack roll (e.g., Absorb), **When** the move data is loaded, **Then** structured fields contain: attack type (melee/ranged), damage dice (1d4), damage modifier (MOVE), damage type (grass)
2. **Given** a move with a saving throw (e.g., Acid), **When** the move data is loaded, **Then** structured fields contain: save type (DEX), save DC reference (Move DC), damage on fail (1d6 + MOVE), damage on success (half)
3. **Given** a move with extra effects (e.g., Tri Attack), **When** the move data is loaded, **Then** an extra_effects field contains the status condition trigger information

---

### User Story 2 - Developers Read Flavor Text Separately (Priority: P2)

Game developers and content creators need to access the narrative/flavor portions of move descriptions separately from mechanical data, enabling UI tooltips to show thematic descriptions while combat logic uses only the mechanical data.

**Why this priority**: Separation of concerns improves maintainability and enables richer UI presentation.

**Independent Test**: Can be tested by verifying that flavor text extracted from any move is grammatically complete and contains no mechanical notation (dice, DCs, damage types).

**Acceptance Scenarios**:

1. **Given** Tri Attack move, **When** flavor field is read, **Then** it contains "You strike with a simultaneous three-beam attack." without mechanical details
2. **Given** a move with only mechanical description (no flavor), **When** flavor field is read, **Then** it is empty or null
3. **Given** Absorb move, **When** flavor field is read, **Then** it contains "You attempt to absorb some of a target's health." without dice notation

---

### User Story 3 - Higher Level Scaling Is Structured (Priority: P3)

The combat system needs to apply level-based damage scaling without parsing the higherLevels text field at runtime.

**Why this priority**: Enables accurate damage scaling at different Pokemon levels.

**Independent Test**: Can be tested by loading a move with higherLevels data and verifying level thresholds map to correct damage dice.

**Acceptance Scenarios**:

1. **Given** Absorb with higherLevels "2d4 at level 5, 1d12 at level 10, 4d4 at level 17", **When** scaling data is loaded, **Then** structured object contains {5: "2d4", 10: "1d12", 17: "4d4"}
2. **Given** a move without higherLevels, **When** scaling data is loaded, **Then** the scaling field is empty or null

---

### Edge Cases

- What happens when a move description has no damage component (pure utility moves like Agility)?
- How does the system handle moves with multiple damage instances or multi-hit mechanics?
- What happens when description text has typos or inconsistent formatting in the source data?
- How are moves with conditional damage handled (e.g., "damage is halved if holding an item")?
- What happens when a move has both attack roll AND saving throw components?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST extract save information into a structured `save` field containing: save_type (STR/DEX/CON/INT/WIS/CHA), dc_reference (e.g., "Move DC"), effect_on_fail, effect_on_success
- **FR-002**: System MUST extract damage information into a structured `damage` field containing: dice_expression (e.g., "2d6"), modifier (e.g., "MOVE"), damage_type (e.g., "normal"), attack_type (melee/ranged/save/auto-hit)
- **FR-003**: System MUST extract flavor/narrative text into a `flavor` field containing only thematic descriptions without mechanical notation
- **FR-004**: System MUST extract extra effects into an `extra_effects` field containing status triggers, conditional effects, and secondary mechanics
- **FR-005**: System MUST extract higher level scaling into a `scaling` field mapping level thresholds to damage dice expressions
- **FR-006**: System MUST preserve the original `description` field unchanged for backward compatibility
- **FR-007**: System MUST handle moves with no damage component by leaving damage field empty/null
- **FR-008**: System MUST handle moves with no save component by leaving save field empty/null
- **FR-009**: System MUST process all 800 moves in the moves.json file

### Key Entities

- **Move**: Core entity with existing fields (id, name, type, power, time, pp, duration, range, description, higherLevels) plus new extracted fields (save, damage, flavor, extra_effects, scaling)
- **Save Info**: Sub-entity containing save_type, dc_reference, effect_on_fail, effect_on_success
- **Damage Info**: Sub-entity containing dice_expression, modifier, damage_type, attack_type
- **Scaling Info**: Sub-entity mapping level numbers to dice expressions

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of moves have their mechanical data correctly extracted (verified by spot-checking at least 50 representative moves across different move types)
- **SC-002**: Combat system can determine damage dice for any move without string parsing at runtime
- **SC-003**: Combat system can determine save type and DC for any save-based move without string parsing at runtime
- **SC-004**: Flavor text extraction produces grammatically coherent sentences for all moves that have flavor content
- **SC-005**: Zero regression in existing combat functionality - all current tests continue to pass
- **SC-006**: Data extraction completes for all 800 moves without errors

## Assumptions

- The source moves.json follows consistent patterns in description formatting (e.g., "XdY + MOVE type damage", "STAT save against Move DC")
- Some moves may have unconventional or malformed descriptions that require manual review
- The extraction can be done as a one-time data transformation script rather than runtime parsing
- Existing combat code will be updated to use new structured fields where available, falling back to description parsing for edge cases
