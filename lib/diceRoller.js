/**
 * Dice Roller Utility
 * Random dice rolling functions for combat calculations
 *
 * Feature: 006-battle-api
 */

/**
 * Roll a single die with the specified number of sides
 *
 * @param {number} sides - Number of sides on the die
 * @returns {number} Random value between 1 and sides
 */
function rollSingleDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Roll a d20 (standard attack roll die)
 *
 * @returns {number} Random value between 1 and 20
 */
function rollD20() {
  return rollSingleDie(20);
}

/**
 * Roll dice based on a dice expression (e.g., "2d6", "1d8")
 *
 * @param {string} diceExpression - Dice notation like "2d6" or "1d8+3"
 * @returns {number} Sum of all dice rolled (plus any modifier)
 */
function rollDice(diceExpression) {
  if (!diceExpression) return 0;

  // Handle expressions like "2d6+3" or "1d8-2"
  const match = diceExpression.match(/^(\d+)d(\d+)([+-]\d+)?$/i);

  if (!match) {
    // Try to parse as just a number
    const num = parseInt(diceExpression, 10);
    return isNaN(num) ? 0 : num;
  }

  const count = parseInt(match[1], 10);
  const sides = parseInt(match[2], 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0;

  let total = 0;
  for (let i = 0; i < count; i++) {
    total += rollSingleDie(sides);
  }

  return total + modifier;
}

/**
 * Roll dice and return detailed results
 *
 * @param {string} diceExpression - Dice notation like "2d6"
 * @returns {{ rolls: number[], total: number, expression: string }}
 */
function rollDiceDetailed(diceExpression) {
  if (!diceExpression) {
    return { rolls: [], total: 0, expression: '0' };
  }

  const match = diceExpression.match(/^(\d+)d(\d+)([+-]\d+)?$/i);

  if (!match) {
    const num = parseInt(diceExpression, 10);
    const value = isNaN(num) ? 0 : num;
    return { rolls: [value], total: value, expression: diceExpression };
  }

  const count = parseInt(match[1], 10);
  const sides = parseInt(match[2], 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0;

  const rolls = [];
  for (let i = 0; i < count; i++) {
    rolls.push(rollSingleDie(sides));
  }

  const total = rolls.reduce((sum, roll) => sum + roll, 0) + modifier;

  return {
    rolls,
    total,
    expression: diceExpression
  };
}

/**
 * Check if an attack roll is a critical hit (natural 20)
 *
 * @param {number} roll - The d20 roll before modifiers
 * @returns {boolean} True if critical hit
 */
function isCriticalHit(roll) {
  return roll === 20;
}

/**
 * Check if an attack roll is a critical miss (natural 1)
 *
 * @param {number} roll - The d20 roll before modifiers
 * @returns {boolean} True if critical miss
 */
function isCriticalMiss(roll) {
  return roll === 1;
}

module.exports = {
  rollSingleDie,
  rollD20,
  rollDice,
  rollDiceDetailed,
  isCriticalHit,
  isCriticalMiss
};
