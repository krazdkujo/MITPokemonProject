# Implementation Plan: Remove Random Mode from Combat Harness

**Branch**: `027-combat-ai-harness` | **Date**: 2026-01-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/027-combat-ai-harness/spec.md`

## Summary

Remove the random AI mode from the combat test harness so all simulations use tactical AI mode exclusively. This aligns with the constitution's directive that "test harness should default to tactical mode for consistent observation" and enables reliable AI tuning through the test harness infrastructure.

## Technical Context

**Language/Version**: JavaScript ES2020+ with Node.js 18+
**Primary Dependencies**: Next.js 14.0.0 (Pages Router), React 18.2.0, existing lib/combatSimulator.js, lib/combatAI.js
**Storage**: N/A (in-memory simulation state, no database changes)
**Testing**: Manual testing via web harness (`/test-combat`) and CLI (`npm run test:combat`)
**Target Platform**: Web browser and CLI
**Project Type**: Web application (Next.js with API routes)
**Performance Goals**: Combat turn calculation under 100ms (unchanged)
**Constraints**: Must preserve seeded RNG reproducibility for deterministic AI decisions
**Scale/Scope**: Refactor 4 files, remove ~50 lines, simplify AI selection logic

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Two-Tier Data Architecture** | N/A | No data changes - purely code refactor |
| **II. D&D 5e Combat System** | ✅ PASS | Tactical AI preserves all D&D 5e mechanics |
| **II-A. Combat AI** | ✅ PASS | Constitution states "test harness should default to tactical mode" |
| **III. Test Harness First** | ✅ PASS | Change improves test harness consistency for AI tuning |
| **IV. Security by Default** | N/A | No auth/security changes |
| **V. Simplicity Over Abstraction** | ✅ PASS | Removes complexity (AI mode selection) |
| **VI. Consistent Code Patterns** | ✅ PASS | Follows existing API patterns |
| **VII. Library Module Organization** | ✅ PASS | Changes within COMBAT ENGINE domain |
| **VIII. API Response Standards** | ✅ PASS | API endpoints maintain response format |
| **IX. Feature Branch Convention** | ✅ PASS | Branch is `027-combat-ai-harness` |

**Gate Result**: ✅ PASSED - Change aligns with constitution (explicitly recommended)

## Project Structure

### Documentation (this feature)

```text
specs/027-combat-ai-harness/
├── plan.md              # This file
├── research.md          # Phase 0 output (minimal - straightforward change)
├── quickstart.md        # Phase 1 output (verification steps)
├── checklists/          # Validation checklists
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (files to modify)

```text
lib/
├── combatSimulator.js   # Remove AI_MODE.RANDOM, default to tactical
└── combatAI.js          # No changes needed (AI_WEIGHTS preserved)

pages/
├── test-combat.js       # Remove AI mode toggle UI
└── api/test-combat/
    └── start.js         # Ignore aiMode param, always use tactical

scripts/
└── test-combat.js       # Remove --aiMode CLI flag (if present)
```

**Structure Decision**: Modify existing files only - no new files needed. This is a simplification refactor.

## Complexity Tracking

> No violations - this change reduces complexity.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

---

## Changes Summary

### 1. lib/combatSimulator.js

**Remove:**
- `AI_MODE` constant object (lines 49-52)
- `aiMode` parameter from `createSimulation()` config
- Random selection logic in `selectMove()` function (lines 782-788)
- `aiMode` property from simulation state

**Keep:**
- `selectMoveTactical()` function (becomes the only selection method)
- All tactical scoring logic
- AI reasoning logging

### 2. pages/test-combat.js

**Remove:**
- `aiMode` state variable (line 59)
- AI mode toggle/selector UI component
- `aiMode` from API request body (line 182)

**Keep:**
- All other battle controls (seed, speed, step mode)
- Quick Battle generator functionality

### 3. pages/api/test-combat/start.js

**Remove:**
- `AI_MODE` import
- `aiMode` validation logic (line 40)
- `aiMode` from createSimulation call

**Keep:**
- All other validation and response format

### 4. scripts/test-combat.js (CLI)

**Remove:**
- `--aiMode` flag handling (if present)

**Default behavior:**
- Always use tactical mode for CLI battles

---

## Post-Design Constitution Re-Check

*Gate re-evaluation after Phase 1 design completion.*

| Principle | Status | Post-Design Notes |
|-----------|--------|-------------------|
| **II-A. Combat AI** | ✅ PASS | Implements constitution recommendation |
| **III. Test Harness First** | ✅ PASS | All changes testable via existing harness |
| **V. Simplicity Over Abstraction** | ✅ PASS | Removes ~50 lines of code, 1 fewer code path |

**Post-Design Gate Result**: ✅ PASSED - Design simplifies codebase while improving AI tuning workflow

---

## Generated Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Implementation Plan | `specs/027-combat-ai-harness/plan.md` | ✅ Complete |
| Research | `specs/027-combat-ai-harness/research.md` | ✅ Complete |
| Quickstart Guide | `specs/027-combat-ai-harness/quickstart.md` | ✅ Complete |
| Agent Context | `CLAUDE.md` | ✅ Updated |
| Data Model | N/A | Not needed (no entities) |
| API Contracts | N/A | Not needed (existing API, minor change) |
