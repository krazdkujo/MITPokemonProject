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
  getAttributeKey
};
