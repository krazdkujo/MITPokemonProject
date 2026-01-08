# Implementation Plan: Combat AI Documentation

**Branch**: `026-combat-ai-docs` | **Date**: 2026-01-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/026-combat-ai-docs/spec.md`

## Summary

Create comprehensive documentation for the combat AI system, explaining all weight constants, decision-making algorithms, and component interactions. The documentation will be a Markdown file with visual diagrams, worked examples, and complete reference material for developers.

## Technical Context

**Language/Version**: N/A (Documentation only - Markdown)
**Primary Dependencies**: N/A (Reads existing `lib/combatAI.js` and `lib/combatSimulator.js`)
**Storage**: N/A (Static Markdown file)
**Testing**: Manual review against source code for accuracy
**Target Platform**: GitHub/IDE Markdown rendering
**Project Type**: Documentation artifact
**Performance Goals**: N/A
**Constraints**: Must accurately reflect current implementation
**Scale/Scope**: Single comprehensive documentation file (~500-1000 lines)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The constitution template is not yet configured for this project. Proceeding with standard documentation best practices:

| Gate | Status | Notes |
|------|--------|-------|
| No code changes | PASS | Documentation only |
| Accuracy requirement | PASS | Will verify against source |
| Format requirement | PASS | Markdown for portability |

## Project Structure

### Documentation (this feature)

```text
specs/026-combat-ai-docs/
├── plan.md              # This file
├── research.md          # Phase 0 output - AI system analysis
├── data-model.md        # Phase 1 output - AI weight/entity reference
├── quickstart.md        # Phase 1 output - Quick reference guide
└── contracts/           # Phase 1 output - N/A for documentation
```

### Source Code (documentation output location)

```text
docs/
└── combat-ai-system.md  # Final documentation deliverable
```

**Structure Decision**: Documentation-only feature. Output is a single Markdown file in `/docs/` directory, with supporting research artifacts in the specs folder.

## Complexity Tracking

No violations - documentation-only feature with straightforward deliverables.

---

## Phase 0: Research & Analysis

### Research Tasks

1. **Extract complete AI_WEIGHTS constant values** from `lib/combatAI.js`
2. **Map decision flow** through `executeAITurn()`, `scoreMoveOption()`, `selectMoveTactical()`
3. **Document AI_MODE differences** between random and tactical modes
4. **Identify edge cases** (Struggle, no targets, ties)

### Findings

See `research.md` for complete analysis.

---

## Phase 1: Design & Structure

### Documentation Structure

The final documentation will follow this structure:

1. **Overview** - Purpose and AI modes
2. **AI Weight Reference** - Complete table of all weights
3. **Decision Flow** - Step-by-step algorithm with flowchart
4. **Component Reference** - Function documentation
5. **Worked Examples** - 3+ score calculation scenarios
6. **Edge Cases** - Special handling documentation

### Key Entities to Document

| Entity | Location | Purpose |
|--------|----------|---------|
| `AI_WEIGHTS` | combatAI.js:15-34 | Scoring constants |
| `scoreMoveOption()` | combatAI.js:61-131 | Move scoring |
| `findBestTarget()` | combatAI.js:141-169 | Target selection |
| `calculateOptimalMovement()` | combatAI.js:179-266 | Movement planning |
| `executeAITurn()` | combatAI.js:276-360 | Main orchestration |
| `selectMoveTactical()` | combatSimulator.js:804-933 | Tactical mode selection |
| `AI_MODE` | combatSimulator.js:49-52 | Mode constants |

### Visual Artifacts

- ASCII flowchart for decision tree
- Weight impact table
- Score calculation breakdown diagrams

---

## Deliverables Summary

| Artifact | Purpose | Location |
|----------|---------|----------|
| research.md | AI system analysis | specs/026-combat-ai-docs/ |
| data-model.md | Weight/entity reference | specs/026-combat-ai-docs/ |
| quickstart.md | Quick reference | specs/026-combat-ai-docs/ |
| combat-ai-system.md | Final documentation | docs/ |
