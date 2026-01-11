/**
 * Formula Evaluator Utility
 * Evaluates level-based damage formulas for moves like Seismic Toss, Night Shade
 *
 * Feature: 029-ambiguous-moves
 *
 * Supported formula expressions:
 * - Dice notation: "1d6", "2d8"
 * - Variables: user_level, target_level, weight_diff
 * - Combined: "1d6 + user_level", "2d8 + target_level"
 */

const { rollDice, rollDiceDetailed } = require('./diceRoller');

/**
 * Supported variables in formula expressions
 */
const SUPPORTED_VARIABLES = ['user_level', 'target_level', 'weight_diff'];

/**
 * Parse a formula expression and identify its components
 *
 * @param {string} expression - Formula like "1d6 + user_level"
 * @returns {{ dice: string|null, variables: string[], constant: number }} Parsed components
 */
function parseExpression(expression) {
  if (!expression) {
    return { dice: null, variables: [], constant: 0 };
  }

  const expr = expression.toLowerCase().trim();
  let dice = null;
  const variables = [];
  let constant = 0;

  // Extract dice notation (e.g., "1d6", "2d8")
  const diceMatch = expr.match(/(\d+d\d+)/i);
  if (diceMatch) {
    dice = diceMatch[1];
  }

  // Extract variables
  for (const variable of SUPPORTED_VARIABLES) {
    if (expr.includes(variable)) {
      variables.push(variable);
    }
  }

  // Extract constant (standalone number not part of dice)
  // Match patterns like "+ 5" or "- 3" at end, but not "1d6"
  const constantMatch = expr.match(/([+-]\s*\d+)(?!d)(?:\s|$)/);
  if (constantMatch) {
    constant = parseInt(constantMatch[1].replace(/\s/g, ''), 10);
  }

  return { dice, variables, constant };
}

/**
 * Evaluate a formula expression with given context values
 *
 * @param {string} expression - Formula like "1d6 + user_level"
 * @param {Object} context - Variable values { user_level: 10, target_level: 5, weight_diff: 0 }
 * @returns {{ total: number, breakdown: string, diceRoll: number|null }} Evaluation result
 */
function evaluateFormula(expression, context = {}) {
  const parsed = parseExpression(expression);

  let total = 0;
  let diceRoll = null;
  const parts = [];

  // Roll dice if present
  if (parsed.dice) {
    const diceResult = rollDiceDetailed(parsed.dice);
    diceRoll = diceResult.total;
    total += diceRoll;
    parts.push(`${parsed.dice}(${diceRoll})`);
  }

  // Add variable values
  for (const variable of parsed.variables) {
    const value = context[variable] || 0;
    total += value;
    parts.push(`${variable}(${value})`);
  }

  // Add constant
  if (parsed.constant !== 0) {
    total += parsed.constant;
    if (parsed.constant > 0) {
      parts.push(`+${parsed.constant}`);
    } else {
      parts.push(`${parsed.constant}`);
    }
  }

  const breakdown = parts.join(' + ').replace(' + -', ' - ') || '0';

  return {
    total,
    breakdown,
    diceRoll
  };
}

/**
 * Evaluate a formula with seeded random for reproducibility (testing)
 *
 * @param {string} expression - Formula like "1d6 + user_level"
 * @param {Object} context - Variable values
 * @param {Function} rollFn - Custom roll function for seeded RNG
 * @returns {{ total: number, breakdown: string, diceRoll: number|null }} Evaluation result
 */
function evaluateFormulaWithRng(expression, context = {}, rollFn) {
  const parsed = parseExpression(expression);

  let total = 0;
  let diceRoll = null;
  const parts = [];

  // Roll dice if present using provided roll function
  if (parsed.dice) {
    const match = parsed.dice.match(/^(\d+)d(\d+)$/i);
    if (match) {
      const count = parseInt(match[1], 10);
      const sides = parseInt(match[2], 10);
      diceRoll = 0;
      for (let i = 0; i < count; i++) {
        diceRoll += rollFn(sides);
      }
      total += diceRoll;
      parts.push(`${parsed.dice}(${diceRoll})`);
    }
  }

  // Add variable values
  for (const variable of parsed.variables) {
    const value = context[variable] || 0;
    total += value;
    parts.push(`${variable}(${value})`);
  }

  // Add constant
  if (parsed.constant !== 0) {
    total += parsed.constant;
    if (parsed.constant > 0) {
      parts.push(`+${parsed.constant}`);
    } else {
      parts.push(`${parsed.constant}`);
    }
  }

  const breakdown = parts.join(' + ').replace(' + -', ' - ') || '0';

  return {
    total,
    breakdown,
    diceRoll
  };
}

/**
 * Validate a formula expression
 *
 * @param {string} expression - Formula to validate
 * @returns {{ valid: boolean, error: string|null }} Validation result
 */
function validateFormula(expression) {
  if (!expression || typeof expression !== 'string') {
    return { valid: false, error: 'Expression must be a non-empty string' };
  }

  const parsed = parseExpression(expression);

  // Must have at least dice or a variable
  if (!parsed.dice && parsed.variables.length === 0 && parsed.constant === 0) {
    return { valid: false, error: 'Expression must contain dice notation or variables' };
  }

  // Check for invalid variable names
  const expr = expression.toLowerCase();
  const wordPattern = /\b([a-z_]+)\b/g;
  let match;
  while ((match = wordPattern.exec(expr)) !== null) {
    const word = match[1];
    // Skip dice notation parts and operators
    if (/^\d*d?\d*$/.test(word)) continue;
    if (!SUPPORTED_VARIABLES.includes(word)) {
      return { valid: false, error: `Unknown variable: ${word}` };
    }
  }

  return { valid: true, error: null };
}

/**
 * Get the list of variables used in an expression
 *
 * @param {string} expression - Formula expression
 * @returns {string[]} List of variable names used
 */
function getFormulaVariables(expression) {
  const parsed = parseExpression(expression);
  return parsed.variables;
}

module.exports = {
  parseExpression,
  evaluateFormula,
  evaluateFormulaWithRng,
  validateFormula,
  getFormulaVariables,
  SUPPORTED_VARIABLES
};
