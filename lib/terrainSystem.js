/**
 * Terrain System
 * Implements Pokemon 5e terrain effects for combat
 * T052-T059: Full terrain system implementation
 *
 * Feature: 017-5e-combat-research
 */

import { getProficiencyBonus } from './combatUtils.js';

/**
 * Terrain type constants
 */
export const TerrainType = {
  ELECTRIC: 'electric',
  GRASSY: 'grassy',
  MISTY: 'misty',
  PSYCHIC: 'psychic'
};

/**
 * T052: Terrain effects configuration
 * Per Source/rules/rules.json terrain-table
 */
export const TERRAIN_EFFECTS = {
  [TerrainType.ELECTRIC]: {
    description: 'Electricity crackles across the ground',
    boostedMoveTypes: ['electric'],
    statusImmunity: ['ASLEEP'], // Cannot fall asleep
    endOfTurnHealing: false,
    endOfTurnDamage: false
  },
  [TerrainType.GRASSY]: {
    description: 'Lush grass covers the battlefield',
    boostedMoveTypes: ['grass'],
    statusImmunity: [],
    endOfTurnHealing: true, // Heals proficiency bonus at end of turn
    endOfTurnDamage: false
  },
  [TerrainType.MISTY]: {
    description: 'Magical mist swirls across the ground',
    boostedMoveTypes: ['fairy'],
    statusImmunity: ['BURNED', 'POISONED', 'BADLY_POISONED', 'PARALYZED', 'ASLEEP', 'FROZEN', 'CONFUSED'],
    endOfTurnHealing: false,
    endOfTurnDamage: false
  },
  [TerrainType.PSYCHIC]: {
    description: 'Psychic energy emanates from the ground',
    boostedMoveTypes: ['psychic'],
    statusImmunity: [],
    endOfTurnHealing: false,
    endOfTurnDamage: false
    // Note: Psychic Terrain also blocks priority moves from hitting grounded Pokemon
  }
};

/**
 * T053: Get damage bonus for terrain and move type
 * Terrain doubles the MOVE modifier for matching types
 * @param {string} terrainType - Current terrain type
 * @param {string} moveType - Type of move being used
 * @returns {boolean} True if MOVE modifier should be doubled
 */
export function getTerrainDamageBonus(terrainType, moveType) {
  if (!terrainType || !moveType) {
    return false;
  }

  const effects = TERRAIN_EFFECTS[terrainType];
  if (!effects || !effects.boostedMoveTypes) {
    return false;
  }

  return effects.boostedMoveTypes.includes(moveType.toLowerCase());
}

/**
 * T054: Get status immunity from terrain
 * @param {string} terrainType - Current terrain type
 * @returns {string[]} Array of status types that are blocked
 */
export function getTerrainStatusImmunity(terrainType) {
  if (!terrainType) {
    return [];
  }

  const effects = TERRAIN_EFFECTS[terrainType];
  return effects?.statusImmunity || [];
}

/**
 * T055: Get end-of-turn healing from terrain
 * @param {string} terrainType - Current terrain type
 * @param {number} level - Pokemon's level for proficiency calculation
 * @returns {number} HP to heal (0 if none)
 */
export function getTerrainHealing(terrainType, level) {
  if (!terrainType) {
    return 0;
  }

  const effects = TERRAIN_EFFECTS[terrainType];
  if (!effects || !effects.endOfTurnHealing) {
    return 0;
  }

  // Grassy Terrain heals proficiency bonus at end of turn
  return getProficiencyBonus(level || 1);
}

/**
 * T056: Check if a combatant is grounded (affected by terrain)
 * Flying types and Levitate ability are not grounded
 * @param {Object} combatant - Combatant to check
 * @returns {boolean} True if grounded
 */
export function isGrounded(combatant) {
  if (!combatant) {
    return true;
  }

  // Check for Flying type
  const types = combatant.type || combatant.types || [];
  const typesLower = types.map(t => t.toLowerCase());
  if (typesLower.includes('flying')) {
    return false;
  }

  // Check for Levitate ability
  const abilities = combatant.abilities || [];
  const abilitiesLower = abilities.map(a => (typeof a === 'string' ? a : a.id || '').toLowerCase());
  if (abilitiesLower.includes('levitate')) {
    return false;
  }

  // Check single ability_id
  if (combatant.ability_id && combatant.ability_id.toLowerCase() === 'levitate') {
    return false;
  }

  return true;
}

/**
 * T057-T058: Process end-of-turn terrain effects for all combatants
 * @param {Array<Object>} combatants - All combatants in battle
 * @param {string} terrainType - Current terrain type
 * @returns {Array<Object>} Array of terrain effect results
 */
export function processTerrainEndOfTurn(combatants, terrainType) {
  if (!terrainType || !combatants || combatants.length === 0) {
    return [];
  }

  const results = [];

  for (const combatant of combatants) {
    if (combatant.current_hp <= 0) continue;

    // Only grounded combatants are affected by terrain
    if (!isGrounded(combatant)) {
      continue;
    }

    // Check for healing
    const healing = getTerrainHealing(terrainType, combatant.level);
    if (healing > 0) {
      const hpBefore = combatant.current_hp;
      const maxHp = combatant.max_hp || combatant.hp || 100;
      combatant.current_hp = Math.min(maxHp, combatant.current_hp + healing);

      results.push({
        combatant_id: combatant.combatant_id,
        name: combatant.name,
        terrain_type: terrainType,
        effect: 'healing',
        amount: combatant.current_hp - hpBefore,
        hp_before: hpBefore,
        hp_after: combatant.current_hp
      });
    }
  }

  return results;
}

/**
 * T059: Check if a status can be applied considering terrain immunity
 * @param {Object} combatant - Combatant receiving status
 * @param {string} statusType - Type of status being applied
 * @param {string} terrainType - Current terrain type
 * @returns {{ blocked: boolean, reason: string|null }}
 */
export function checkTerrainStatusImmunity(combatant, statusType, terrainType) {
  if (!terrainType) {
    return { blocked: false, reason: null };
  }

  // Only grounded combatants get terrain immunity
  if (!isGrounded(combatant)) {
    return { blocked: false, reason: null };
  }

  const immuneStatuses = getTerrainStatusImmunity(terrainType);
  if (immuneStatuses.includes(statusType)) {
    return { blocked: true, reason: `terrain_immunity_${terrainType}` };
  }

  return { blocked: false, reason: null };
}

/**
 * Create a new terrain state object
 * @param {string} type - Terrain type
 * @param {number} turnsRemaining - Duration in turns
 * @param {Array<{col: number, row: number}>} affectedCells - Grid cells with terrain
 * @returns {Object} Terrain state object
 */
export function createTerrainState(type, turnsRemaining = 5, affectedCells = []) {
  return {
    type,
    turns_remaining: turnsRemaining,
    affected_cells: affectedCells
  };
}

/**
 * Check if terrain should end and return new terrain state
 * @param {Object} terrainState - Current terrain state
 * @returns {{ ended: boolean, newState: Object|null }}
 */
export function tickTerrainDuration(terrainState) {
  if (!terrainState || terrainState.turns_remaining === null) {
    return { ended: false, newState: terrainState };
  }

  const newTurns = terrainState.turns_remaining - 1;
  if (newTurns <= 0) {
    return { ended: true, newState: null };
  }

  return {
    ended: false,
    newState: {
      ...terrainState,
      turns_remaining: newTurns
    }
  };
}
