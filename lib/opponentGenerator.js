/**
 * Opponent Generator
 * Generates wild Pokemon opponents from Source data
 *
 * Feature: 006-battle-api
 */

import { getAllPokemon, getPokemonById, getMovesForPokemonAtLevel } from './pokemonData.js';
import { getAttributeModifier } from './combatUtils.js';
import { getAverageDiceRoll, parseDiceExpression } from './diceParser.js';

/**
 * Generate a wild Pokemon opponent
 *
 * @param {number} playerLevel - Player's Pokemon level (for level matching)
 * @param {string} specificPokemonId - Optional specific Pokemon ID to use
 * @param {number} specificLevel - Optional specific level to use
 * @returns {Object} Generated opponent Pokemon with full battle data
 */
export function generateWildPokemon(playerLevel, specificPokemonId = null, specificLevel = null) {
  // T045: Select Pokemon
  let sourcePokemon;

  if (specificPokemonId) {
    sourcePokemon = getPokemonById(specificPokemonId);
    if (!sourcePokemon) {
      throw new Error(`Pokemon not found: ${specificPokemonId}`);
    }
  } else {
    // Filter Pokemon by SR <= 5 for wild encounters
    const allPokemon = getAllPokemon();
    const eligiblePokemon = allPokemon.filter(p => p.sr <= 5);

    if (eligiblePokemon.length === 0) {
      throw new Error('No eligible Pokemon for wild encounter');
    }

    // Random selection
    const randomIndex = Math.floor(Math.random() * eligiblePokemon.length);
    sourcePokemon = eligiblePokemon[randomIndex];
  }

  // T046: Calculate level
  let level;
  if (specificLevel) {
    level = Math.max(1, Math.min(20, specificLevel));
  } else {
    // Random level within +/- 2 of player level
    const minLevel = Math.max(1, playerLevel - 2);
    const maxLevel = Math.min(20, playerLevel + 2);
    level = minLevel + Math.floor(Math.random() * (maxLevel - minLevel + 1));
  }

  // T047: Calculate HP
  const hp = calculateOpponentHP(sourcePokemon, level);

  // T048: Get available moves for this level
  const moves = getMovesForPokemonAtLevel(sourcePokemon.id, level);

  // Limit to 4 moves (like player Pokemon)
  const selectedMoves = moves.slice(0, 4);

  // T049: Build opponent object
  const opponent = {
    pokemon_id: sourcePokemon.id,
    name: sourcePokemon.name,
    type: sourcePokemon.type,
    level: level,
    sr: sourcePokemon.sr,
    current_hp: hp,
    max_hp: hp,
    ac: sourcePokemon.ac,
    attributes: sourcePokemon.attributes,
    moves: selectedMoves
  };

  return opponent;
}

/**
 * Calculate HP for an opponent at a given level
 * Formula: base_hp + (level * hitDie average) + (CON mod * level)
 *
 * @param {Object} sourcePokemon - Pokemon data from Source
 * @param {number} level - Pokemon level
 * @returns {number} Calculated HP
 */
export function calculateOpponentHP(sourcePokemon, level) {
  const baseHP = sourcePokemon.hp || 10;
  const hitDice = sourcePokemon.hitDice || 'd6';

  // Get hit die average
  const hitDieAverage = getHitDieAverage(hitDice);

  // Get CON modifier
  const conMod = getAttributeModifier(sourcePokemon.attributes?.con || 10);

  // Calculate HP: base + (level * hitDie avg) + (CON mod * level)
  // For level 1, just use base HP
  if (level === 1) {
    return baseHP;
  }

  // For higher levels, add HP per level
  const additionalHP = (level - 1) * (hitDieAverage + conMod);
  return Math.max(1, baseHP + additionalHP);
}

/**
 * Get the average roll for a hit die
 *
 * @param {string} hitDice - Hit die notation (e.g., "d6", "d8")
 * @returns {number} Average value
 */
function getHitDieAverage(hitDice) {
  const match = hitDice.match(/d(\d+)/i);
  if (!match) return 4; // Default to d6 average

  const sides = parseInt(match[1], 10);
  return Math.floor((1 + sides) / 2);
}

/**
 * Generate multiple wild Pokemon for an encounter
 *
 * @param {number} playerLevel - Player's Pokemon level
 * @param {number} count - Number of opponents to generate
 * @returns {Object[]} Array of generated opponents
 */
export function generateWildEncounter(playerLevel, count = 1) {
  const opponents = [];
  for (let i = 0; i < count; i++) {
    opponents.push(generateWildPokemon(playerLevel));
  }
  return opponents;
}
