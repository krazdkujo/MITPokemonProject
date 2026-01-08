# Research: Remove Random Mode from Combat Harness

**Feature**: 027-combat-ai-harness
**Date**: 2026-01-07

## Research Summary

This feature is a straightforward refactor to remove the random AI mode. Research confirms the approach is low-risk and aligns with existing architecture.

---

## 1. Current AI Mode Implementation

**Context**: How is AI mode selection currently implemented?

**Findings**:

The `AI_MODE` constant in `combatSimulator.js` (lines 49-52):
```javascript
export const AI_MODE = {
  RANDOM: 'random',     // Random move selection (original behavior)
  TACTICAL: 'tactical'  // Weighted scoring from combatAI.js
};
```

The `selectMove()` function (lines 772-793) branches on `aiMode`:
- `AI_MODE.RANDOM`: Uses `rng.random()` to pick a random available move
- `AI_MODE.TACTICAL`: Calls `selectMoveTactical()` for weighted scoring

**Decision**: Remove the RANDOM branch entirely, always call `selectMoveTactical()`

**Rationale**:
- Constitution explicitly states "test harness should default to tactical mode"
- Random mode adds no value for AI tuning (its only use case)
- Removing reduces code paths and simplifies maintenance

---

## 2. UI Implementation Analysis

**Context**: How is the AI mode toggle exposed in the UI?

**Findings** (from `pages/test-combat.js`):
- State: `const [aiMode, setAiMode] = useState('random');` (line 59)
- Used in API call: `aiMode: aiMode` in request body (line 182)
- UI toggle appears to be a simple dropdown selector

**Decision**: Remove `aiMode` state and any associated UI elements

**Rationale**: Without the backend option, UI toggle serves no purpose

---

## 3. API Endpoint Behavior

**Context**: How does the API handle aiMode parameter?

**Findings** (from `pages/api/test-combat/start.js`):
```javascript
const validAiMode = aiMode === AI_MODE.TACTICAL ? AI_MODE.TACTICAL : AI_MODE.RANDOM;
```

Defaults to RANDOM if not specified or invalid.

**Decision**: Remove `aiMode` handling entirely, always use tactical

**Rationale**: Simpler code, consistent behavior, no backward compatibility concerns (test harness only)

---

## 4. CLI Tool Analysis

**Context**: Does the CLI support `--aiMode`?

**Findings**: Need to verify `scripts/test-combat.js`

**Decision**: If flag exists, remove it. If not, no changes needed.

**Rationale**: CLI should match web harness behavior

---

## 5. Seeded RNG Impact

**Context**: Will removing random mode affect reproducibility?

**Findings**:
- Tactical mode already uses seeded RNG for deterministic decisions
- `selectMoveTactical()` does not call `rng.random()` for selection (scoring is deterministic)
- Same seed + same config = identical AI decisions

**Decision**: No changes to RNG handling needed

**Rationale**: Tactical mode is already fully reproducible with seeds

---

## 6. AI Reasoning Logs

**Context**: Will AI reasoning still be logged?

**Findings** (from `combatSimulator.js` lines 290-296):
```javascript
if (simulation.aiMode === AI_MODE.TACTICAL && moveSelection.reasoning.length > 0) {
  turnLog.push({
    type: 'ai_reasoning',
    ...
  });
}
```

**Decision**: Remove the `aiMode === AI_MODE.TACTICAL` check, always log reasoning

**Rationale**: Reasoning logs are valuable for AI tuning (the whole point of this change)

---

## 7. Backward Compatibility

**Context**: Are there any consumers that depend on random mode?

**Findings**:
- Test harness is development-only infrastructure
- No production code references `AI_MODE.RANDOM`
- No external APIs expose AI mode selection

**Decision**: No backward compatibility concerns

**Rationale**: Internal dev tool, no external consumers

---

## Summary of Decisions

| Question | Decision |
|----------|----------|
| Remove AI_MODE constant? | Yes, completely remove |
| Remove random branch in selectMove? | Yes, always call selectMoveTactical |
| Remove UI toggle? | Yes, with aiMode state |
| Remove API aiMode handling? | Yes, always use tactical |
| Change RNG behavior? | No changes needed |
| Always log AI reasoning? | Yes, remove conditional check |
| Backward compatibility? | Not a concern |

---

## Risk Assessment

**Risk Level**: Low

**Risks Identified**:
1. None significant - purely subtractive change

**Mitigations**:
1. Test with same seed before/after to verify reproducibility maintained
2. Verify AI reasoning appears in battle logs

---

## No Outstanding Research Items

All questions resolved. Ready for implementation.
