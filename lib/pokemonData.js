/**
 * Pokemon Data Utilities
 *
 * Provides functions to load and merge Pokemon data from Source files
 * with database records, following the Two-Tier Data Model principle.
 */

import fs from 'fs';
import path from 'path';

// Cache for loaded Pokemon data
let pokemonCache = null;

/**
 * Load all Pokemon from Source/pokemon/pokemon.json
 * @returns {Array} Array of all Pokemon objects
 */
export function getAllPokemon() {
  if (pokemonCache) {
    return pokemonCache;
  }

  const filePath = path.join(process.cwd(), 'Source', 'pokemon', 'pokemon.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  pokemonCache = JSON.parse(fileContents);
  return pokemonCache;
}

/**
 * Get a single Pokemon by ID from Source data
 * @param {string} id - Pokemon ID (e.g., "bulbasaur")
 * @returns {Object|null} Pokemon object or null if not found
 */
export function getPokemonById(id) {
  const allPokemon = getAllPokemon();
  return allPokemon.find(p => p.id === id) || null;
}

/**
 * Get all starter-eligible Pokemon (SR <= 0.5)
 * @returns {Array} Array of starter Pokemon with display fields
 */
export function getStarterPokemon() {
  const allPokemon = getAllPokemon();
  return allPokemon
    .filter(p => p.sr <= 0.5)
    .map(p => ({
      id: p.id,
      name: p.name,
      number: p.number,
      type: p.type,
      sr: p.sr,
      sprite: p.media?.sprite || null,
      artwork: p.media?.main || null,
    }));
}

/**
 * Get all unique types from starter Pokemon
 * @returns {Array} Sorted array of type strings
 */
export function getStarterTypes() {
  const starters = getStarterPokemon();
  const types = new Set();
  starters.forEach(p => {
    p.type.forEach(t => types.add(t));
  });
  return Array.from(types).sort();
}

/**
 * Filter starter Pokemon by type(s) using AND logic
 * Pokemon is included if it has ALL of the selected types
 * @param {string[]} types - Array of type strings to filter by (max 2)
 * @returns {Array} Filtered starter Pokemon
 */
export function filterStartersByType(types) {
  if (!types || types.length === 0) {
    return getStarterPokemon();
  }

  const starters = getStarterPokemon();
  const selectedTypesLower = types.map(t => t.toLowerCase());

  // AND logic: Pokemon matches if it has ALL of the selected types
  return starters.filter(pokemon => {
    if (!pokemon.type || !Array.isArray(pokemon.type)) {
      return false;
    }
    const pokemonTypesLower = pokemon.type.map(t => t.toLowerCase());

    // Check that every selected type exists in this Pokemon's types
    return selectedTypesLower.every(selectedType =>
      pokemonTypesLower.includes(selectedType)
    );
  });
}

/**
 * Merge a database player_pokemon record with Source data
 * @param {Object} dbRecord - Database record with pokemon_id, level, is_active, etc.
 * @returns {Object} Merged object with Source data included
 */
export function buildPlayerPokemonResponse(dbRecord) {
  const sourcePokemon = getPokemonById(dbRecord.pokemon_id);

  if (!sourcePokemon) {
    // Return minimal data if source Pokemon not found
    return {
      id: dbRecord.id,
      pokemon_id: dbRecord.pokemon_id,
      name: 'Unknown Pokemon',
      type: [],
      level: dbRecord.level,
      is_active: dbRecord.is_active,
      slot_number: dbRecord.slot_number,
      sprite: null,
    };
  }

  return {
    id: dbRecord.id,
    pokemon_id: dbRecord.pokemon_id,
    name: sourcePokemon.name,
    type: sourcePokemon.type,
    level: dbRecord.level,
    is_active: dbRecord.is_active,
    slot_number: dbRecord.slot_number,
    sprite: sourcePokemon.media?.sprite || null,
    artwork: sourcePokemon.media?.main || null,
  };
}

/**
 * Build response for multiple player Pokemon records
 * @param {Array} dbRecords - Array of database records
 * @returns {Array} Array of merged Pokemon objects
 */
export function buildPlayerPokemonListResponse(dbRecords) {
  return dbRecords.map(record => buildPlayerPokemonResponse(record));
}

/**
 * Validate that a pokemon_id exists in Source data
 * @param {string} pokemonId - Pokemon ID to validate
 * @returns {boolean} True if valid
 */
export function isValidPokemonId(pokemonId) {
  return getPokemonById(pokemonId) !== null;
}

/**
 * Check if a Pokemon is eligible as a starter (SR <= 0.5)
 * @param {string} pokemonId - Pokemon ID to check
 * @returns {boolean} True if starter-eligible
 */
export function isStarterEligible(pokemonId) {
  const pokemon = getPokemonById(pokemonId);
  return pokemon !== null && pokemon.sr <= 0.5;
}
