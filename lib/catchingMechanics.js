/**
 * Catching Mechanics
 * Implements Pokemon 5e catching DC and Pokeball modifiers
 * T067-T074: Full catching mechanics implementation
 *
 * Feature: 017-5e-combat-research
 */

import { rollD20 } from './diceRoller.js';
import { hasStatus, StatusType } from './statusEffects.js';

/**
 * T067: Pokeball modifiers from Source/items/items.json
 * Negative values reduce DC (easier to catch)
 */
export const POKEBALL_MODIFIERS = {
  'poke-ball': { modifier: 0, condition: null, description: 'Standard Pokeball' },
  'great-ball': { modifier: -5, condition: null, description: 'Better catch rate' },
  'ultra-ball': { modifier: -10, condition: null, description: 'High-quality ball' },
  'master-ball': { modifier: 'auto', condition: null, description: 'Guaranteed catch' },
  'quick-ball': { modifier: -10, condition: 'first-turn', description: 'Best on turn 1' },
  'timer-ball': { modifier: 'timer', condition: null, description: 'Better over time' },
  'net-ball': { modifier: -10, condition: 'water-or-bug', description: 'Water/Bug types' },
  'dusk-ball': { modifier: -10, condition: 'night-or-cave', description: 'Night/cave bonus' },
  'heal-ball': { modifier: 0, condition: null, description: 'Heals on catch' },
  'luxury-ball': { modifier: 0, condition: null, description: 'Bonus to bond' },
  'premier-ball': { modifier: 0, condition: null, description: 'Special edition' },
  'dive-ball': { modifier: -10, condition: 'underwater', description: 'Underwater bonus' },
  'repeat-ball': { modifier: -10, condition: 'previously-caught', description: 'Caught species bonus' },
  'nest-ball': { modifier: 'nest', condition: null, description: 'Low-level bonus' }
};

/**
 * T068: Calculate base catch DC
 * DC = 10 + SR (rounded down) + Pokemon Level
 * @param {number} sr - Species Rating
 * @param {number} level - Pokemon level
 * @returns {number} Base DC
 */
export function calculateBaseDC(sr, level) {
  return 10 + Math.floor(sr || 0) + (level || 1);
}

/**
 * T069: Get HP modifier for catch DC
 * Per Pokemon 5e rules, lower HP makes catching easier
 * @param {number} currentHP - Current HP
 * @param {number} maxHP - Maximum HP
 * @returns {number} DC modifier (negative = easier)
 */
export function getHPModifier(currentHP, maxHP) {
  if (!maxHP || maxHP <= 0) return 0;

  const hpPercent = currentHP / maxHP;

  // Red zone (< 25%): -10
  if (hpPercent < 0.25) return -10;
  // Yellow zone (25-50%): -5
  if (hpPercent < 0.50) return -5;
  // Green zone (50-75%): -2
  if (hpPercent < 0.75) return -2;
  // Full HP: no modifier
  return 0;
}

/**
 * T070: Get status modifier for catch DC
 * Certain status conditions make catching easier
 * @param {Object} target - Target combatant
 * @returns {number} DC modifier (negative = easier)
 */
export function getStatusModifier(target) {
  if (!target || !target.status_effects) return 0;

  // Asleep or Frozen: -10
  if (hasStatus(target, StatusType.ASLEEP) || hasStatus(target, StatusType.FROZEN)) {
    return -10;
  }

  // Paralyzed, Burned, or Poisoned: -5
  if (hasStatus(target, StatusType.PARALYZED) ||
      hasStatus(target, StatusType.BURNED) ||
      hasStatus(target, StatusType.POISONED) ||
      hasStatus(target, StatusType.BADLY_POISONED)) {
    return -5;
  }

  return 0;
}

/**
 * T071: Get Pokeball modifier for catch DC
 * @param {string} pokeballId - Pokeball item ID
 * @param {Object} context - Battle context for conditional balls
 * @returns {{ modifier: number, isAuto: boolean, description: string }}
 */
export function getPokeballModifier(pokeballId, context = {}) {
  const ball = POKEBALL_MODIFIERS[pokeballId];
  if (!ball) return { modifier: 0, isAuto: false, description: 'Unknown ball' };

  // Master Ball: auto-success
  if (ball.modifier === 'auto') {
    return { modifier: -999, isAuto: true, description: ball.description };
  }

  // Timer Ball: -1 per turn (max -10)
  if (ball.modifier === 'timer') {
    const turnBonus = Math.min(10, (context.turnNumber || 1));
    return { modifier: -turnBonus, isAuto: false, description: `Timer Ball (-${turnBonus})` };
  }

  // Nest Ball: bonus based on target level (better for low-level)
  if (ball.modifier === 'nest') {
    const level = context.targetLevel || 1;
    const nestBonus = Math.max(0, 10 - level);
    return { modifier: -nestBonus, isAuto: false, description: `Nest Ball (-${nestBonus})` };
  }

  // Conditional balls
  if (ball.condition) {
    let conditionMet = false;

    switch (ball.condition) {
      case 'first-turn':
        conditionMet = (context.turnNumber || 1) === 1;
        break;
      case 'water-or-bug':
        conditionMet = (context.targetTypes || []).some(t =>
          ['water', 'bug'].includes(t.toLowerCase())
        );
        break;
      case 'night-or-cave':
        conditionMet = context.isNight || context.isCave;
        break;
      case 'underwater':
        conditionMet = context.isUnderwater;
        break;
      case 'previously-caught':
        conditionMet = context.previouslyCaught;
        break;
    }

    if (conditionMet) {
      return { modifier: ball.modifier, isAuto: false, description: ball.description };
    }
    return { modifier: 0, isAuto: false, description: `${ball.description} (condition not met)` };
  }

  return { modifier: ball.modifier, isAuto: false, description: ball.description };
}

/**
 * T072: Check if catch roll has advantage from status conditions
 * @param {Object} target - Target combatant
 * @returns {boolean} True if advantage applies
 */
export function hasAdvantageForCatch(target) {
  if (!target || !target.status_effects) return false;

  // Advantage from incapacitating conditions
  return hasStatus(target, StatusType.ASLEEP) ||
         hasStatus(target, StatusType.FROZEN) ||
         hasStatus(target, StatusType.PARALYZED);
}

/**
 * T073: Calculate final catch DC
 * @param {Object} target - Target combatant
 * @param {string} pokeballId - Pokeball being used
 * @param {Object} context - Battle context
 * @returns {Object} DC calculation breakdown
 */
export function calculateCatchDC(target, pokeballId, context = {}) {
  const baseDC = calculateBaseDC(target.sr, target.level);
  const hpMod = getHPModifier(target.current_hp, target.max_hp);
  const statusMod = getStatusModifier(target);

  const pokeballContext = {
    ...context,
    targetLevel: target.level,
    targetTypes: target.type || target.types || []
  };
  const pokeballResult = getPokeballModifier(pokeballId, pokeballContext);

  const finalDC = baseDC + hpMod + statusMod + pokeballResult.modifier;

  return {
    baseDC,
    hpModifier: hpMod,
    statusModifier: statusMod,
    pokeballModifier: pokeballResult.modifier,
    pokeballDescription: pokeballResult.description,
    isAutoSuccess: pokeballResult.isAuto,
    finalDC: pokeballResult.isAuto ? 0 : Math.max(1, finalDC)
  };
}

/**
 * T074: Attempt to catch a wild Pokemon
 * @param {Object} params - Catch attempt parameters
 * @param {Object} params.target - Target combatant
 * @param {string} params.pokeballId - Pokeball being used
 * @param {number} params.trainerAnimalHandling - Trainer's Animal Handling modifier
 * @param {Object} params.context - Battle context
 * @returns {Object} Catch attempt result
 */
export function attemptCatch({ target, pokeballId, trainerAnimalHandling = 0, context = {} }) {
  const dcCalc = calculateCatchDC(target, pokeballId, context);

  // Master Ball auto-success
  if (dcCalc.isAutoSuccess) {
    return {
      success: true,
      autoSuccess: true,
      pokeball: pokeballId,
      dcBreakdown: dcCalc,
      roll: null,
      total: null
    };
  }

  // Check for advantage
  const hasAdvantage = hasAdvantageForCatch(target);

  // Roll the catch check
  let roll;
  const rolls = [];

  if (hasAdvantage) {
    const roll1 = rollD20();
    const roll2 = rollD20();
    rolls.push(roll1, roll2);
    roll = Math.max(roll1, roll2);
  } else {
    roll = rollD20();
    rolls.push(roll);
  }

  const total = roll + trainerAnimalHandling;
  const success = total >= dcCalc.finalDC;

  return {
    success,
    autoSuccess: false,
    pokeball: pokeballId,
    dcBreakdown: dcCalc,
    finalDC: dcCalc.finalDC,
    roll,
    modifier: trainerAnimalHandling,
    total,
    hasAdvantage,
    rolls
  };
}
