/**
 * Move Effect Parser
 * Parses move descriptions to extract structured effect data
 *
 * Feature: 022-combat-status-effects
 */

/**
 * @typedef {Object} HealingEffect
 * @property {'drain'|'fixed'|'dice'} type - Type of healing
 * @property {number|null} percentage - For drain: percentage of damage (e.g., 50)
 * @property {string|null} diceExpr - For dice: dice expression (e.g., "4d4")
 * @property {boolean} addMoveMod - Whether to add MOVE modifier
 * @property {number|null} amount - For fixed: fixed amount
 */

/**
 * @typedef {Object} RecoilEffect
 * @property {number} percentage - Percentage of damage taken as recoil (25, 50)
 * @property {boolean} typeless - Whether recoil bypasses type resistance (always true)
 */

/**
 * @typedef {Object} ACEffect
 * @property {'increase'|'decrease'} direction - Whether AC goes up or down
 * @property {number} amount - Amount of AC change (1, 2, etc.)
 * @property {'self'|'target'|'allies'} target - Who is affected
 * @property {'turn'|'combat'|'duration'} duration - How long effect lasts
 * @property {boolean} stackable - Whether effect can stack
 * @property {number|null} maxStack - Maximum stack count if stackable
 */

/**
 * @typedef {Object} SpeedEffect
 * @property {'increase'|'decrease'|'halve'} type - Type of speed change
 * @property {number|null} amount - Amount in feet (for increase/decrease)
 * @property {'self'|'target'} target - Who is affected
 */

/**
 * @typedef {Object} MoveEffect
 * @property {HealingEffect|null} healing - Healing effect if present
 * @property {RecoilEffect|null} recoil - Recoil effect if present
 * @property {ACEffect|null} acEffect - AC modification effect
 * @property {SpeedEffect|null} speedEffect - Speed modification effect
 * @property {boolean} hasEffects - True if any effect was parsed
 */

/**
 * Parse healing effect from move description
 * @param {string} description - Move description text
 * @returns {HealingEffect|null}
 */
export function parseHealingEffect(description) {
  if (!description) return null;

  const descLower = description.toLowerCase();

  // Drain pattern: "Half the damage done is restored" / "healed for half" / "regain half"
  if (/half.*damage.*restored|healed.*half.*damage|regain.*half|half.*restored.*user/i.test(description)) {
    return { type: 'drain', percentage: 50, diceExpr: null, addMoveMod: false, amount: null };
  }

  // Quarter drain pattern (less common)
  if (/quarter.*damage.*restored|regain.*quarter/i.test(description)) {
    return { type: 'drain', percentage: 25, diceExpr: null, addMoveMod: false, amount: null };
  }

  // Dice healing: "regain 4d4 + MOVE hit points" or "regain 4d4 hit points"
  const diceHealMatch = description.match(/regain\s+(\d+d\d+)\s*(?:\+\s*MOVE)?\s*hit\s*points/i);
  if (diceHealMatch) {
    const hasMoveMod = descLower.includes('+ move') || descLower.includes('+move');
    return {
      type: 'dice',
      percentage: null,
      diceExpr: diceHealMatch[1].toLowerCase(),
      addMoveMod: hasMoveMod,
      amount: null
    };
  }

  // Fixed healing: "regain 10 hit points" (just a number)
  const fixedHealMatch = description.match(/regain\s+(\d+)\s+hit\s*points/i);
  if (fixedHealMatch && !description.match(/\d+d\d+/)) {
    return {
      type: 'fixed',
      percentage: null,
      diceExpr: null,
      addMoveMod: false,
      amount: parseInt(fixedHealMatch[1], 10)
    };
  }

  // Alternate pattern: "heals X hit points"
  const healMatch = description.match(/heals?\s+(\d+d\d+|\d+)\s*(?:\+\s*MOVE)?\s*hit\s*points/i);
  if (healMatch) {
    const value = healMatch[1];
    if (value.includes('d')) {
      return {
        type: 'dice',
        percentage: null,
        diceExpr: value.toLowerCase(),
        addMoveMod: descLower.includes('+ move'),
        amount: null
      };
    } else {
      return {
        type: 'fixed',
        percentage: null,
        diceExpr: null,
        addMoveMod: false,
        amount: parseInt(value, 10)
      };
    }
  }

  return null;
}

/**
 * Parse recoil effect from move description
 * @param {string} description - Move description text
 * @returns {RecoilEffect|null}
 */
export function parseRecoilEffect(description) {
  if (!description) return null;

  const descLower = description.toLowerCase();

  // Check for recoil keyword
  if (!descLower.includes('recoil')) {
    return null;
  }

  // Half recoil patterns: "taking half of the damage", "taking 1/2", "50%"
  if (/(?:taking|take)\s+(?:a\s+)?(?:half|1\/2).*(?:damage|recoil)/i.test(description) ||
      /half\s+(?:of\s+)?(?:the\s+)?(?:total\s+)?damage.*recoil/i.test(description)) {
    return { percentage: 50, typeless: true };
  }

  // Quarter recoil patterns: "taking a quarter", "taking 1/4", "25%"
  if (/(?:taking|take)\s+(?:a\s+)?(?:quarter|1\/4).*(?:damage|recoil)/i.test(description) ||
      /quarter\s+(?:of\s+)?(?:the\s+)?(?:total\s+)?damage.*recoil/i.test(description)) {
    return { percentage: 25, typeless: true };
  }

  // Third recoil (rare): "taking 1/3"
  if (/(?:taking|take)\s+(?:a\s+)?(?:third|1\/3)/i.test(description)) {
    return { percentage: 33, typeless: true };
  }

  // Numeric percentage pattern (rare)
  const percentMatch = description.match(/(\d+)%.*recoil/i);
  if (percentMatch) {
    return { percentage: parseInt(percentMatch[1], 10), typeless: true };
  }

  // Default if recoil mentioned but no clear percentage - assume quarter
  return { percentage: 25, typeless: true };
}

/**
 * Parse AC modification effect from move description
 * @param {string} description - Move description text
 * @returns {ACEffect|null}
 */
export function parseACEffect(description) {
  if (!description) return null;

  const descLower = description.toLowerCase();

  // Check for AC keyword
  if (!descLower.includes('ac')) {
    return null;
  }

  // AC decrease patterns: "target's AC is reduced by X", "AC is decreased by X", "reduce AC by X"
  const decreaseMatch = description.match(/(?:target'?s?\s+)?ac\s+(?:is\s+)?(?:reduced|decreased|lowered)\s+by\s+(\d+)/i) ||
                        description.match(/reduce\s+(?:the\s+)?(?:target'?s?\s+)?ac\s+by\s+(\d+)/i);
  if (decreaseMatch) {
    const amount = parseInt(decreaseMatch[1], 10);
    const stackable = descLower.includes('stack') || descLower.includes('may be stacked');
    let maxStack = null;
    const maxStackMatch = description.match(/maximum\s+(?:of\s+)?[-]?(\d+)/i);
    if (maxStackMatch) {
      maxStack = parseInt(maxStackMatch[1], 10);
    }

    return {
      direction: 'decrease',
      amount,
      target: 'target',
      duration: descLower.includes('combat') || descLower.includes('remainder') ? 'combat' : 'duration',
      stackable,
      maxStack
    };
  }

  // AC increase patterns: "AC increases by X", "gain +X to AC", "boost AC by X"
  const increaseMatch = description.match(/(?:your\s+)?ac\s+(?:increases?|boosts?)\s+by\s+(\d+)/i) ||
                        description.match(/gain\s+\+?(\d+)\s+(?:to\s+)?(?:your\s+)?ac/i) ||
                        description.match(/\+(\d+)\s+(?:to\s+)?ac/i);
  if (increaseMatch) {
    const amount = parseInt(increaseMatch[1], 10);

    // Determine target
    let target = 'self';
    if (descLower.includes('allies') || descLower.includes('ally')) {
      target = 'allies';
    }

    return {
      direction: 'increase',
      amount,
      target,
      duration: descLower.includes('duration') ? 'duration' : 'turn',
      stackable: false,
      maxStack: null
    };
  }

  return null;
}

/**
 * Parse speed modification effect from move description
 * @param {string} description - Move description text
 * @returns {SpeedEffect|null}
 */
export function parseSpeedEffect(description) {
  if (!description) return null;

  const descLower = description.toLowerCase();

  // Check for speed keyword
  if (!descLower.includes('speed')) {
    return null;
  }

  // Speed halved pattern
  if (/(?:target'?s?\s+)?speed\s+is\s+halved/i.test(description) ||
      /halves?\s+(?:the\s+)?(?:target'?s?\s+)?speed/i.test(description)) {
    return { type: 'halve', amount: null, target: 'target' };
  }

  // Speed increase patterns: "speed increases by Xft", "gain X feet of movement"
  const increaseMatch = description.match(/(?:your\s+)?(?:movement\s+)?speed\s+(?:increases?|is\s+increased)\s+by\s+(\d+)\s*(?:ft|feet)?/i) ||
                        description.match(/gain\s+(\d+)\s*(?:ft|feet)?\s+(?:of\s+)?(?:movement\s+)?speed/i);
  if (increaseMatch) {
    return {
      type: 'increase',
      amount: parseInt(increaseMatch[1], 10),
      target: 'self'
    };
  }

  // Speed decrease patterns: "speed is reduced by Xft", "reduce speed by X"
  const decreaseMatch = description.match(/(?:target'?s?\s+)?speed\s+(?:is\s+)?(?:reduced|decreased|lowered)\s+by\s+(\d+)\s*(?:ft|feet)?/i) ||
                        description.match(/reduce\s+(?:the\s+)?(?:target'?s?\s+)?speed\s+by\s+(\d+)/i);
  if (decreaseMatch) {
    return {
      type: 'decrease',
      amount: parseInt(decreaseMatch[1], 10),
      target: 'target'
    };
  }

  // Speed to 0 pattern
  if (/speed\s+(?:is\s+)?(?:reduced\s+)?to\s+0/i.test(description)) {
    return { type: 'decrease', amount: 999, target: 'target' }; // Large number to ensure 0
  }

  return null;
}

/**
 * Parse all effects from a move's description
 * @param {Object} move - Move object with description property
 * @returns {MoveEffect}
 */
export function parseMoveEffects(move) {
  const description = move?.description || '';

  if (!description) {
    return {
      healing: null,
      recoil: null,
      acEffect: null,
      speedEffect: null,
      hasEffects: false
    };
  }

  const healing = parseHealingEffect(description);
  const recoil = parseRecoilEffect(description);
  const acEffect = parseACEffect(description);
  const speedEffect = parseSpeedEffect(description);

  const hasEffects = !!(healing || recoil || acEffect || speedEffect);

  return {
    healing,
    recoil,
    acEffect,
    speedEffect,
    hasEffects
  };
}

export default {
  parseHealingEffect,
  parseRecoilEffect,
  parseACEffect,
  parseSpeedEffect,
  parseMoveEffects
};
