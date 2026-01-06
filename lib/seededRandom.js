/**
 * Seedable Random Number Generator
 * Uses mulberry32 algorithm for reproducible random sequences
 *
 * Feature: 021-combat-test-harness
 */

/**
 * Mulberry32 PRNG algorithm
 * Fast, well-distributed 32-bit generator
 *
 * @param {number} seed - Initial seed value
 * @returns {function} Generator function returning 0-1
 */
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Create a seedable random number generator
 *
 * @param {number} [seed] - Optional seed value (default: Date.now())
 * @returns {Object} SeededRandom instance with random(), rollD20(), rollDice() methods
 */
export function createSeededRandom(seed = null) {
  const actualSeed = seed !== null ? seed : Date.now();
  const generator = mulberry32(actualSeed);

  return {
    seed: actualSeed,

    /**
     * Get random number between 0 and 1 (like Math.random())
     * @returns {number} Random float 0-1
     */
    random() {
      return generator();
    },

    /**
     * Roll a d20
     * @returns {number} Random integer 1-20
     */
    rollD20() {
      return Math.floor(generator() * 20) + 1;
    },

    /**
     * Roll a single die
     * @param {number} sides - Number of sides
     * @returns {number} Random integer 1-sides
     */
    rollSingleDie(sides) {
      return Math.floor(generator() * sides) + 1;
    },

    /**
     * Roll dice from expression (e.g., "2d6", "1d8+3")
     * @param {string} diceExpression - Dice notation
     * @returns {number} Sum of dice rolled plus modifier
     */
    rollDice(diceExpression) {
      if (!diceExpression) return 0;

      const match = diceExpression.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
      if (!match) {
        const num = parseInt(diceExpression, 10);
        return isNaN(num) ? 0 : num;
      }

      const count = parseInt(match[1], 10);
      const sides = parseInt(match[2], 10);
      const modifier = match[3] ? parseInt(match[3], 10) : 0;

      let total = 0;
      for (let i = 0; i < count; i++) {
        total += Math.floor(generator() * sides) + 1;
      }

      return total + modifier;
    },

    /**
     * Roll dice and return detailed results
     * @param {string} diceExpression - Dice notation
     * @returns {{ rolls: number[], total: number, expression: string }}
     */
    rollDiceDetailed(diceExpression) {
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
        rolls.push(Math.floor(generator() * sides) + 1);
      }

      const total = rolls.reduce((sum, roll) => sum + roll, 0) + modifier;

      return {
        rolls,
        total,
        expression: diceExpression,
        modifier
      };
    }
  };
}

export default { createSeededRandom };
