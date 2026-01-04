# Research: Pokemon Images Download

**Feature**: 004-pokemon-images
**Date**: 2026-01-03

## Research Questions

### 1. Image Source Selection

**Decision**: PokeAPI Sprites (GitHub raw content)

**Rationale**:
- PokeAPI is the de-facto standard for Pokemon data and sprites
- Free to use, no API key required
- Direct GitHub raw links enable simple HTTP downloads
- Sprites are already in PNG format with transparency
- Well-maintained repository with all generations available

**Alternatives Considered**:
- **Bulbapedia**: Higher quality artwork but requires scraping, inconsistent naming
- **Serebii**: Good quality but requires scraping, potential copyright issues
- **Official Pokemon Company assets**: Not freely available for download

**URL Pattern**:
```
https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{national_dex_number}.png
```

### 2. Sprite Resolution and Size

**Decision**: Use default PokeAPI sprites (96x96 pixels)

**Rationale**:
- Default sprites are 96x96 pixels, meeting FR-005 minimum requirement
- File sizes typically 2-15KB per sprite, well under 50KB limit (SC-004)
- Consistent sizing across all Pokemon
- PNG format with transparency for flexible UI integration

**Alternatives Considered**:
- **Official Artwork** (`other/official-artwork/`): 475x475 pixels, 100-300KB each - too large for sprite use
- **Dream World** (`other/dream-world/`): Higher quality but inconsistent availability
- **Home Sprites** (`other/home/`): 128x128, slightly larger but less consistent styling

### 3. File Naming Convention

**Decision**: Use national dex number (e.g., `1.png`, `2.png`, `151.png`)

**Rationale**:
- Matches PokeAPI URL pattern exactly
- Numeric sorting is straightforward
- Source `pokemon.json` includes `number` field for easy mapping
- Avoids issues with special characters in names (e.g., "Farfetch'd", "Mr. Mime")

**Alternatives Considered**:
- **Pokemon ID string** (e.g., `bulbasaur.png`): Would require name-to-number mapping
- **Padded numbers** (e.g., `001.png`): Unnecessary complexity, not matching PokeAPI pattern

### 4. Storage Location

**Decision**: `public/images/pokemon/` directory

**Rationale**:
- Next.js serves `public/` as static files automatically
- Files accessible at `/images/pokemon/{id}.png` without API routes
- Follows Next.js conventions for static assets
- Enables browser caching and CDN optimization on Vercel

**Alternatives Considered**:
- **Source/ folder**: Not appropriate; that's for Pokemon 5e JSON data
- **assets/ folder**: Would require custom serving configuration
- **External CDN**: Defeats purpose of local storage

### 5. Download Script Approach

**Decision**: Node.js script using native `fetch` with sequential downloads

**Rationale**:
- Node 18+ has native fetch, no additional dependencies
- Sequential downloads avoid rate limiting from GitHub
- One-time script run during development/setup
- Progress logging for visibility

**Alternatives Considered**:
- **Parallel downloads**: Risk of rate limiting from GitHub raw content
- **npm package** (e.g., `download`): Unnecessary dependency for simple HTTP fetch
- **Shell script with curl**: Less portable across development environments

### 6. Placeholder Image Strategy

**Decision**: Single `placeholder.png` file in the images directory

**Rationale**:
- Simple fallback for missing or corrupted images
- Can be a generic "Pokemon silhouette" or question mark design
- Single file minimizes storage overhead

**Implementation**:
- Create simple SVG-based placeholder, convert to PNG
- Use in PokemonSprite component when image fails to load
- Reference as `/images/pokemon/placeholder.png`

## Source Data Integration

The `Source/pokemon/pokemon.json` file contains a `number` field for each Pokemon that corresponds to the national dex number:

```json
{
  "id": "bulbasaur",
  "name": "Bulbasaur",
  "number": 1,
  ...
}
```

This enables mapping between:
- Source data ID (`"bulbasaur"`) for game logic
- Dex number (`1`) for image file path (`/images/pokemon/1.png`)

The `pokemonImages.js` helper will use this mapping pattern.

## Verification Strategy

1. **Count verification**: Script logs total downloads, should be 151
2. **File integrity**: Check each file is valid PNG with non-zero size
3. **Visual verification**: Display all sprites in a test grid page
4. **Load testing**: Measure load time to verify <100ms target

## Dependencies

No new npm dependencies required:
- Node.js 18+ native `fetch` for downloads
- Node.js native `fs` for file operations
- Next.js static file serving (already configured)
