/**
 * Dice Parser Utility
 * Parses damage dice from move descriptions and handles level scaling
 *
 * Feature: 006-battle-api
 */

/**
 * Parse damage dice from a move description string
 * Handles patterns like "1d6", "2d8", "1d6 + MOVE"
 *
 * @param {string} description - The move description containing dice notation
 * @param {string} higherLevels - Optional string describing dice changes at higher levels
 * @param {number} level - The Pokemon's current level
 * @returns {string|null} The dice expression (e.g., "1d6", "2d8") or null if not found
 */
function parseDamageDice(description, higherLevels, level) {
  // First check higherLevels for level-specific dice
  if (higherLevels && level) {
    const levelDice = parseDiceForLevel(higherLevels, level);
    if (levelDice) {
      return levelDice;
    }
  }

  // Fall back to base dice from description
  return extractDiceFromText(description);
}

/**
 * Extract dice notation from text
 * @param {string} text - Text to search for dice notation
 * @returns {string|null} Dice expression or null
 */
function extractDiceFromText(text) {
  if (!text) return null;

  // Match patterns like "1d6", "2d8", "3d10", etc.
  const dicePattern = /(\d+d\d+)/i;
  const match = text.match(dicePattern);

  if (match) {
    return match[1].toLowerCase();
  }

  return null;
}

/**
 * Parse higherLevels string to find appropriate dice for the given level
 * Example: "The damage increases to 1d10 at level 5, 2d8 at level 10, and 5d4 at level 17."
 *
 * @param {string} higherLevels - The higherLevels description string
 * @param {number} level - Current Pokemon level
 * @returns {string|null} Appropriate dice for the level or null
 */
function parseDiceForLevel(higherLevels, level) {
  if (!higherLevels) return null;

  // Pattern to find level thresholds and their dice
  // Matches patterns like "1d10 at level 5" or "2d8 at level 10"
  const levelPattern = /(\d+d\d+)\s+at\s+level\s+(\d+)/gi;

  let bestDice = null;
  let bestThreshold = 0;
  let match;

  while ((match = levelPattern.exec(higherLevels)) !== null) {
    const dice = match[1].toLowerCase();
    const threshold = parseInt(match[2], 10);

    // Use this dice if the Pokemon's level meets or exceeds the threshold
    // and it's the highest applicable threshold
    if (level >= threshold && threshold > bestThreshold) {
      bestDice = dice;
      bestThreshold = threshold;
    }
  }

  return bestDice;
}

/**
 * Parse a dice expression into its components
 * @param {string} diceExpr - Dice expression like "2d6"
 * @returns {{ count: number, sides: number }|null} Parsed components or null
 */
function parseDiceExpression(diceExpr) {
  if (!diceExpr) return null;

  const match = diceExpr.match(/^(\d+)d(\d+)$/i);
  if (!match) return null;

  return {
    count: parseInt(match[1], 10),
    sides: parseInt(match[2], 10)
  };
}

/**
 * Calculate the average roll for a dice expression
 * @param {string} diceExpr - Dice expression like "2d6"
 * @returns {number} Average roll value
 */
function getAverageDiceRoll(diceExpr) {
  const parsed = parseDiceExpression(diceExpr);
  if (!parsed) return 0;

  // Average of a die is (1 + sides) / 2
  const averagePerDie = (1 + parsed.sides) / 2;
  return Math.floor(parsed.count * averagePerDie);
}

module.exports = {
  parseDamageDice,
  extractDiceFromText,
  parseDiceForLevel,
  parseDiceExpression,
  getAverageDiceRoll
};
