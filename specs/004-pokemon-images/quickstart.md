# Quickstart: Pokemon Images Download

**Feature**: 004-pokemon-images
**Date**: 2026-01-03

## What This Feature Does

Downloads all 151 Generation 1 Pokemon sprite images from PokeAPI and stores them locally in the project. This enables offline access and faster load times by eliminating runtime API calls for images.

## Quick Usage

### Display a Pokemon Image in React

```jsx
import PokemonSprite from '../components/PokemonSprite';

// Using Pokemon ID (from Source data)
<PokemonSprite pokemonId="pikachu" />

// Using national dex number
<PokemonSprite pokemonNumber={25} />

// With custom size
<PokemonSprite pokemonId="bulbasaur" size={128} />
```

### Get Image Path Programmatically

```javascript
import { getPokemonImagePath, getPlaceholderPath } from '../lib/pokemonImages';

// By dex number
const pikachuPath = getPokemonImagePath(25);
// Returns: '/images/pokemon/25.png'

// By Pokemon ID
const bulbasaurPath = getPokemonImagePath('bulbasaur');
// Returns: '/images/pokemon/1.png'

// Fallback for missing images
const fallback = getPlaceholderPath();
// Returns: '/images/pokemon/placeholder.png'
```

### Direct URL Access

Images are served at:
```
/images/pokemon/{dex_number}.png
```

Examples:
- Bulbasaur: `/images/pokemon/1.png`
- Pikachu: `/images/pokemon/25.png`
- Mew: `/images/pokemon/151.png`

## Setup (One-Time)

### Download All Pokemon Images

Run the download script from the project root:

```bash
node scripts/download-pokemon-images.js
```

This downloads all 151 sprites to `public/images/pokemon/`.

### Verify Installation

Check that images were downloaded:

```bash
ls public/images/pokemon/ | wc -l
# Should output: 152 (151 Pokemon + 1 placeholder)
```

## File Locations

| Path | Description |
|------|-------------|
| `public/images/pokemon/` | Pokemon sprite images (1.png - 151.png) |
| `public/images/pokemon/placeholder.png` | Fallback for missing images |
| `lib/pokemonImages.js` | Helper functions for image paths |
| `components/PokemonSprite.js` | React component for displaying sprites |
| `scripts/download-pokemon-images.js` | One-time download script |

## Integration with Source Data

The `number` field in `Source/pokemon/pokemon.json` maps to image filenames:

```json
{
  "id": "bulbasaur",
  "name": "Bulbasaur",
  "number": 1  // -> /images/pokemon/1.png
}
```

## Error Handling

The `PokemonSprite` component automatically shows a placeholder when:
- The requested Pokemon number doesn't exist
- The image file is missing or corrupted
- The network request fails (shouldn't happen with local files)

## Testing

View all Pokemon sprites in a grid:

```bash
npm run dev
# Navigate to /test-sprites (if test page is created)
```
