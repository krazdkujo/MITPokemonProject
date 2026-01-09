# Quickstart: Move Data Extraction

**Feature**: 028-move-data-extraction
**Date**: 2026-01-08

## Prerequisites

- Node.js 18+
- Repository cloned and dependencies installed (`npm install`)

## Running the Extraction

### 1. Backup Original Data

```bash
cp Source/moves/moves.json Source/moves/moves.json.backup
```

### 2. Run Extraction Script

```bash
node scripts/extract-move-data.js
```

**Options**:
```bash
# Dry run (no file writes)
node scripts/extract-move-data.js --dry-run

# Verbose output (show each move processed)
node scripts/extract-move-data.js --verbose

# Output warnings to file
node scripts/extract-move-data.js > extraction-log.txt 2>&1
```

### 3. Verify Results

```bash
# Run test harness to verify combat still works
npm run dev
# Open http://localhost:3000/test-combat

# Spot-check specific moves
node scripts/verify-move-extraction.js --move tri-attack
node scripts/verify-move-extraction.js --move absorb
node scripts/verify-move-extraction.js --move agility
```

## Expected Output

```
Move Data Extraction
====================
Processing 800 moves...

[INFO] Processed: absorb
  - damage: 1d4 + MOVE grass (melee)
  - save: none
  - flavor: "You attempt to absorb some of a target's health."
  - extra_effects: "Half the damage done is restored by the user."
  - scaling: {5: "2d4", 10: "1d12", 17: "4d4"}

[WARN] acupressure - description has [object Object], skipping flavor
[INFO] Processed: acupressure
  - damage: none
  - save: none
  - scaling: none

... (798 more moves) ...

Summary
=======
Total moves: 800
Successfully extracted: 798
Warnings: 12
Errors: 0

Warnings saved to: extraction-warnings.json
Output written to: Source/moves/moves.json
```

## Rollback

If extraction causes issues:

```bash
# Restore backup
cp Source/moves/moves.json.backup Source/moves/moves.json
```

## Verification Checklist

After extraction, verify:

- [ ] `npm run dev` starts without errors
- [ ] Test harness loads moves correctly
- [ ] Combat simulations work (random Pokemon battle)
- [ ] Damage calculations match previous behavior
- [ ] Save-based moves trigger saves correctly
- [ ] Status effects still apply

## File Changes

| File | Change |
|------|--------|
| `Source/moves/moves.json` | Added: `damage`, `save`, `flavor`, `extra_effects`, `scaling` fields |
| `scripts/extract-move-data.js` | New: Extraction script |
| `scripts/verify-move-extraction.js` | New: Verification helper |

## Troubleshooting

### "Cannot find module" error
```bash
npm install
```

### JSON parse error
Check `extraction-warnings.json` for malformed descriptions.

### Combat engine errors after extraction
Restore backup and check `extraction-log.txt` for which move caused issues.
