/**
 * Type Effectiveness Utility
 * Implements Pokemon type chart for damage multiplier calculations
 *
 * Feature: 006-battle-api
 */

// Standard 18-type Pokemon type chart
// For each attacking type, lists which types it's super effective against,
// not very effective against, and has no effect on
const TYPE_CHART = {
  normal: {
    superEffective: [],
    notVeryEffective: ['rock', 'steel'],
    noEffect: ['ghost']
  },
  fire: {
    superEffective: ['grass', 'ice', 'bug', 'steel'],
    notVeryEffective: ['fire', 'water', 'rock', 'dragon'],
    noEffect: []
  },
  water: {
    superEffective: ['fire', 'ground', 'rock'],
    notVeryEffective: ['water', 'grass', 'dragon'],
    noEffect: []
  },
  electric: {
    superEffective: ['water', 'flying'],
    notVeryEffective: ['electric', 'grass', 'dragon'],
    noEffect: ['ground']
  },
  grass: {
    superEffective: ['water', 'ground', 'rock'],
    notVeryEffective: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'],
    noEffect: []
  },
  ice: {
    superEffective: ['grass', 'ground', 'flying', 'dragon'],
    notVeryEffective: ['fire', 'water', 'ice', 'steel'],
    noEffect: []
  },
  fighting: {
    superEffective: ['normal', 'ice', 'rock', 'dark', 'steel'],
    notVeryEffective: ['poison', 'flying', 'psychic', 'bug', 'fairy'],
    noEffect: ['ghost']
  },
  poison: {
    superEffective: ['grass', 'fairy'],
    notVeryEffective: ['poison', 'ground', 'rock', 'ghost'],
    noEffect: ['steel']
  },
  ground: {
    superEffective: ['fire', 'electric', 'poison', 'rock', 'steel'],
    notVeryEffective: ['grass', 'bug'],
    noEffect: ['flying']
  },
  flying: {
    superEffective: ['grass', 'fighting', 'bug'],
    notVeryEffective: ['electric', 'rock', 'steel'],
    noEffect: []
  },
  psychic: {
    superEffective: ['fighting', 'poison'],
    notVeryEffective: ['psychic', 'steel'],
    noEffect: ['dark']
  },
  bug: {
    superEffective: ['grass', 'psychic', 'dark'],
    notVeryEffective: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'],
    noEffect: []
  },
  rock: {
    superEffective: ['fire', 'ice', 'flying', 'bug'],
    notVeryEffective: ['fighting', 'ground', 'steel'],
    noEffect: []
  },
  ghost: {
    superEffective: ['psychic', 'ghost'],
    notVeryEffective: ['dark'],
    noEffect: ['normal']
  },
  dragon: {
    superEffective: ['dragon'],
    notVeryEffective: ['steel'],
    noEffect: ['fairy']
  },
  dark: {
    superEffective: ['psychic', 'ghost'],
    notVeryEffective: ['fighting', 'dark', 'fairy'],
    noEffect: []
  },
  steel: {
    superEffective: ['ice', 'rock', 'fairy'],
    notVeryEffective: ['fire', 'water', 'electric', 'steel'],
    noEffect: []
  },
  fairy: {
    superEffective: ['fighting', 'dragon', 'dark'],
    notVeryEffective: ['fire', 'poison', 'steel'],
    noEffect: []
  }
};

/**
 * Calculate the effectiveness multiplier for an attack type against defender types
 *
 * @param {string} attackType - The type of the attacking move (lowercase)
 * @param {string[]} defenderTypes - Array of defender's types (lowercase)
 * @returns {{ multiplier: number, effectiveness: string }} Multiplier and effectiveness label
 */
function getEffectiveness(attackType, defenderTypes) {
  const normalizedAttackType = attackType.toLowerCase();
  const chart = TYPE_CHART[normalizedAttackType];

  if (!chart) {
    // Unknown type, return neutral
    return { multiplier: 1, effectiveness: 'normal' };
  }

  let multiplier = 1;

  for (const defenderType of defenderTypes) {
    const normalizedDefenderType = defenderType.toLowerCase();

    if (chart.noEffect.includes(normalizedDefenderType)) {
      // Immunity - return immediately
      return { multiplier: 0, effectiveness: 'immune' };
    }

    if (chart.superEffective.includes(normalizedDefenderType)) {
      multiplier *= 2;
    }

    if (chart.notVeryEffective.includes(normalizedDefenderType)) {
      multiplier *= 0.5;
    }
  }

  // Determine effectiveness label
  let effectiveness;
  if (multiplier === 0) {
    effectiveness = 'immune';
  } else if (multiplier > 1) {
    effectiveness = 'super_effective';
  } else if (multiplier < 1) {
    effectiveness = 'not_effective';
  } else {
    effectiveness = 'normal';
  }

  return { multiplier, effectiveness };
}

/**
 * Get all types in the type chart
 * @returns {string[]} Array of all type names
 */
function getAllTypes() {
  return Object.keys(TYPE_CHART);
}

module.exports = {
  getEffectiveness,
  getAllTypes,
  TYPE_CHART
};
