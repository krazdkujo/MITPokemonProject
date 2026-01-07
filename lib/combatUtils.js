/**
 * Combat Utilities
 * Core combat calculation functions for Pokemon 5e battle system
 *
 * Feature: 006-battle-api
 */

/**
 * Get proficiency bonus based on Pokemon level
 * Per Pokemon 5e rules:
 * L1-4: +2, L5-8: +3, L9-12: +4, L13-16: +5, L17-20: +6
 *
 * @param {number} level - Pokemon level (1-20)
 * @returns {number} Proficiency bonus
 */
function getProficiencyBonus(level) {
  if (level < 1) return 2;
  if (level <= 4) return 2;
  if (level <= 8) return 3;
  if (level <= 12) return 4;
  if (level <= 16) return 5;
  return 6; // Level 17-20
}

/**
 * Get attribute modifier from an attribute value
 * Standard D&D 5e formula: (attribute - 10) / 2, floored
 *
 * @param {number} attributeValue - The attribute score (e.g., STR 14)
 * @returns {number} The modifier (e.g., +2)
 */
function getAttributeModifier(attributeValue) {
  return Math.floor((attributeValue - 10) / 2);
}

/**
 * Get the best power modifier for a move based on available attributes
 * Moves specify which attributes can power them (e.g., ["str", "dex"])
 *
 * @param {string[]|string} powerAttributes - Array of attribute names or single attribute
 * @param {Object} attributes - Pokemon's attribute scores { str, dex, con, int, wis, cha }
 * @returns {number} The highest applicable modifier
 */
function getBestPowerModifier(powerAttributes, attributes) {
  if (!powerAttributes || powerAttributes === 'none') {
    return 0;
  }

  const attrArray = Array.isArray(powerAttributes) ? powerAttributes : [powerAttributes];

  let bestMod = -10; // Start very low
  for (const attr of attrArray) {
    const attrLower = attr.toLowerCase();
    if (attributes[attrLower] !== undefined) {
      const mod = getAttributeModifier(attributes[attrLower]);
      if (mod > bestMod) {
        bestMod = mod;
      }
    }
  }

  return bestMod > -10 ? bestMod : 0;
}

/**
 * Check if a move gets STAB (Same Type Attack Bonus)
 * STAB applies when the move type matches one of the Pokemon's types
 *
 * @param {string} moveType - The move's type
 * @param {string[]} pokemonTypes - Array of Pokemon's types
 * @returns {boolean} True if STAB applies
 */
function hasSTAB(moveType, pokemonTypes) {
  if (!moveType || !pokemonTypes || !Array.isArray(pokemonTypes)) {
    return false;
  }

  const normalizedMoveType = moveType.toLowerCase();
  return pokemonTypes.some(type => type.toLowerCase() === normalizedMoveType);
}

/**
 * Calculate the attack roll bonus
 * Attack Roll Bonus = Power Modifier + Proficiency Bonus
 *
 * @param {number} powerMod - The move's power modifier
 * @param {number} level - Pokemon level for proficiency
 * @returns {number} Total attack roll bonus
 */
function calculateAttackBonus(powerMod, level) {
  return powerMod + getProficiencyBonus(level);
}

/**
 * Calculate base damage bonus (before dice)
 * Damage Bonus = Power Modifier + STAB (if applicable)
 *
 * @param {number} powerMod - The move's power modifier
 * @param {boolean} stabApplies - Whether STAB applies
 * @param {number} level - Pokemon level for proficiency (STAB adds proficiency)
 * @returns {number} Total damage bonus
 */
function calculateDamageBonus(powerMod, stabApplies, level) {
  let bonus = powerMod;
  if (stabApplies) {
    bonus += getProficiencyBonus(level);
  }
  return bonus;
}

/**
 * T025: Parse save type from move description
 * Looks for patterns like "must make a DEX save" or "STR saving throw"
 * @param {string} description - Move description
 * @returns {string|null} Save type (STR, DEX, CON, INT, WIS, CHA) or null
 */
function parseSaveType(description) {
  if (!description) return null;

  // Pattern: "must make a/an [STAT] save" or "[STAT] saving throw"
  const patterns = [
    /must make (?:a |an |on a )?(\w+) sav(?:e|ing throw)/i,
    /(\w+) saving throw/i,
    /(\w+) save/i
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      const stat = match[1].toUpperCase();
      // Validate it's a real stat
      if (['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA',
           'STRENGTH', 'DEXTERITY', 'CONSTITUTION',
           'INTELLIGENCE', 'WISDOM', 'CHARISMA'].includes(stat)) {
        // Normalize to 3-letter abbreviation
        const abbreviations = {
          'STRENGTH': 'STR', 'DEXTERITY': 'DEX', 'CONSTITUTION': 'CON',
          'INTELLIGENCE': 'INT', 'WISDOM': 'WIS', 'CHARISMA': 'CHA'
        };
        return abbreviations[stat] || stat.substring(0, 3);
      }
    }
  }

  return null;
}

/**
 * T026: Calculate save DC for a move
 * DC = 8 + power modifier + proficiency bonus
 * @param {Object} attacker - Attacking Pokemon
 * @param {Object} move - Move being used
 * @returns {number} Save DC
 */
function calculateSaveDC(attacker, move) {
  const powerMod = getBestPowerModifier(move.power, attacker.attributes);
  const profBonus = getProficiencyBonus(attacker.level);
  return 8 + powerMod + profBonus;
}

/**
 * Check if a move uses a saving throw instead of attack roll
 * @param {Object} move - Move object
 * @returns {boolean} True if move uses saving throw
 */
function isSaveMove(move) {
  return parseSaveType(move.description) !== null;
}

/**
 * Get the attribute key for a stat abbreviation
 * @param {string} statAbbrev - 3-letter stat abbreviation (STR, DEX, etc.)
 * @returns {string} Lowercase attribute key (str, dex, etc.)
 */
function getAttributeKey(statAbbrev) {
  const mapping = {
    'STR': 'str', 'DEX': 'dex', 'CON': 'con',
    'INT': 'int', 'WIS': 'wis', 'CHA': 'cha'
  };
  return mapping[statAbbrev] || statAbbrev.toLowerCase();
}

/**
 * Feature 024 T035: Apply an AC modifier to a combatant
 * Adds to the combatant's ac_modifiers array with stacking rules
 *
 * @param {Object} combatant - Combatant to modify
 * @param {Object} modifier - { source, amount, expiresRound, stackable, maxStack }
 * @returns {{ applied: boolean, newAC: number, totalModifier: number }}
 */
function applyACModifier(combatant, modifier) {
  if (!combatant.ac_modifiers) {
    combatant.ac_modifiers = [];
  }

  // Check for existing modifier from same source
  const existing = combatant.ac_modifiers.find(m => m.source === modifier.source);

  if (existing) {
    if (modifier.stackable) {
      // Stackable: increment stack count
      existing.currentStack = (existing.currentStack || 1) + 1;
      if (modifier.maxStack && existing.currentStack > modifier.maxStack) {
        existing.currentStack = modifier.maxStack;
      }
    } else {
      // Not stackable: refresh duration only
      existing.expiresRound = modifier.expiresRound;
    }
  } else {
    // Add new modifier
    combatant.ac_modifiers.push({
      source: modifier.source,
      amount: modifier.amount,
      expiresRound: modifier.expiresRound,
      stackable: modifier.stackable || false,
      currentStack: 1
    });
  }

  const effectiveAC = getEffectiveAC(combatant);
  return {
    applied: true,
    newAC: effectiveAC,
    totalModifier: effectiveAC - (combatant.ac || 10)
  };
}

/**
 * Feature 024 T036: Apply a stat modifier to a combatant
 * Adds to the combatant's stat_modifiers array
 *
 * @param {Object} combatant - Combatant to modify
 * @param {Object} modifier - { source, stat, amount, expiresRound }
 * @returns {{ applied: boolean, newValue: number, totalModifier: number }}
 */
function applyStatModifier(combatant, modifier) {
  if (!combatant.stat_modifiers) {
    combatant.stat_modifiers = [];
  }

  // Check for existing modifier from same source for same stat
  const existing = combatant.stat_modifiers.find(
    m => m.source === modifier.source && m.stat === modifier.stat
  );

  if (existing) {
    // Refresh duration, don't stack same source
    existing.expiresRound = modifier.expiresRound;
    existing.amount = modifier.amount;
  } else {
    // Add new modifier
    combatant.stat_modifiers.push({
      source: modifier.source,
      stat: modifier.stat,
      amount: modifier.amount,
      expiresRound: modifier.expiresRound,
      stackCount: 1
    });
  }

  const effectiveValue = getEffectiveStat(combatant, modifier.stat);
  const baseValue = combatant.attributes?.[modifier.stat] || 10;
  return {
    applied: true,
    newValue: effectiveValue,
    totalModifier: effectiveValue - baseValue
  };
}

/**
 * Feature 024 T037: Get effective AC including all modifiers
 * Base AC + sum of all active AC modifiers
 *
 * @param {Object} combatant - Combatant to check
 * @returns {number} Effective AC
 */
function getEffectiveAC(combatant) {
  const baseAC = combatant.ac || 10;

  if (!combatant.ac_modifiers || combatant.ac_modifiers.length === 0) {
    return baseAC;
  }

  let totalModifier = 0;
  for (const mod of combatant.ac_modifiers) {
    const stacks = mod.currentStack || 1;
    totalModifier += mod.amount * stacks;
  }

  return Math.max(0, baseAC + totalModifier);
}

/**
 * Feature 024 T038: Get effective stat value including all modifiers
 * Base stat + sum of all active modifiers for that stat
 *
 * @param {Object} combatant - Combatant to check
 * @param {string} stat - Stat abbreviation (str, dex, con, int, wis, cha)
 * @returns {number} Effective stat value
 */
function getEffectiveStat(combatant, stat) {
  const statKey = stat.toLowerCase();
  const baseValue = combatant.attributes?.[statKey] || 10;

  if (!combatant.stat_modifiers || combatant.stat_modifiers.length === 0) {
    return baseValue;
  }

  let totalModifier = 0;
  for (const mod of combatant.stat_modifiers) {
    if (mod.stat === statKey) {
      const stacks = mod.stackCount || 1;
      totalModifier += mod.amount * stacks;
    }
  }

  // Stats can't go below 1
  return Math.max(1, baseValue + totalModifier);
}

/**
 * Feature 024 T049: Apply a speed modifier to a combatant
 * Adds to the combatant's speed_modifiers array
 *
 * @param {Object} combatant - Combatant to modify
 * @param {Object} modifier - { source, type, amount, expiresRound }
 * @returns {{ applied: boolean, newSpeed: number, totalModifier: number }}
 */
function applySpeedModifier(combatant, modifier) {
  if (!combatant.speed_modifiers) {
    combatant.speed_modifiers = [];
  }

  // Check for existing modifier from same source
  const existing = combatant.speed_modifiers.find(m => m.source === modifier.source);

  if (existing) {
    // Refresh duration
    existing.expiresRound = modifier.expiresRound;
    existing.amount = modifier.amount;
    existing.type = modifier.type;
  } else {
    // Add new modifier
    combatant.speed_modifiers.push({
      source: modifier.source,
      type: modifier.type, // 'flat', 'halve', 'double', 'zero'
      amount: modifier.amount,
      expiresRound: modifier.expiresRound
    });
  }

  const baseSpeed = combatant.walking_speed || 30;
  const effectiveSpeed = getEffectiveSpeed(combatant);
  return {
    applied: true,
    newSpeed: effectiveSpeed,
    totalModifier: effectiveSpeed - baseSpeed
  };
}

/**
 * Feature 024 T050: Get effective speed including all modifiers
 * Base speed + flat modifiers, then apply multipliers
 *
 * @param {Object} combatant - Combatant to check
 * @returns {number} Effective speed in feet
 */
function getEffectiveSpeed(combatant) {
  const baseSpeed = combatant.walking_speed || 30;

  if (!combatant.speed_modifiers || combatant.speed_modifiers.length === 0) {
    return baseSpeed;
  }

  let speed = baseSpeed;
  let isZero = false;
  let isHalved = false;
  let isDoubled = false;

  // Apply modifiers in order: flat, then multipliers
  for (const mod of combatant.speed_modifiers) {
    switch (mod.type) {
      case 'flat':
        speed += mod.amount;
        break;
      case 'halve':
        isHalved = true;
        break;
      case 'double':
        isDoubled = true;
        break;
      case 'zero':
        isZero = true;
        break;
    }
  }

  // Zero overrides everything
  if (isZero) return 0;

  // Apply multipliers (halve and double can cancel out)
  if (isHalved && !isDoubled) {
    speed = Math.floor(speed / 2);
  } else if (isDoubled && !isHalved) {
    speed = speed * 2;
  }

  return Math.max(0, speed);
}

/**
 * Feature 024 T061: Parse action type from move time field
 *
 * @param {string} time - Move time field (e.g., "1 action", "1 bonus action", "1 reaction")
 * @returns {'action'|'bonus_action'|'reaction'|'free'} Action type
 */
function parseActionType(time) {
  if (!time) return 'action';

  const timeLower = time.toLowerCase();

  if (timeLower.includes('bonus')) {
    return 'bonus_action';
  }
  if (timeLower.includes('reaction')) {
    return 'reaction';
  }
  if (timeLower.includes('free') || timeLower.includes('no action')) {
    return 'free';
  }

  return 'action';
}

/**
 * Feature 024 T062: Check if combatant can use a move
 * Verifies action availability and move restrictions
 *
 * @param {Object} combatant - Combatant attempting to use move
 * @param {Object} move - Move to check
 * @returns {{ canUse: boolean, reason: string|null }}
 */
function canUseMove(combatant, move) {
  const actionType = parseActionType(move.time);

  switch (actionType) {
    case 'action':
      if (!combatant.has_action) {
        return { canUse: false, reason: 'no_action_available' };
      }
      break;
    case 'bonus_action':
      if (!combatant.has_bonus_action) {
        return { canUse: false, reason: 'no_bonus_action_available' };
      }
      break;
    case 'reaction':
      if (!combatant.has_reaction) {
        return { canUse: false, reason: 'no_reaction_available' };
      }
      break;
    case 'free':
      // Always available
      break;
  }

  return { canUse: true, reason: null };
}

/**
 * Feature 024 T063: Consume an action from combatant
 *
 * @param {Object} combatant - Combatant using action
 * @param {'action'|'bonus_action'|'reaction'|'free'} actionType - Type of action
 */
function consumeAction(combatant, actionType) {
  switch (actionType) {
    case 'action':
      combatant.has_action = false;
      break;
    case 'bonus_action':
      combatant.has_bonus_action = false;
      break;
    case 'reaction':
      combatant.has_reaction = false;
      break;
    case 'free':
      // Free actions don't consume anything
      break;
  }
}

/**
 * Feature 024 T064: Reset turn actions for a combatant
 * Called at the start of each turn
 *
 * @param {Object} combatant - Combatant starting turn
 */
function resetTurnActions(combatant) {
  combatant.has_action = true;
  combatant.has_bonus_action = true;
  // Reaction refreshes at start of YOUR turn
  combatant.has_reaction = true;
}

module.exports = {
  getProficiencyBonus,
  getAttributeModifier,
  getBestPowerModifier,
  hasSTAB,
  calculateAttackBonus,
  calculateDamageBonus,
  // T025-T026: Saving throw functions
  parseSaveType,
  calculateSaveDC,
  isSaveMove,
  getAttributeKey,
  // Feature 024 T035-T038: Stat and AC modifiers
  applyACModifier,
  applyStatModifier,
  getEffectiveAC,
  getEffectiveStat,
  // Feature 024 T049-T050, T061-T064: Speed and action economy
  applySpeedModifier,
  getEffectiveSpeed,
  parseActionType,
  canUseMove,
  consumeAction,
  resetTurnActions
};
