# Implementation Plan: Move Data Extraction

**Branch**: `028-move-data-extraction` | **Date**: 2026-01-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/028-move-data-extraction/spec.md`

## Summary

Extract structured mechanical data from 800 move descriptions in `Source/moves/moves.json` into new fields (`save`, `damage`, `flavor`, `extra_effects`, `scaling`) while preserving backward compatibility. This is a **data transformation feature** that runs a one-time extraction script to enrich the static move data, enabling the combat engine to access move mechanics without runtime string parsing.

## Technical Context

**Language/Version**: JavaScript ES2020+ (Node.js 18+)
**Primary Dependencies**: None new - uses existing lib/ utilities
**Storage**: Static JSON file (`Source/moves/moves.json`)
**Testing**: Manual verification via test harness + spot-check script
**Target Platform**: Next.js 14 (data consumed by both server and client)
**Project Type**: Single project - data transformation script
**Performance Goals**: N/A (one-time transformation)
**Constraints**: Must preserve backward compatibility with existing description field
**Scale/Scope**: 800 moves to process

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Two-Tier Data Architecture | PASS | Modifying Source/ data (static), no Supabase changes |
| II. D&D 5e Combat System | PASS | Extracting existing D&D-style mechanics (saves, damage dice) |
| III. Test Harness First | PASS | Will verify via existing test harness after extraction |
| IV. Security by Default | N/A | No user data or API endpoints |
| V. Simplicity Over Abstraction | PASS | Simple regex-based extraction, no new abstractions |
| VI. Consistent Code Patterns | PASS | Script follows existing lib/ patterns |
| VII. Library Module Organization | PASS | Extends existing moveEffectParser.js or diceParser.js |
| VIII. API Response Standards | N/A | No API changes |
| IX. Feature Branch Convention | PASS | `028-move-data-extraction` |

**Constitution Compliance**: All applicable gates pass.

## Project Structure

### Documentation (this feature)

```text
specs/028-move-data-extraction/
├── plan.md              # This file
├── research.md          # Pattern analysis results
├── data-model.md        # Extracted field schemas
├── quickstart.md        # How to run extraction
└── checklists/          # Validation checklists
```

### Source Code (repository root)

```text
scripts/
└── extract-move-data.js    # One-time extraction script

lib/
├── diceParser.js           # Existing - may add helpers
└── moveEffectParser.js     # Existing - may extend

Source/moves/
└── moves.json              # Modified with new fields
```

**Structure Decision**: Single extraction script in `scripts/`, extending existing lib/ parsers as needed. No new lib/ files required - the extraction logic lives in the script, with reusable parsing added to existing modules.

## Complexity Tracking

No constitution violations - no entries needed.
