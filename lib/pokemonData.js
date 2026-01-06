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
// Cache for loaded moves data
let movesCache = null;
// Cache for loaded abilities data
let abilitiesCache = null;

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
      sprite: `/images/pokemon/${p.number}.png`,
      artwork: `/images/pokemon/${p.number}.png`,
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
    // Use max_hp as fallback for current_hp (NULL = healthy, not 1 HP)
    const fallbackMaxHp = dbRecord.max_hp || 1;
    return {
      id: dbRecord.id,
      pokemon_id: dbRecord.pokemon_id,
      name: 'Unknown Pokemon',
      type: [],
      level: dbRecord.level,
      max_hp: fallbackMaxHp,
      current_hp: dbRecord.current_hp ?? fallbackMaxHp,
      is_active: dbRecord.is_active,
      slot_number: dbRecord.slot_number,
      sprite: '/images/pokemon/placeholder.png',
      artwork: '/images/pokemon/placeholder.png',
    };
  }

  // Use source Pokemon HP as authoritative max, default NULL current_hp to healthy
  const effectiveMaxHp = dbRecord.max_hp || sourcePokemon.hp || 20;
  return {
    id: dbRecord.id,
    pokemon_id: dbRecord.pokemon_id,
    name: sourcePokemon.name,
    type: sourcePokemon.type,
    level: dbRecord.level,
    max_hp: effectiveMaxHp,
    current_hp: dbRecord.current_hp ?? effectiveMaxHp,
    is_active: dbRecord.is_active,
    slot_number: dbRecord.slot_number,
    sprite: `/images/pokemon/${sourcePokemon.number}.png`,
    artwork: `/images/pokemon/${sourcePokemon.number}.png`,
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

/**
 * Load all moves from Source/moves/moves.json
 * @returns {Array} Array of all move objects
 */
export function getAllMoves() {
  if (movesCache) {
    return movesCache;
  }

  const filePath = path.join(process.cwd(), 'Source', 'moves', 'moves.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  movesCache = JSON.parse(fileContents);
  return movesCache;
}

/**
 * Get a single move by ID from Source data
 * @param {string} moveId - Move ID (e.g., "tackle", "vine-whip")
 * @returns {Object|null} Move object or null if not found
 */
export function getMoveById(moveId) {
  if (!moveId) return null;
  const allMoves = getAllMoves();
  return allMoves.find(m => m.id === moveId.toLowerCase()) || null;
}

/**
 * Get all moves available to a Pokemon at a given level
 * Includes start moves and all level-unlocked moves up to current level
 *
 * @param {string} pokemonId - Pokemon ID (e.g., "bulbasaur")
 * @param {number} level - Current Pokemon level
 * @returns {Array<Object>} Array of move objects with full Source data
 */
export function getMovesForPokemonAtLevel(pokemonId, level) {
  const pokemon = getPokemonById(pokemonId);
  if (!pokemon || !pokemon.moves) {
    return [];
  }

  const moveIds = new Set();

  // Add start moves
  if (pokemon.moves.start) {
    pokemon.moves.start.forEach(moveId => moveIds.add(moveId));
  }

  // Add level-based moves (level2, level6, level10, etc.)
  const levelKeys = Object.keys(pokemon.moves)
    .filter(key => key.startsWith('level'))
    .map(key => ({
      key,
      levelNum: parseInt(key.replace('level', ''), 10)
    }))
    .filter(item => !isNaN(item.levelNum) && item.levelNum <= level)
    .sort((a, b) => a.levelNum - b.levelNum);

  for (const { key } of levelKeys) {
    const movesAtLevel = pokemon.moves[key];
    if (Array.isArray(movesAtLevel)) {
      movesAtLevel.forEach(moveId => moveIds.add(moveId));
    }
  }

  // Convert move IDs to full move objects
  const moveObjects = [];
  for (const moveId of moveIds) {
    const move = getMoveById(moveId);
    if (move) {
      moveObjects.push(move);
    }
  }

  return moveObjects;
}

/**
 * Get move IDs available to a Pokemon at a given level
 * @param {string} pokemonId - Pokemon ID
 * @param {number} level - Current level
 * @returns {string[]} Array of move IDs
 */
export function getMoveIdsForPokemonAtLevel(pokemonId, level) {
  const moves = getMovesForPokemonAtLevel(pokemonId, level);
  return moves.map(m => m.id);
}

/**
 * Initialize move PP object for a set of selected moves
 * @param {string[]} selectedMoves - Array of move IDs
 * @returns {Object} Object mapping move ID to its PP value
 */
export function initializeMovePP(selectedMoves) {
  if (!selectedMoves || !Array.isArray(selectedMoves)) {
    return {};
  }

  const ppObject = {};
  for (const moveId of selectedMoves) {
    const move = getMoveById(moveId);
    if (move) {
      ppObject[moveId] = move.pp || 20; // Default to 20 if PP not specified
    }
  }
  return ppObject;
}

/**
 * Check if a move ID is valid (exists in Source data)
 * @param {string} moveId - Move ID to validate
 * @returns {boolean} True if valid
 */
export function isValidMoveId(moveId) {
  return getMoveById(moveId) !== null;
}

/**
 * Load all abilities from Source/abilities/abilities.json
 * @returns {Array} Array of all ability objects
 */
export function getAllAbilities() {
  if (abilitiesCache) {
    return abilitiesCache;
  }

  const filePath = path.join(process.cwd(), 'Source', 'abilities', 'abilities.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  abilitiesCache = JSON.parse(fileContents);
  return abilitiesCache;
}

/**
 * Get an ability by ID from Source data
 * @param {string} abilityId - Ability ID (e.g., "overgrow", "battle-armor")
 * @returns {Object|null} Ability object or null if not found
 */
export function getAbilityById(abilityId) {
  if (!abilityId) return null;
  const allAbilities = getAllAbilities();
  return allAbilities.find(a => a.id === abilityId.toLowerCase()) || null;
}

/**
 * Check if a Pokemon has the Battle Armor or Shell Armor ability
 * These abilities negate extra damage from critical hits
 * @param {string[]} abilityIds - Array of ability IDs the Pokemon has
 * @returns {boolean} True if Pokemon has Battle Armor or Shell Armor
 */
export function hasBattleArmorAbility(abilityIds) {
  if (!abilityIds || !Array.isArray(abilityIds)) {
    return false;
  }
  const armorAbilities = ['battle-armor', 'shell-armor'];
  return abilityIds.some(ability => {
    // Handle both string IDs and ability objects with id/name properties
    // Also handle null/undefined ability entries safely
    if (!ability) return false;
    const id = typeof ability === 'string' ? ability : (ability?.id || ability?.name || '');
    if (!id || typeof id !== 'string') return false;
    return armorAbilities.includes(id.toLowerCase());
  });
}
