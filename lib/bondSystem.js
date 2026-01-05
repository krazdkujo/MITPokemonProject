/**
 * Bond System
 * Implements Pokemon 5e bond levels and Bond Points
 * T060-T066: Full bond system implementation
 *
 * Feature: 017-5e-combat-research
 */

import { rollD20 } from './diceRoller.js';

/**
 * T060: Bond level effects configuration
 * Per Source/rules/rules.json bonds-* rules
 */
export const BOND_EFFECTS = {
  3: {
    bondPoints: 3,
    description: 'Incredible bond - maximum trust and synergy',
    obedienceCheck: null,
    battleModifier: null
  },
  2: {
    bondPoints: 2,
    description: 'Great trust - strong connection',
    obedienceCheck: null,
    battleModifier: null
  },
  1: {
    bondPoints: 1,
    description: 'Content, fond of trainer',
    obedienceCheck: null,
    battleModifier: null
  },
  0: {
    bondPoints: 0,
    description: 'Neutral, responds to commands',
    obedienceCheck: null,
    battleModifier: null
  },
  '-1': {
    bondPoints: 0,
    description: 'Upset, small grudge affects battle',
    obedienceCheck: null,
    battleModifier: 'small-grudge' // Disadvantage on first attack each battle
  },
  '-2': {
    bondPoints: 0,
    description: 'May disobey with disadvantage',
    obedienceCheck: { dc: 10, onFail: 'disadvantage' },
    battleModifier: null
  },
  '-3': {
    bondPoints: 0,
    description: 'May completely disobey',
    obedienceCheck: { dc: 10, onFail: 'disobey' },
    battleModifier: null
  }
};

/**
 * T061: Check if a Pokemon obeys a command based on bond level
 * @param {number} bondLevel - Bond level (-3 to +3)
 * @param {number} chaMod - Trainer's Charisma modifier
 * @returns {{ obeys: boolean, withDisadvantage: boolean, roll: number|null, dc: number|null }}
 */
export function checkObedience(bondLevel, chaMod = 0) {
  const effects = BOND_EFFECTS[bondLevel.toString()] || BOND_EFFECTS[bondLevel];

  if (!effects || !effects.obedienceCheck) {
    return { obeys: true, withDisadvantage: false, roll: null, dc: null };
  }

  const dc = effects.obedienceCheck.dc;
  const roll = rollD20();
  const total = roll + chaMod;
  const passed = total >= dc;

  if (!passed) {
    if (effects.obedienceCheck.onFail === 'disobey') {
      return { obeys: false, withDisadvantage: false, roll, dc, total };
    } else if (effects.obedienceCheck.onFail === 'disadvantage') {
      return { obeys: true, withDisadvantage: true, roll, dc, total };
    }
  }

  return { obeys: true, withDisadvantage: false, roll, dc, total };
}

/**
 * T062: Spend a Bond Point for advantage or to impose disadvantage
 * @param {Object} combatant - Combatant spending the point
 * @param {'advantage'|'impose_disadvantage'} effect - Effect to apply
 * @returns {{ success: boolean, pointsRemaining: number, effect: string|null }}
 */
export function spendBondPoint(combatant, effect) {
  const currentPoints = combatant.bond_points_remaining || 0;

  if (currentPoints <= 0) {
    return {
      success: false,
      pointsRemaining: 0,
      effect: null,
      reason: 'no_points_remaining'
    };
  }

  if (effect !== 'advantage' && effect !== 'impose_disadvantage') {
    return {
      success: false,
      pointsRemaining: currentPoints,
      effect: null,
      reason: 'invalid_effect'
    };
  }

  // Spend the point
  combatant.bond_points_remaining = currentPoints - 1;

  return {
    success: true,
    pointsRemaining: combatant.bond_points_remaining,
    effect
  };
}

/**
 * T063: Restore Bond Points on long rest
 * @param {Object} combatant - Combatant to restore
 * @returns {{ pointsRestored: number, newTotal: number }}
 */
export function restoreBondPoints(combatant) {
  const bondLevel = combatant.bond_level || 0;
  const maxPoints = getBondPoints(bondLevel);
  const currentPoints = combatant.bond_points_remaining || 0;

  combatant.bond_points_remaining = maxPoints;

  return {
    pointsRestored: maxPoints - currentPoints,
    newTotal: maxPoints
  };
}

/**
 * Get the number of Bond Points for a bond level
 * @param {number} bondLevel - Bond level (-3 to +3)
 * @returns {number} Number of Bond Points
 */
export function getBondPoints(bondLevel) {
  if (bondLevel >= 3) return 3;
  if (bondLevel >= 2) return 2;
  if (bondLevel >= 1) return 1;
  return 0;
}

/**
 * T064: Get battle modifier for negative bond levels
 * @param {number} bondLevel - Bond level
 * @returns {{ hasSmallGrudge: boolean, description: string|null }}
 */
export function getBondBattleModifier(bondLevel) {
  const effects = BOND_EFFECTS[bondLevel.toString()] || BOND_EFFECTS[bondLevel];

  if (!effects || !effects.battleModifier) {
    return { hasSmallGrudge: false, description: null };
  }

  if (effects.battleModifier === 'small-grudge') {
    return {
      hasSmallGrudge: true,
      description: 'Disadvantage on first attack each battle'
    };
  }

  return { hasSmallGrudge: false, description: null };
}

/**
 * T065: Initialize bond state for a combatant entering battle
 * @param {Object} combatant - Combatant entering battle
 * @returns {Object} Updated combatant with bond state
 */
export function initializeBondState(combatant) {
  const bondLevel = combatant.bond_level || 0;
  const bondPoints = getBondPoints(bondLevel);
  const modifier = getBondBattleModifier(bondLevel);

  return {
    ...combatant,
    bond_level: bondLevel,
    bond_points_remaining: combatant.bond_points_remaining !== undefined
      ? combatant.bond_points_remaining
      : bondPoints,
    has_small_grudge: modifier.hasSmallGrudge,
    grudge_attack_used: false
  };
}

/**
 * T066: Check and consume grudge disadvantage on first attack
 * @param {Object} combatant - Combatant attacking
 * @returns {{ hasDisadvantage: boolean, consumed: boolean }}
 */
export function checkGrudgeDisadvantage(combatant) {
  if (!combatant.has_small_grudge || combatant.grudge_attack_used) {
    return { hasDisadvantage: false, consumed: false };
  }

  // Consume the grudge disadvantage on first attack
  combatant.grudge_attack_used = true;

  return { hasDisadvantage: true, consumed: true };
}
