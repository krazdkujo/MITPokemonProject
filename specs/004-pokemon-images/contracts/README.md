# Contracts: Pokemon Images Download

**Feature**: 004-pokemon-images

## No API Contracts

This feature does not introduce new API endpoints. Pokemon images are served as static files directly by Next.js from the `public/` directory.

## Static File URLs

Images are accessed via direct HTTP requests:

```
GET /images/pokemon/{number}.png
```

### Response

- **200 OK**: Returns PNG image file
- **404 Not Found**: Image file does not exist

### Example

```
GET /images/pokemon/25.png
Content-Type: image/png
```

## Helper Module Interface

While not an API, the `lib/pokemonImages.js` module exports:

```javascript
/**
 * Get the URL path for a Pokemon sprite image
 * @param {number|string} identifier - Dex number or Pokemon ID
 * @returns {string} URL path to the image
 */
export function getPokemonImagePath(identifier)

/**
 * Get the URL path for the placeholder image
 * @returns {string} URL path to placeholder
 */
export function getPlaceholderPath()

/**
 * Check if a Pokemon image exists (for server-side use)
 * @param {number} dexNumber - National dex number
 * @returns {boolean} Whether the image file exists
 */
export function pokemonImageExists(dexNumber)
```

## React Component Props

The `PokemonSprite` component interface:

```typescript
interface PokemonSpriteProps {
  // Provide one of these identifiers
  pokemonId?: string;     // e.g., "bulbasaur"
  pokemonNumber?: number; // e.g., 25

  // Optional styling
  size?: number;          // Width/height in pixels (default: 96)
  alt?: string;           // Alt text (default: Pokemon name)
  className?: string;     // Additional CSS classes
}
```
