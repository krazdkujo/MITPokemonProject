# Research: Gen 1 Pokemon Reduction

**Feature Branch**: `025-gen1-pokemon`
**Date**: 2026-01-07

## Technical Context Discovery

### Pokemon Data Structure

**Decision**: Filter `Source/pokemon/pokemon.json` to entries where `number` is 1-151
**Rationale**: Pokemon data uses a `number` field that maps directly to National Pokedex ID. Filtering by this field is the cleanest approach.
**Alternatives considered**:
- Filtering by `id` field (rejected - IDs are string slugs, not numbers)
- Creating a new filtered file (rejected - unnecessary complexity)

### Current Data Statistics

| Data Type | Current Count | After Filter | Reduction |
|-----------|--------------|--------------|-----------|
| Pokemon entries | 1,142 | 151 | ~87% |
| Pokemon images | 1,026 | 152 (151 + placeholder) | ~85% |
| Locations | 5 | 5 (filter encounters) | 0% |
| Zones | 25 | 25 (no changes needed) | 0% |
| Moves | 800 | 800 (keep all) | 0% |
| Abilities | 328 | 328 (keep all) | 0% |

### Files Requiring Modification

**Decision**: Modify source data files, not code
**Rationale**: The existing codebase is data-agnostic. All Pokemon filtering, loading, and display logic works with whatever data is in the JSON files. No code changes required.
**Alternatives considered**:
- Adding runtime filters in lib functions (rejected - wasteful to load then filter)
- Adding validation checks in components (rejected - unnecessary when source is clean)

| File | Action Required |
|------|-----------------|
| `Source/pokemon/pokemon.json` | Filter to Pokemon #1-151 only |
| `Source/locations.json` | Update encounter arrays to valid Gen 1 Pokemon |
| `Source/evolution/evolution.json` | Remove non-Gen 1 evolutions |
| `public/images/pokemon/*.png` | Delete images #152-1025 |

### Files Requiring No Changes

| Category | Files | Reason |
|----------|-------|--------|
| Move Data | `Source/moves/moves.json` | Moves are not gen-restricted; Gen 1 Pokemon can learn any move |
| Ability Data | `Source/abilities/abilities.json` | Abilities are not gen-restricted |
| Zone Data | `Source/zones.json` | Zones filter by type/SR; auto-filters once pokemon.json is reduced |
| Library Code | `lib/*.js` | Data-agnostic; works with any Pokemon count |
| API Endpoints | `pages/api/**/*.js` | Data-agnostic; uses lib functions |
| Components | `components/**/*.js` | Data-agnostic; renders provided data |
| Database Schema | `sql/*.sql` | `pokemon_id` is TEXT field; no schema changes |

### Evolution Chain Handling

**Decision**: Remove evolution paths leading to Pokemon #152+
**Rationale**: Eevee can only evolve to Vaporeon (#134), Jolteon (#135), or Flareon (#136) in Gen 1. Evolutions like Espeon (#196) and Umbreon (#197) must be removed.
**Alternatives considered**:
- Blocking evolution in code (rejected - cleaner to remove from source data)
- Keeping all evolutions but hiding UI (rejected - data integrity issue)

### Cross-Generation Pokemon Variants

**Decision**: Exclude regional variants (Alolan, Galarian, etc.) of Gen 1 Pokemon
**Rationale**: Regional variants have different `number` values (e.g., Alolan Raichu is #26 in some data but may have variant suffix). The spec calls for "original 151" which means the Kanto originals only.
**Alternatives considered**:
- Including all entries with base number 1-151 (rejected - includes non-Gen 1 variants)

### Image File Pattern

**Decision**: Delete `public/images/pokemon/[152-1025].png`
**Rationale**: Images are named by Pokedex number. Simple pattern matching for deletion.
**Alternatives considered**:
- Moving to archive folder (rejected - spec says remove, not archive)

### Database Migration

**Decision**: Create migration script to clean existing player data
**Rationale**: Players may have caught Pokemon #152+ that no longer exist in filtered data. Must handle gracefully.
**Alternatives considered**:
- Ignoring (rejected - would cause runtime errors)
- Deleting all player data (rejected - spec says preserve valid Gen 1 data)

### Performance Considerations

**Decision**: No lazy loading or pagination needed
**Rationale**: 151 Pokemon is a small dataset (~500KB). Full load at startup is acceptable.
**Alternatives considered**:
- Virtual scrolling for lists (rejected - unnecessary for 151 items)
- Server-side pagination (rejected - small dataset)

## Research Conclusions

All technical unknowns resolved. Key findings:

1. **Data-only changes**: No code modifications required in lib/, pages/, or components/
2. **4 files to modify**: pokemon.json, locations.json, evolution.json, images directory
3. **Filtering approach**: Use `number` field (1-151) for Pokemon filtering
4. **Evolution handling**: Remove non-Gen 1 evolution paths from source data
5. **Image cleanup**: Delete ~874 image files (152-1025)
6. **Database migration**: Required to handle existing player data

## Technical Stack (from CLAUDE.md)

- **Language**: JavaScript (ES2020+) with Node.js 18+
- **Framework**: Next.js 14 (Pages Router)
- **Database**: Supabase PostgreSQL with RLS
- **UI**: React 18
- **Data Format**: JSON files in Source/ directory
- **Testing**: npm test, npm run lint
