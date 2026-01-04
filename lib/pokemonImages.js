/**
 * Pokemon Image Utilities
 *
 * Provides functions to construct image paths for Pokemon sprites,
 * supporting both national dex numbers and Pokemon IDs.
 */

import fs from 'fs';
import path from 'path';
import { getAllPokemon } from './pokemonData.js';

// Base path for Pokemon images (relative URL)
const IMAGE_BASE_PATH = '/images/pokemon';

// Cache for ID to number mapping
let idToNumberCache = null;

/**
 * Build the ID to dex number mapping from Source data
 * @returns {Map} Map of pokemon_id to dex number
 */
function getIdToNumberMap() {
  if (idToNumberCache) {
    return idToNumberCache;
  }

  const allPokemon = getAllPokemon();
  idToNumberCache = new Map();

  for (const pokemon of allPokemon) {
    if (pokemon.id && pokemon.number) {
      idToNumberCache.set(pokemon.id.toLowerCase(), pokemon.number);
    }
  }

  return idToNumberCache;
}

/**
 * Get the URL path for a Pokemon sprite image
 *
 * @param {number|string} identifier - National dex number (1-151) or Pokemon ID ("bulbasaur")
 * @returns {string} URL path to the image (e.g., '/images/pokemon/25.png')
 */
export function getPokemonImagePath(identifier) {
  // If it's a number, use it directly
  if (typeof identifier === 'number') {
    return `${IMAGE_BASE_PATH}/${identifier}.png`;
  }

  // If it's a string that looks like a number, parse and use it
  if (typeof identifier === 'string' && /^\d+$/.test(identifier)) {
    return `${IMAGE_BASE_PATH}/${parseInt(identifier, 10)}.png`;
  }

  // Otherwise, look up the ID in Source data
  if (typeof identifier === 'string') {
    const idToNumber = getIdToNumberMap();
    const dexNumber = idToNumber.get(identifier.toLowerCase());

    if (dexNumber) {
      return `${IMAGE_BASE_PATH}/${dexNumber}.png`;
    }
  }

  // Fallback to placeholder if not found
  return getPlaceholderPath();
}

/**
 * Get the URL path for the placeholder image
 *
 * @returns {string} URL path to placeholder image
 */
export function getPlaceholderPath() {
  return `${IMAGE_BASE_PATH}/placeholder.png`;
}

/**
 * Check if a Pokemon image exists on disk (server-side only)
 *
 * @param {number} dexNumber - National dex number (1-151)
 * @returns {boolean} Whether the image file exists
 */
export function pokemonImageExists(dexNumber) {
  // This function only works server-side
  if (typeof window !== 'undefined') {
    console.warn('pokemonImageExists() is only available server-side');
    return false;
  }

  try {
    const imagePath = path.join(process.cwd(), 'public', 'images', 'pokemon', `${dexNumber}.png`);
    return fs.existsSync(imagePath);
  } catch {
    return false;
  }
}

/**
 * Get the dex number for a Pokemon ID
 *
 * @param {string} pokemonId - Pokemon ID (e.g., "bulbasaur")
 * @returns {number|null} Dex number or null if not found
 */
export function getDexNumber(pokemonId) {
  if (typeof pokemonId !== 'string') {
    return null;
  }

  const idToNumber = getIdToNumberMap();
  return idToNumber.get(pokemonId.toLowerCase()) || null;
}
