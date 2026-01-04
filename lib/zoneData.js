/**
 * Zone Data Utilities
 *
 * Provides functions to load zone data and generate encounter pools
 * for zone-based Pokemon encounters.
 *
 * Feature: 016-zone-encounters
 */

import fs from 'fs';
import path from 'path';
import { getAllPokemon } from './pokemonData.js';

// Cache for loaded zone data
let zoneCache = null;

/**
 * Load zone data from Source/zones.json
 * @returns {Object} Zone configuration object
 */
function loadZoneData() {
  if (zoneCache) {
    return zoneCache;
  }

  const filePath = path.join(process.cwd(), 'Source', 'zones.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  zoneCache = JSON.parse(fileContents);
  return zoneCache;
}

/**
 * Get all zones
 * @returns {Array} Array of all zone objects
 */
export function getAllZones() {
  const data = loadZoneData();
  return data.zones || [];
}

/**
 * Get a single zone by ID
 * @param {string} zoneId - Zone ID (e.g., "water-pond")
 * @returns {Object|null} Zone object or null if not found
 */
export function getZoneById(zoneId) {
  const zones = getAllZones();
  return zones.find(z => z.id === zoneId) || null;
}

/**
 * Get terrain groups mapping
 * @returns {Object} Object mapping terrain type to array of zone IDs
 */
export function getTerrainGroups() {
  const data = loadZoneData();
  return data.terrainGroups || {};
}

/**
 * Get difficulty label mappings
 * @returns {Object} Object mapping difficulty key to display label
 */
export function getDifficultyLabels() {
  const data = loadZoneData();
  return data.difficultyLabels || {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    expert: 'Expert'
  };
}

/**
 * Get difficulty label for a zone
 * @param {string} difficulty - Difficulty key (easy, medium, hard, expert)
 * @returns {string} Display label
 */
export function getDifficultyLabel(difficulty) {
  const labels = getDifficultyLabels();
  return labels[difficulty] || difficulty;
}

/**
 * Get all zones grouped by terrain type with display info
 * @returns {Object} Object with zones array and terrainGroups
 */
export function getZonesWithGroups() {
  const zones = getAllZones();
  const terrainGroups = getTerrainGroups();
  const labels = getDifficultyLabels();

  const enrichedZones = zones.map(zone => ({
    ...zone,
    difficultyLabel: labels[zone.difficulty] || zone.difficulty
  }));

  return {
    zones: enrichedZones,
    terrainGroups
  };
}

/**
 * Get encounter pool for a zone
 * Filters all Pokemon by the zone's types and SR range
 * @param {string} zoneId - Zone ID
 * @returns {Array} Array of Pokemon that can be encountered in this zone
 */
export function getEncounterPool(zoneId) {
  const zone = getZoneById(zoneId);
  if (!zone) {
    return [];
  }

  const allPokemon = getAllPokemon();
  const zoneTypes = zone.types.map(t => t.toLowerCase());
  const { min: minSR, max: maxSR } = zone.srRange;

  return allPokemon.filter(pokemon => {
    // Check type match - Pokemon must have at least one type matching zone types
    const pokemonTypes = (pokemon.type || []).map(t => t.toLowerCase());
    const typeMatch = zoneTypes.some(zt => pokemonTypes.includes(zt));
    if (!typeMatch) return false;

    // Check SR range
    const pokemonSR = pokemon.sr ?? 0;
    const srMatch = pokemonSR >= minSR && pokemonSR <= maxSR;
    return srMatch;
  });
}

/**
 * Get encounter pool count for a zone
 * @param {string} zoneId - Zone ID
 * @returns {number} Number of Pokemon in the encounter pool
 */
export function getEncounterPoolCount(zoneId) {
  return getEncounterPool(zoneId).length;
}

/**
 * Get a sample of Pokemon from the encounter pool
 * @param {string} zoneId - Zone ID
 * @param {number} sampleSize - Number of Pokemon to sample (default 3)
 * @returns {Array} Sample of Pokemon with minimal display info
 */
export function getEncounterPoolSample(zoneId, sampleSize = 3) {
  const pool = getEncounterPool(zoneId);

  // Shuffle and take sample
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const sample = shuffled.slice(0, sampleSize);

  return sample.map(p => ({
    id: p.id,
    name: p.name,
    number: p.number,
    sr: p.sr
  }));
}

/**
 * Select a random Pokemon from a zone's encounter pool
 * @param {string} zoneId - Zone ID
 * @returns {Object|null} Full Pokemon object or null if pool is empty
 */
export function selectRandomPokemonFromZone(zoneId) {
  const pool = getEncounterPool(zoneId);
  if (pool.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

/**
 * Check if a zone ID is valid
 * @param {string} zoneId - Zone ID to validate
 * @returns {boolean} True if valid
 */
export function isValidZoneId(zoneId) {
  return getZoneById(zoneId) !== null;
}

/**
 * Get zones by difficulty
 * @param {string} difficulty - Difficulty tier (easy, medium, hard, expert)
 * @returns {Array} Array of zones matching the difficulty
 */
export function getZonesByDifficulty(difficulty) {
  const zones = getAllZones();
  return zones.filter(z => z.difficulty === difficulty);
}

/**
 * Get zones by terrain type
 * @param {string} terrain - Terrain type (water, fire, grass, etc.)
 * @returns {Array} Array of zones matching the terrain
 */
export function getZonesByTerrain(terrain) {
  const zones = getAllZones();
  return zones.filter(z => z.terrain === terrain);
}

/**
 * Clear the zone cache (useful for testing)
 */
export function clearZoneCache() {
  zoneCache = null;
}
