/**
 * Weather System
 * Implements Pokemon 5e weather effects for combat
 * T045-T050: Full weather system implementation
 *
 * Feature: 017-5e-combat-research
 */

import { getProficiencyBonus } from './combatUtils.js';
import { rollDice } from './diceRoller.js';

/**
 * Weather type constants
 */
export const WeatherType = {
  HARSH_SUNLIGHT: 'harsh-sunlight',
  RAIN: 'rain',
  SANDSTORM: 'sandstorm',
  HAIL: 'hail',
  SNOW: 'snow',
  FOG: 'fog'
};

/**
 * T045: Weather effects configuration
 * Per Source/rules/rules.json weather-table
 */
export const WEATHER_EFFECTS = {
  [WeatherType.HARSH_SUNLIGHT]: {
    description: 'Bright, hot sunlight covers the area',
    moveAdvantage: ['fire'],
    moveDisadvantage: ['water'],
    acBonus: { types: ['fire'], bonus: 1 },
    visibility: 'clear',
    endOfTurnDamage: null
  },
  [WeatherType.RAIN]: {
    description: 'Heavy rain falls across the battlefield',
    moveAdvantage: ['water', 'electric'],
    moveDisadvantage: ['fire'],
    acBonus: { types: ['water', 'electric'], bonus: 1 },
    visibility: 'lightly-obscured',
    endOfTurnDamage: null
  },
  [WeatherType.SANDSTORM]: {
    description: 'Sand and dust swirl violently',
    moveAdvantage: ['rock', 'ground'],
    moveDisadvantage: [],
    acBonus: { types: ['rock', 'ground', 'steel'], bonus: 1 },
    visibility: 'heavily-obscured',
    endOfTurnDamage: {
      affectedTypes: 'not-immune', // All except rock/ground/steel
      immuneTypes: ['rock', 'ground', 'steel'],
      damageFormula: 'proficiency'
    }
  },
  [WeatherType.HAIL]: {
    description: 'Sharp hailstones batter the area',
    moveAdvantage: ['ice'],
    moveDisadvantage: [],
    acBonus: { types: ['ice'], bonus: 1 },
    visibility: 'lightly-obscured',
    endOfTurnDamage: {
      affectedTypes: 'not-immune',
      immuneTypes: ['ice'],
      damageFormula: 'proficiency'
    }
  },
  [WeatherType.SNOW]: {
    description: 'Snow blankets the battlefield',
    moveAdvantage: ['ice'],
    moveDisadvantage: ['fire'],
    acBonus: { types: ['ice'], bonus: 1 },
    visibility: 'lightly-obscured',
    endOfTurnDamage: null
  },
  [WeatherType.FOG]: {
    description: 'Thick fog limits visibility',
    moveAdvantage: [],
    moveDisadvantage: [],
    acBonus: { types: [], bonus: 0 },
    visibility: 'heavily-obscured',
    endOfTurnDamage: null
  }
};

/**
 * T046: Get damage modifier for weather and move type
 * @param {string} weatherType - Current weather type
 * @param {string} moveType - Type of move being used
 * @returns {{ advantage: boolean, disadvantage: boolean }}
 */
export function getWeatherDamageModifier(weatherType, moveType) {
  if (!weatherType || !moveType) {
    return { advantage: false, disadvantage: false };
  }

  const effects = WEATHER_EFFECTS[weatherType];
  if (!effects) {
    return { advantage: false, disadvantage: false };
  }

  const moveTypeLower = moveType.toLowerCase();
  const advantage = effects.moveAdvantage.includes(moveTypeLower);
  const disadvantage = effects.moveDisadvantage.includes(moveTypeLower);

  return { advantage, disadvantage };
}

/**
 * T047: Get AC bonus from weather for Pokemon types
 * @param {string} weatherType - Current weather type
 * @param {string[]} pokemonTypes - Pokemon's types
 * @returns {number} AC bonus (0, 1, or higher)
 */
export function getWeatherACBonus(weatherType, pokemonTypes) {
  if (!weatherType || !pokemonTypes || !Array.isArray(pokemonTypes)) {
    return 0;
  }

  const effects = WEATHER_EFFECTS[weatherType];
  if (!effects || !effects.acBonus) {
    return 0;
  }

  const typesLower = pokemonTypes.map(t => t.toLowerCase());
  const bonusTypes = effects.acBonus.types;

  if (bonusTypes.some(bt => typesLower.includes(bt))) {
    return effects.acBonus.bonus;
  }

  return 0;
}

/**
 * T048: Get visibility level for weather
 * @param {string} weatherType - Current weather type
 * @returns {'clear' | 'lightly-obscured' | 'heavily-obscured'}
 */
export function getWeatherVisibility(weatherType) {
  if (!weatherType) {
    return 'clear';
  }

  const effects = WEATHER_EFFECTS[weatherType];
  return effects?.visibility || 'clear';
}

/**
 * T049: Calculate end-of-turn weather damage
 * @param {Object} combatant - Combatant taking weather damage
 * @param {string} weatherType - Current weather type
 * @returns {{ damage: number, immune: boolean, reason: string|null }}
 */
export function calculateWeatherDamage(combatant, weatherType) {
  if (!weatherType) {
    return { damage: 0, immune: false, reason: null };
  }

  const effects = WEATHER_EFFECTS[weatherType];
  if (!effects || !effects.endOfTurnDamage) {
    return { damage: 0, immune: false, reason: null };
  }

  const damageConfig = effects.endOfTurnDamage;
  const combatantTypes = (combatant.type || combatant.types || []).map(t => t.toLowerCase());

  // Check immunity
  if (damageConfig.immuneTypes.some(it => combatantTypes.includes(it))) {
    return { damage: 0, immune: true, reason: 'type_immunity' };
  }

  // Calculate damage based on formula
  let damage = 0;
  if (damageConfig.damageFormula === 'proficiency') {
    damage = getProficiencyBonus(combatant.level || 1);
  }

  return { damage, immune: false, reason: null };
}

/**
 * T050: Process end-of-turn weather effects for all combatants
 * @param {Array<Object>} combatants - All combatants in battle
 * @param {string} weatherType - Current weather type
 * @returns {Array<Object>} Array of weather damage results
 */
export function processWeatherEndOfTurn(combatants, weatherType) {
  if (!weatherType || !combatants || combatants.length === 0) {
    return [];
  }

  const results = [];

  for (const combatant of combatants) {
    if (combatant.current_hp <= 0) continue;

    const damageResult = calculateWeatherDamage(combatant, weatherType);

    if (damageResult.damage > 0) {
      const hpBefore = combatant.current_hp;
      combatant.current_hp = Math.max(0, combatant.current_hp - damageResult.damage);

      results.push({
        combatant_id: combatant.combatant_id,
        name: combatant.name,
        weather_type: weatherType,
        damage: damageResult.damage,
        hp_before: hpBefore,
        hp_after: combatant.current_hp,
        fainted: combatant.current_hp <= 0
      });
    } else if (damageResult.immune) {
      results.push({
        combatant_id: combatant.combatant_id,
        name: combatant.name,
        weather_type: weatherType,
        damage: 0,
        immune: true,
        reason: damageResult.reason
      });
    }
  }

  return results;
}

/**
 * Create a new weather state object
 * @param {string} type - Weather type
 * @param {number|null} turnsRemaining - Duration (null = indefinite)
 * @param {'environment'|'move'} source - What caused the weather
 * @returns {Object} Weather state object
 */
export function createWeatherState(type, turnsRemaining = null, source = 'environment') {
  return {
    type,
    turns_remaining: turnsRemaining,
    source
  };
}

/**
 * Check if weather should end and return new weather state
 * @param {Object} weatherState - Current weather state
 * @returns {{ ended: boolean, newState: Object|null }}
 */
export function tickWeatherDuration(weatherState) {
  if (!weatherState || weatherState.turns_remaining === null) {
    return { ended: false, newState: weatherState };
  }

  const newTurns = weatherState.turns_remaining - 1;
  if (newTurns <= 0) {
    return { ended: true, newState: null };
  }

  return {
    ended: false,
    newState: {
      ...weatherState,
      turns_remaining: newTurns
    }
  };
}
