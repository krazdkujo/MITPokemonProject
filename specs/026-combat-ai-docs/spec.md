# Feature Specification: Combat AI Documentation

**Feature Branch**: `026-combat-ai-docs`
**Created**: 2026-01-07
**Status**: Draft
**Input**: User description: "Create a detailed document that explains all of the pieces of the combat AI system, the weights, and decision making tree."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Understanding AI Weights (Priority: P1)

A developer or designer wants to understand the numeric weights used by the tactical AI to evaluate different combat options, so they can tune or balance combat difficulty.

**Why this priority**: The AI weights are the core values that determine AI behavior. Understanding these is foundational to any AI tuning or debugging work.

**Independent Test**: Can be fully tested by reading the documentation section on weights and verifying each weight constant is explained with its purpose and impact on decision-making.

**Acceptance Scenarios**:

1. **Given** a reader accessing the AI weights documentation, **When** they look up a specific weight (e.g., TYPE_ADVANTAGE_2X), **Then** they find a clear explanation of what the weight does, its numeric value, and when it applies.
2. **Given** a developer debugging AI behavior, **When** they want to understand why the AI chose a specific move, **Then** they can trace the decision through documented weights to understand the scoring.

---

### User Story 2 - Understanding Decision Flow (Priority: P2)

A developer wants to understand the complete decision-making process the AI uses to select moves and targets, from initial evaluation through final action selection.

**Why this priority**: Understanding the decision flow is essential for debugging AI behavior and implementing improvements. This builds on the weights knowledge from P1.

**Independent Test**: Can be fully tested by following the documented decision tree for a sample combat scenario and arriving at the same conclusion the AI would make.

**Acceptance Scenarios**:

1. **Given** a reader reviewing the decision flow, **When** they examine the move selection process, **Then** they can follow a clear sequence of evaluation steps from available moves to final selection.
2. **Given** a combat scenario with specific conditions, **When** following the documented decision tree, **Then** the expected move selection matches what the AI would actually choose.

---

### User Story 3 - Understanding AI Components (Priority: P3)

A developer wants to understand all the individual components that make up the combat AI system and how they interact with each other.

**Why this priority**: Component-level documentation provides context for the system architecture and helps developers understand where to make changes.

**Independent Test**: Can be fully tested by verifying each component function is documented with inputs, outputs, and purpose.

**Acceptance Scenarios**:

1. **Given** a reader exploring the AI components, **When** they look up a function like `scoreMoveOption`, **Then** they find documentation of its purpose, parameters, return values, and role in the larger system.
2. **Given** a developer adding new AI behavior, **When** they need to understand which component to modify, **Then** the documentation clearly indicates component responsibilities and interactions.

---

### Edge Cases

- What happens when no valid moves are available (Struggle fallback)?
- How are out-of-range targets handled when movement cannot close the gap?
- What behavior occurs when all targets are fainted?
- How does the AI break ties when multiple moves have identical scores?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Documentation MUST list all AI weight constants with their numeric values
- **FR-002**: Documentation MUST explain the purpose and impact of each weight constant
- **FR-003**: Documentation MUST describe the complete move selection algorithm step-by-step
- **FR-004**: Documentation MUST explain the target selection logic
- **FR-005**: Documentation MUST describe movement calculation for approaching targets
- **FR-006**: Documentation MUST differentiate between "random" and "tactical" AI modes
- **FR-007**: Documentation MUST explain how type effectiveness affects scoring
- **FR-008**: Documentation MUST describe PP tracking and its impact on move selection
- **FR-009**: Documentation MUST explain range checking and out-of-range penalties
- **FR-010**: Documentation MUST describe status move handling (avoiding stacking on already-statused targets)
- **FR-011**: Documentation MUST explain self-targeting move (buff) handling
- **FR-012**: Documentation MUST include a visual decision tree or flowchart
- **FR-013**: Documentation MUST provide example scenarios showing score calculations

### Key Entities

- **AI_WEIGHTS**: The collection of numeric constants that control scoring behavior
- **scoreMoveOption()**: Function that evaluates a single move against a target
- **selectMoveTactical()**: Function that selects the best move using weighted scoring
- **calculateOptimalMovement()**: Function that determines movement toward targets
- **findBestTarget()**: Function that selects the optimal attack target
- **executeAITurn()**: Main orchestration function that executes a complete AI turn
- **AI_MODE**: Configuration constant determining random vs tactical behavior

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Documentation covers 100% of AI weight constants defined in the combat AI module
- **SC-002**: A developer unfamiliar with the codebase can trace an AI decision from start to finish using only the documentation within 10 minutes
- **SC-003**: Documentation includes at least 3 worked examples showing complete score calculations
- **SC-004**: All documented behaviors match actual AI implementation (verified by code review)
- **SC-005**: Documentation includes visual representation of decision flow (flowchart or decision tree)

## Assumptions

- The documentation will be created as a Markdown file for easy version control and rendering
- The documentation is intended for developers and technical stakeholders, not end users
- The documentation will reference but not duplicate the source code
- The existing AI implementation is considered the source of truth for documented behavior
- The documentation will be placed in the specs directory alongside other feature documentation
