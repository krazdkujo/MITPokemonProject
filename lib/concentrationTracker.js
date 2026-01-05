/**
 * Concentration Tracker
 * Implements Pokemon 5e move concentration mechanics
 *
 * Feature: 017-5e-combat-research
 */

import { rollD20 } from './diceRoller.js';
import { getAttributeModifier } from './combatUtils.js';

/**
 * T030: Check if a move requires concentration
 * Moves with "concentration" in duration field require tracking
 * @param {Object} move - Move data from Source/moves
 * @returns {boolean} True if move requires concentration
 */
export function requiresConcentration(move) {
  if (!move) {
    return false;
  }

  // Check duration field for concentration keyword
  if (move.duration && typeof move.duration === 'string') {
    const durationLower = move.duration.toLowerCase();
    if (durationLower.includes('concentration')) {
      return true;
    }
  }

  // Check description as fallback
  if (move.description && typeof move.description === 'string') {
    const descLower = move.description.toLowerCase();
    if (descLower.includes('requires concentration') ||
        descLower.includes('concentration, up to') ||
        descLower.includes('while concentrating')) {
      return true;
    }
  }

  return false;
}

/**
 * T031: Check concentration save when taking damage
 * CON save DC = max(10, damage / 2)
 * @param {Object} pokemon - Pokemon with concentration
 * @param {number} damage - Damage taken
 * @param {Object} options - Additional options
 * @param {boolean} options.hasAdvantage - Whether Pokemon has advantage on save
 * @param {boolean} options.hasDisadvantage - Whether Pokemon has disadvantage on save
 * @returns {{ maintained: boolean, roll: number, dc: number, modifier: number, total: number, rolls: number[] }}
 */
export function checkConcentration(pokemon, damage, options = {}) {
  // CON save DC = max(10, damage / 2)
  const dc = Math.max(10, Math.floor(damage / 2));
  const conMod = getAttributeModifier(pokemon.attributes?.con || 10);

  let hasAdvantage = options.hasAdvantage || false;
  let hasDisadvantage = options.hasDisadvantage || false;

  // Roll with advantage/disadvantage
  let roll;
  const rolls = [];

  if (hasAdvantage && !hasDisadvantage) {
    const roll1 = rollD20();
    const roll2 = rollD20();
    rolls.push(roll1, roll2);
    roll = Math.max(roll1, roll2);
  } else if (hasDisadvantage && !hasAdvantage) {
    const roll1 = rollD20();
    const roll2 = rollD20();
    rolls.push(roll1, roll2);
    roll = Math.min(roll1, roll2);
  } else {
    roll = rollD20();
    rolls.push(roll);
  }

  const total = roll + conMod;

  return {
    maintained: total >= dc,
    roll,
    dc,
    modifier: conMod,
    total,
    rolls,
    hadAdvantage: hasAdvantage && !hasDisadvantage,
    hadDisadvantage: hasDisadvantage && !hasAdvantage
  };
}

/**
 * Start concentration on a move
 * @param {Object} combatant - Combatant starting concentration
 * @param {string} moveId - Move ID being concentrated on
 * @returns {Object} Updated combatant with concentration state
 */
export function startConcentration(combatant, moveId) {
  const updated = { ...combatant };

  // Break existing concentration if any
  if (updated.concentrating_on) {
    // Previous concentration ends automatically
  }

  updated.concentrating_on = moveId;
  return updated;
}

/**
 * Break concentration
 * @param {Object} combatant - Combatant losing concentration
 * @param {string} reason - Why concentration broke
 * @returns {Object} Updated combatant and status change info
 */
export function breakConcentration(combatant, reason) {
  if (!combatant.concentrating_on) {
    return {
      combatant,
      statusChange: null
    };
  }

  const updated = { ...combatant };
  const previousMove = updated.concentrating_on;
  updated.concentrating_on = null;

  return {
    combatant: updated,
    statusChange: {
      combatant_id: combatant.combatant_id,
      change: 'concentration_broken',
      move_id: previousMove,
      reason
    }
  };
}

/**
 * Check if a combatant is currently concentrating
 * @param {Object} combatant - Combatant to check
 * @returns {boolean} True if concentrating
 */
export function isConcentrating(combatant) {
  return combatant && combatant.concentrating_on !== null && combatant.concentrating_on !== undefined;
}

/**
 * Get the move a combatant is concentrating on
 * @param {Object} combatant - Combatant to check
 * @returns {string|null} Move ID or null
 */
export function getConcentratedMove(combatant) {
  return combatant?.concentrating_on || null;
}
