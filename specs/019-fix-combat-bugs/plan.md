# Implementation Plan: Fix Combat System Bugs

**Branch**: `019-fix-combat-bugs` | **Date**: 2026-01-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/019-fix-combat-bugs/spec.md`

## Summary

This bug fix addresses three critical issues in the grid-based combat system introduced in feature 018:
1. **No opponent feedback**: Battle ends before showing opponent's attack details
2. **HP not persisted**: Pokemon HP is not saved to database when battle ends
3. **Stale battles remain**: `active_battles` records are never cleaned up on victory/defeat

The root causes are: (1) immediate phase transition on knockout, (2) no API call to persist HP to `player_pokemon` table, and (3) no cleanup of `active_battles` records.

## Technical Context

**Language/Version**: JavaScript (ES2020+) with Node.js 18+ / Next.js 14
**Primary Dependencies**: React 18, @supabase/supabase-js, existing lib/battleEngine.js, lib/battleState.js
**Storage**: Supabase PostgreSQL (existing tables: active_battles, player_pokemon)
**Testing**: Manual testing via dev server as specified in plan.md
**Target Platform**: Web (Vercel serverless)
**Project Type**: Web application (Next.js monorepo)
**Performance Goals**: Battle end processing < 2 seconds
**Constraints**: Must maintain backward compatibility with existing combat flow
**Scale/Scope**: Bug fix - no new tables or major architectural changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Two-Tier Data Model | PASS | Bug fix only updates user state (HP) in DB, no Source changes |
| II. External JWT Authentication | PASS | Uses existing auth pattern from /api/battle endpoints |
| III. Row-Level Security | PASS | All DB updates filter by user_id |
| IV. Data Merging Pattern | PASS | No changes to merge pattern needed |
| V. Serverless Architecture | PASS | New endpoint follows existing pattern |
| VI. Pokemon 5e Compliance | PASS | No game mechanics changes |
| VII. Educational API Design | PASS | API responses follow existing envelope pattern |
| VIII. Spec-Driven Development | PASS | Following spec workflow |

**All gates pass - no violations to justify.**

## Project Structure

### Documentation (this feature)

```text
specs/019-fix-combat-bugs/
├── plan.md              # This file
├── research.md          # Bug investigation findings
├── data-model.md        # State transition documentation
├── quickstart.md        # Testing guide
├── contracts/           # API contract for new endpoint
└── tasks.md             # Implementation tasks (created by /speckit.tasks)
```

### Source Code (repository root)

```text
pages/
├── api/
│   └── battle/
│       ├── action.js      # MODIFY: Add HP persistence on battle end
│       └── end.js         # CREATE: New endpoint for battle cleanup
├── combat.js              # MODIFY: Add delay before showing defeat, call end API
└── pokecenter.js          # VERIFY: Should work after fixes

lib/
├── battleState.js         # MODIFY: Add async end handler
└── battleEngine.js        # VERIFY: No changes needed

components/
└── Combat/                # VERIFY: Battle log display should work
```

**Structure Decision**: Extends existing Next.js pages/api structure with one new endpoint.

## Complexity Tracking

> No constitution violations to justify.
