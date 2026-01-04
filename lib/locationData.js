/**
 * Location Data Utilities
 *
 * Provides functions to load location data from Source files
 * and helper functions for encounter generation.
 *
 * Feature: 014-wild-encounter
 */

import fs from 'fs';
import path from 'path';

// Cache for loaded location data
let locationsCache = null;

/**
 * Load all locations from Source/locations.json
 * @returns {Array} Array of all location objects
 */
export function getAllLocations() {
  if (locationsCache) {
    return locationsCache;
  }

  const filePath = path.join(process.cwd(), 'Source', 'locations.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(fileContents);
  locationsCache = data.locations;
  return locationsCache;
}

/**
 * Get a single location by ID from Source data
 * @param {string} id - Location ID (e.g., "route-1")
 * @returns {Object|null} Location object or null if not found
 */
export function getLocationById(id) {
  const allLocations = getAllLocations();
  return allLocations.find(loc => loc.id === id) || null;
}

/**
 * Select a random Pokemon from location's pool based on weights
 * Higher weight = higher probability of being selected
 *
 * @param {Object} location - Location object with pokemon array
 * @returns {string} Pokemon ID
 */
export function selectRandomPokemon(location) {
  if (!location || !location.pokemon || location.pokemon.length === 0) {
    return null;
  }

  const totalWeight = location.pokemon.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;

  for (const entry of location.pokemon) {
    random -= entry.weight;
    if (random <= 0) {
      return entry.id;
    }
  }

  // Fallback to first Pokemon
  return location.pokemon[0].id;
}

/**
 * Generate a random level within location's level range (inclusive)
 *
 * @param {Object} location - Location object with levelRange
 * @returns {number} Level (integer)
 */
export function generateEncounterLevel(location) {
  if (!location || !location.levelRange) {
    return 1;
  }

  const { min, max } = location.levelRange;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Validate that a location ID exists in Source data
 * @param {string} locationId - Location ID to validate
 * @returns {boolean} True if valid
 */
export function isValidLocationId(locationId) {
  return getLocationById(locationId) !== null;
}
