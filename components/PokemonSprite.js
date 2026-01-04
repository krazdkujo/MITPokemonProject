/**
 * PokemonSprite Component
 *
 * Displays a Pokemon sprite image with consistent sizing and fallback support.
 * Supports both Pokemon ID strings and national dex numbers.
 */

import { useState } from 'react';
import { getPokemonImagePath, getPlaceholderPath, getDexNumber } from '../lib/pokemonImages';

/**
 * PokemonSprite - Displays a Pokemon sprite with error handling
 *
 * @param {Object} props
 * @param {string} [props.pokemonId] - Pokemon ID (e.g., "bulbasaur")
 * @param {number} [props.pokemonNumber] - National dex number (e.g., 25)
 * @param {number} [props.size=96] - Width and height in pixels
 * @param {string} [props.alt] - Alt text (defaults to Pokemon name/number)
 * @param {string} [props.className] - Additional CSS classes
 * @param {Object} [props.style] - Additional inline styles
 */
export default function PokemonSprite({
  pokemonId,
  pokemonNumber,
  size = 96,
  alt,
  className = '',
  style = {},
}) {
  const [hasError, setHasError] = useState(false);

  // Determine the identifier to use
  let identifier = pokemonNumber;
  if (!identifier && pokemonId) {
    identifier = pokemonId;
  }

  // Get the image path
  const imagePath = hasError
    ? getPlaceholderPath()
    : identifier
      ? getPokemonImagePath(identifier)
      : getPlaceholderPath();

  // Determine alt text
  let altText = alt;
  if (!altText) {
    if (pokemonNumber) {
      altText = `Pokemon #${pokemonNumber}`;
    } else if (pokemonId) {
      // Capitalize first letter
      altText = pokemonId.charAt(0).toUpperCase() + pokemonId.slice(1);
    } else {
      altText = 'Pokemon';
    }
  }

  // Handle image load error
  const handleError = () => {
    if (!hasError) {
      setHasError(true);
    }
  };

  return (
    <img
      src={imagePath}
      alt={altText}
      width={size}
      height={size}
      className={`pokemon-sprite ${className}`.trim()}
      style={{
        objectFit: 'contain',
        imageRendering: 'pixelated',
        ...style,
      }}
      onError={handleError}
    />
  );
}
