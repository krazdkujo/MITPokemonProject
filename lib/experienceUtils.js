/**
 * Experience Utilities
 * XP calculation and level-up detection for Pokemon 5e
 *
 * Feature: 006-battle-api
 */

/**
 * XP thresholds for each level (1-20)
 * From Pokemon 5e rules
 */
export const XP_THRESHOLDS = {
  1: 0,
  2: 200,
  3: 800,
  4: 2000,
  5: 6000,
  6: 12000,
  7: 20000,
  8: 30000,
  9: 44000,
  10: 62000,
  11: 82000,
  12: 104000,
  13: 128000,
  14: 158000,
  15: 194000,
  16: 234000,
  17: 278000,
  18: 326000,
  19: 382000,
  20: 450000
};

/**
 * Calculate XP award for defeating or catching an opponent
 * Formula: 200 x Opponent Level x Opponent SR
 * Catch bonus: XP / 5
 *
 * @param {number} opponentLevel - Opponent's level
 * @param {number} opponentSR - Opponent's Species Rating
 * @param {boolean} wasCaught - True if Pokemon was caught (applies 1/5 multiplier)
 * @returns {number} XP to award
 */
export function calculateXpAward(opponentLevel, opponentSR, wasCaught = false) {
  // Ensure minimum values
  const level = Math.max(1, opponentLevel || 1);
  const sr = Math.max(0.25, opponentSR || 0.5); // Minimum SR of 0.25

  const baseXp = Math.floor(200 * level * sr);

  // T045: Apply catch multiplier (1/5) if Pokemon was caught
  if (wasCaught) {
    return Math.floor(baseXp / 5);
  }

  return baseXp;
}

/**
 * Calculate currency award for defeating an opponent
 * Formula: Opponent Level x 100
 *
 * @param {number} opponentLevel - Opponent's level
 * @returns {number} Currency to award
 */
export function calculateCurrencyAward(opponentLevel) {
  const level = Math.max(1, opponentLevel || 1);
  return level * 100;
}

/**
 * Get the XP threshold for a specific level
 *
 * @param {number} level - Target level
 * @returns {number} XP required to reach that level
 */
export function getXpThreshold(level) {
  if (level < 1) return 0;
  if (level > 20) return XP_THRESHOLDS[20];
  return XP_THRESHOLDS[level];
}

/**
 * Check if a level-up threshold has been crossed
 *
 * @param {number} currentXp - XP before battle
 * @param {number} newXp - XP after battle
 * @param {number} currentLevel - Current level (1-20)
 * @returns {boolean} True if level-up threshold crossed
 */
export function checkLevelUp(currentXp, newXp, currentLevel) {
  if (currentLevel >= 20) {
    return false; // Already max level
  }

  const nextLevelThreshold = getXpThreshold(currentLevel + 1);
  return newXp >= nextLevelThreshold && currentXp < nextLevelThreshold;
}

/**
 * Calculate what level a Pokemon should be based on total XP
 *
 * @param {number} totalXp - Total experience points
 * @returns {number} The level (1-20)
 */
export function calculateLevelFromXp(totalXp) {
  let level = 1;

  for (let lvl = 20; lvl >= 1; lvl--) {
    if (totalXp >= XP_THRESHOLDS[lvl]) {
      level = lvl;
      break;
    }
  }

  return level;
}

/**
 * Get XP progress to next level
 *
 * @param {number} totalXp - Current total XP
 * @param {number} currentLevel - Current level
 * @returns {{ current: number, required: number, percentage: number }}
 */
export function getXpProgress(totalXp, currentLevel) {
  if (currentLevel >= 20) {
    return {
      current: 0,
      required: 0,
      percentage: 100
    };
  }

  const currentThreshold = XP_THRESHOLDS[currentLevel];
  const nextThreshold = XP_THRESHOLDS[currentLevel + 1];

  const xpIntoLevel = totalXp - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;

  return {
    current: xpIntoLevel,
    required: xpNeeded,
    percentage: Math.floor((xpIntoLevel / xpNeeded) * 100)
  };
}

/**
 * Calculate all battle rewards for victory or catch
 *
 * @param {Object} opponent - Opponent Pokemon with level and sr
 * @param {boolean} wasCaught - True if Pokemon was caught
 * @param {string[]} participatingPokemonIds - Array of Pokemon IDs that participated
 * @returns {Object} Rewards object with xp_awarded, currency_awarded, xp_is_catch_bonus, xp_distributed_to
 */
export function calculateBattleRewards(opponent, wasCaught = false, participatingPokemonIds = []) {
  const opponentLevel = opponent.level || 1;
  const opponentSR = opponent.sr || 0.5;

  const xpAwarded = calculateXpAward(opponentLevel, opponentSR, wasCaught);
  const currencyAwarded = wasCaught ? 0 : calculateCurrencyAward(opponentLevel);

  return {
    xp_awarded: xpAwarded,
    currency_awarded: currencyAwarded,
    xp_is_catch_bonus: wasCaught,
    xp_distributed_to: participatingPokemonIds
  };
}
