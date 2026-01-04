# Data Model: Pokemon Images Download

**Feature**: 004-pokemon-images
**Date**: 2026-01-03

## Overview

This feature involves static file assets rather than database entities. The "data model" describes the file organization and access patterns.

## File Structure

### Pokemon Sprites Directory

```
public/
└── images/
    └── pokemon/
        ├── 1.png           # Bulbasaur
        ├── 2.png           # Ivysaur
        ├── 3.png           # Venusaur
        ├── ...
        ├── 151.png         # Mew
        └── placeholder.png # Fallback image
```

### File Naming Convention

| Field | Type | Description |
|-------|------|-------------|
| Filename | `{number}.png` | National dex number (1-151) |
| Format | PNG | PNG with transparency support |
| Resolution | 96x96 px | Standard PokeAPI sprite size |
| Max Size | <50KB | Optimized for web |

## Access Patterns

### Pattern 1: Direct URL Access

Static files are served by Next.js at predictable URLs:

```
/images/pokemon/{number}.png
```

**Examples**:
- Bulbasaur: `/images/pokemon/1.png`
- Pikachu: `/images/pokemon/25.png`
- Mew: `/images/pokemon/151.png`

### Pattern 2: Programmatic Path Construction

The `pokemonImages.js` helper provides functions to construct paths:

```javascript
// Input: Pokemon source data or dex number
// Output: Image URL path

getPokemonImagePath(25)        // Returns: '/images/pokemon/25.png'
getPokemonImagePath('pikachu') // Returns: '/images/pokemon/25.png' (via lookup)
getPlaceholderPath()           // Returns: '/images/pokemon/placeholder.png'
```

### Pattern 3: React Component Usage

The `PokemonSprite` component handles image display with fallback:

```jsx
<PokemonSprite pokemonId="bulbasaur" />
<PokemonSprite pokemonNumber={25} />
<PokemonSprite pokemonNumber={999} /> // Shows placeholder
```

## Relationship to Source Data

Images are linked to `Source/pokemon/pokemon.json` via the `number` field:

```json
// Source/pokemon/pokemon.json
{
  "id": "bulbasaur",
  "name": "Bulbasaur",
  "number": 1,        // Maps to /images/pokemon/1.png
  ...
}
```

This follows the constitution's Two-Tier Data Model principle:
- Source data (JSON) contains Pokemon reference information
- Image files are static assets referenced by the `number` field
- No image paths or data stored in the database

## Validation Rules

1. **File exists**: Each Pokemon (1-151) must have a corresponding PNG file
2. **Valid image**: File must be a valid PNG with non-zero content
3. **Size limit**: Individual files must be under 50KB
4. **Fallback**: `placeholder.png` must exist for error handling

## No Database Changes

This feature does not modify any database tables. Images are static assets only.
