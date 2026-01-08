# Data Filter Contract: Gen 1 Pokemon Reduction

**Feature Branch**: `025-gen1-pokemon`
**Date**: 2026-01-07

## Overview

This contract defines the data transformation rules for reducing Pokemon data to Gen 1 (IDs 1-151).

## Contract 1: Pokemon Filter

### Input
- File: `Source/pokemon/pokemon.json`
- Format: JSON array of Pokemon objects
- Count: 1,142 entries

### Transformation Rule
```
FILTER pokemon WHERE pokemon.number >= 1 AND pokemon.number <= 151
```

### Output
- File: `Source/pokemon/pokemon.json` (overwrite)
- Format: JSON array of Pokemon objects
- Count: 151 entries

### Validation
- Output count must be exactly 151
- All entries must have `number` field in range [1, 151]
- No duplicate `id` or `number` values

---

## Contract 2: Location Encounter Filter

### Input
- File: `Source/locations.json`
- Format: JSON array of Location objects with `pokemon` arrays

### Transformation Rule
```
FOR each location IN locations:
  location.pokemon = FILTER location.pokemon
    WHERE pokemon.id EXISTS IN (filtered pokemon.json)
```

### Output
- File: `Source/locations.json` (overwrite)
- Format: JSON array of Location objects
- All `pokemon` arrays contain only Gen 1 Pokemon references

### Validation
- Every Pokemon ID in any `pokemon[]` array must exist in filtered pokemon.json
- No location should have empty `pokemon[]` array (warn if so)

---

## Contract 3: Evolution Chain Filter

### Input
- File: `Source/evolution/evolution.json`
- Format: JSON array/object of evolution chain definitions

### Transformation Rule
```
FOR each evolution_entry:
  IF base_pokemon.number NOT IN [1-151]:
    REMOVE entry
  ELSE:
    evolution_entry.evolutions = FILTER evolution_entry.evolutions
      WHERE target_pokemon.number IN [1-151]
```

### Output
- File: `Source/evolution/evolution.json` (overwrite)
- Format: Same structure, filtered content

### Validation
- All referenced Pokemon IDs must be Gen 1
- Evolution chains must not be orphaned (base exists, all targets exist)

---

## Contract 4: Image Cleanup

### Input
- Directory: `public/images/pokemon/`
- Files: `1.png` through `1025.png`, `placeholder.png`

### Transformation Rule
```
DELETE files WHERE filename matches pattern [152-1025].png
KEEP files WHERE filename matches pattern [1-151].png OR filename = 'placeholder.png'
```

### Output
- Directory: `public/images/pokemon/` (same location)
- Files: `1.png` through `151.png`, `placeholder.png`

### Validation
- Exactly 152 files remain (151 Pokemon + placeholder)
- No files with numbers > 151 exist
- All files 1-151 exist (no gaps)

---

## Contract 5: Database Migration (Optional)

### Input
- Table: `player_pokemon`
- Records with `pokemon_id` referencing any Pokemon

### Transformation Rule
```sql
DELETE FROM player_pokemon
WHERE pokemon_id NOT IN (
  SELECT id FROM (
    -- Gen 1 Pokemon IDs from filtered pokemon.json
    'bulbasaur', 'ivysaur', 'venusaur', ..., 'mew'
  )
)
```

### Output
- Table: `player_pokemon`
- All records reference valid Gen 1 Pokemon

### Validation
- All `pokemon_id` values exist in filtered pokemon.json
- No orphaned records

---

## Error Handling

| Scenario | Action |
|----------|--------|
| Pokemon ID not found in filter | Remove reference |
| Empty encounter pool after filter | Log warning, keep location |
| Evolution target not in Gen 1 | Remove evolution path |
| Image file missing for Gen 1 Pokemon | Log error, download/create |
| Database record references invalid Pokemon | Delete record |

## Rollback Strategy

Before applying changes:
1. Backup `Source/pokemon/pokemon.json` → `pokemon.json.backup`
2. Backup `Source/locations.json` → `locations.json.backup`
3. Backup `Source/evolution/evolution.json` → `evolution.json.backup`
4. Create image manifest before deletion

To rollback:
1. Restore backup files
2. Re-download deleted images (or restore from backup)
3. No database rollback (migration is optional/manual)
