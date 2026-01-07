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
 * @typedef {Object} MultiHitEffect
 * @property {number} minHits - Minimum number of hits
 * @property {number} maxHits - Maximum number of hits
 * @property {boolean} untilMiss - True if "continue until miss" pattern
 */

/**
 * @typedef {Object} ConditionalDamageEffect
 * @property {'double_if_damaged'|'double_if_status'|'power_scales'} type - Type of conditional
 * @property {string|null} statusRequired - For double_if_status: which status
 * @property {string|null} scalesWith - For power_scales: what it scales with
 * @property {number} multiplier - Damage multiplier when condition met (usually 2)
 */

/**
 * @typedef {Object} ChargeMoveEffect
 * @property {boolean} isCharge - True if move requires charging
 * @property {boolean} grantsInvulnerability - True if user is untargetable during charge
 * @property {string|null} invulnerableFrom - Which move grants invulnerability (for bypass checks)
 * @property {boolean} isRecharge - True if move requires recharge AFTER use (Hyper Beam)
 */

/**
 * @typedef {Object} ControlEffect
 * @property {'grapple'|'restrain'|'prevent_flee'|'prevent_switch'} type - Type of control
 * @property {number|null} durationRounds - How long the control lasts
 * @property {string|null} escapeCheck - Save type for escape (STR, DEX, etc)
 * @property {number|null} escapeDC - DC for escape save
 */

/**
 * @typedef {Object} AoEEffect
 * @property {'cone'|'line'|'sphere'|'radius'|'cube'} shape - Shape of AoE
 * @property {number} size - Size in feet (length for line/cone, radius for sphere)
 * @property {number|null} width - Width in feet (for line only)
 */

/**
 * @typedef {Object} StatEffect
 * @property {'str'|'dex'|'con'|'int'|'wis'|'cha'} stat - Which ability score
 * @property {'increase'|'decrease'} direction - Buff or debuff
 * @property {number} amount - Amount of change
 * @property {'self'|'target'} target - Who is affected
 * @property {'turn'|'combat'|'duration'} duration - How long effect lasts
 */

/**
 * @typedef {Object} MoveEffect
 * @property {HealingEffect|null} healing - Healing effect if present
 * @property {RecoilEffect|null} recoil - Recoil effect if present
 * @property {ACEffect|null} acEffect - AC modification effect
 * @property {SpeedEffect|null} speedEffect - Speed modification effect
 * @property {MultiHitEffect|null} multiHit - Multi-hit effect if present
 * @property {ConditionalDamageEffect|null} conditionalDamage - Conditional damage effect
 * @property {ChargeMoveEffect|null} chargeMove - Charge/two-turn move effect
 * @property {ControlEffect|null} controlEffect - Control/restraint effect
 * @property {AoEEffect|null} aoeEffect - Area of effect parameters
 * @property {StatEffect|null} statEffect - Stat modification effect
 * @property {boolean} autoHit - True if move bypasses attack roll
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
 * Feature 024 T034: Parse stat modification effect from move description
 * Handles ability score buffs/debuffs (STR, DEX, CON, INT, WIS, CHA)
 *
 * @param {string} description - Move description text
 * @returns {StatEffect|null}
 */
export function parseStatEffect(description) {
  if (!description) return null;

  const descLower = description.toLowerCase();

  // Map of stat keywords to standard abbreviations
  const statKeywords = {
    'strength': 'str',
    'dexterity': 'dex',
    'constitution': 'con',
    'intelligence': 'int',
    'wisdom': 'wis',
    'charisma': 'cha',
    'str': 'str',
    'dex': 'dex',
    'con': 'con',
    'int': 'int',
    'wis': 'wis',
    'cha': 'cha'
  };

  // Detect which stat is being modified
  let stat = null;
  for (const [keyword, abbrev] of Object.entries(statKeywords)) {
    if (descLower.includes(keyword)) {
      stat = abbrev;
      break;
    }
  }

  if (!stat) return null;

  // Stat increase patterns: "STR increases by X", "gain +X to STR", "boost STR by X"
  const increaseMatch = description.match(new RegExp(`(?:${stat}|${Object.keys(statKeywords).find(k => statKeywords[k] === stat)})\\s+(?:increases?|boosts?)\\s+by\\s+(\\d+)`, 'i')) ||
                        description.match(new RegExp(`gain\\s+\\+?(\\d+)\\s+(?:to\\s+)?(?:your\\s+)?(?:${stat}|${Object.keys(statKeywords).find(k => statKeywords[k] === stat)})`, 'i')) ||
                        description.match(new RegExp(`\\+(\\d+)\\s+(?:to\\s+)?(?:${stat}|${Object.keys(statKeywords).find(k => statKeywords[k] === stat)})`, 'i'));

  if (increaseMatch) {
    const amount = parseInt(increaseMatch[1], 10);
    return {
      stat,
      direction: 'increase',
      amount,
      target: descLower.includes('target') ? 'target' : 'self',
      duration: descLower.includes('duration') || descLower.includes('combat') ? 'combat' : 'turn'
    };
  }

  // Stat decrease patterns: "target's STR is reduced by X", "decrease STR by X"
  const decreaseMatch = description.match(new RegExp(`(?:target'?s?\\s+)?(?:${stat}|${Object.keys(statKeywords).find(k => statKeywords[k] === stat)})\\s+(?:is\\s+)?(?:reduced|decreased|lowered)\\s+by\\s+(\\d+)`, 'i')) ||
                        description.match(new RegExp(`reduce\\s+(?:the\\s+)?(?:target'?s?\\s+)?(?:${stat}|${Object.keys(statKeywords).find(k => statKeywords[k] === stat)})\\s+by\\s+(\\d+)`, 'i'));

  if (decreaseMatch) {
    const amount = parseInt(decreaseMatch[1], 10);
    return {
      stat,
      direction: 'decrease',
      amount,
      target: 'target',
      duration: descLower.includes('duration') || descLower.includes('combat') ? 'combat' : 'turn'
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
 * Feature 024 T041: Parse AoE effect from move range field
 * Detects cone, line, sphere, radius, and cube patterns
 *
 * @param {string} range - Move range field (e.g., "30-foot cone", "60-foot line")
 * @returns {AoEEffect|null}
 */
export function parseAoEEffect(range) {
  if (!range) return null;

  const rangeLower = range.toLowerCase();

  // Cone pattern: "X-foot cone" or "Xft cone"
  const coneMatch = range.match(/(\d+)[-\s]*(?:foot|ft)?\s*cone/i);
  if (coneMatch) {
    return {
      shape: 'cone',
      size: parseInt(coneMatch[1], 10),
      width: null
    };
  }

  // Line pattern: "X-foot line" or "Xft line" - may include width
  const lineMatch = range.match(/(\d+)[-\s]*(?:foot|ft)?\s*(?:long|by)?\s*(\d+)?[-\s]*(?:foot|ft)?\s*(?:wide)?\s*line/i);
  if (lineMatch) {
    return {
      shape: 'line',
      size: parseInt(lineMatch[1], 10),
      width: lineMatch[2] ? parseInt(lineMatch[2], 10) : 5 // Default 5ft wide
    };
  }

  // Sphere pattern: "X-foot sphere" or "X-foot-radius sphere"
  const sphereMatch = range.match(/(\d+)[-\s]*(?:foot|ft)?[-\s]*(?:radius)?\s*sphere/i);
  if (sphereMatch) {
    return {
      shape: 'sphere',
      size: parseInt(sphereMatch[1], 10),
      width: null
    };
  }

  // Radius pattern: "X-foot radius" (centered on point)
  const radiusMatch = range.match(/(\d+)[-\s]*(?:foot|ft)?\s*radius/i);
  if (radiusMatch && !rangeLower.includes('sphere')) {
    return {
      shape: 'radius',
      size: parseInt(radiusMatch[1], 10),
      width: null
    };
  }

  // Cube pattern: "X-foot cube"
  const cubeMatch = range.match(/(\d+)[-\s]*(?:foot|ft)?\s*cube/i);
  if (cubeMatch) {
    return {
      shape: 'cube',
      size: parseInt(cubeMatch[1], 10),
      width: null
    };
  }

  return null;
}

/**
 * Feature 024 T054: Parse multi-hit effect from move description
 * Detects moves that hit multiple times (2-5 hits, until miss, etc.)
 *
 * @param {string} description - Move description text
 * @returns {MultiHitEffect|null}
 */
export function parseMultiHitEffect(description) {
  if (!description) return null;

  // Pattern: "hits 2-5 times", "strikes 2-5 times"
  const variableMatch = description.match(/(?:hits?|strikes?|attacks?)\s+(\d+)[-–to]+(\d+)\s+times/i);
  if (variableMatch) {
    return {
      minHits: parseInt(variableMatch[1], 10),
      maxHits: parseInt(variableMatch[2], 10),
      untilMiss: false
    };
  }

  // Pattern: "hits twice", "strikes three times"
  const fixedMatch = description.match(/(?:hits?|strikes?|attacks?)\s+(twice|two|three|four|five)\s+times?/i);
  if (fixedMatch) {
    const wordToNum = { twice: 2, two: 2, three: 3, four: 4, five: 5 };
    const count = wordToNum[fixedMatch[1].toLowerCase()] || 2;
    return {
      minHits: count,
      maxHits: count,
      untilMiss: false
    };
  }

  // Pattern: "continues until it misses", "until it misses"
  if (/continues?\s+until\s+(?:it\s+)?misses?/i.test(description) ||
      /until\s+(?:it\s+)?misses?\s+or/i.test(description)) {
    return {
      minHits: 1,
      maxHits: 10, // Practical maximum
      untilMiss: true
    };
  }

  return null;
}

/**
 * Feature 024 T055: Parse conditional damage effect from move description
 * Detects damage modifiers based on conditions (target took damage, has status, etc.)
 *
 * @param {string} description - Move description text
 * @returns {ConditionalDamageEffect|null}
 */
export function parseConditionalDamageEffect(description) {
  if (!description) return null;

  const descLower = description.toLowerCase();

  // Pattern: "double damage if target took damage this turn", "deals double if hit first"
  if (/double\s+damage\s+if.*(?:took|taken|received)\s+damage/i.test(description) ||
      /deals?\s+double\s+if.*(?:was\s+)?hit/i.test(description)) {
    return {
      type: 'double_if_damaged',
      statusRequired: null,
      scalesWith: null,
      multiplier: 2
    };
  }

  // Pattern: "double damage if target is poisoned/paralyzed/etc"
  const statusMatch = description.match(/double\s+damage\s+if.*(?:target\s+)?(?:is\s+)?(poisoned|paralyzed|burned|frozen|asleep|confused)/i);
  if (statusMatch) {
    return {
      type: 'double_if_status',
      statusRequired: statusMatch[1].toUpperCase(),
      scalesWith: null,
      multiplier: 2
    };
  }

  // Pattern: "power scales with remaining HP", "more damage when HP is low"
  if (/power\s+(?:scales|increases).*(?:hp|hit\s*points)/i.test(description) ||
      /more\s+damage.*(?:low|less)\s+hp/i.test(description)) {
    return {
      type: 'power_scales',
      statusRequired: null,
      scalesWith: 'hp',
      multiplier: 1 // Variable
    };
  }

  return null;
}

/**
 * Feature 024 T067: Parse charge move effect from move description/time
 * Detects two-turn moves (charge then attack) and recharge moves
 *
 * @param {string} description - Move description text
 * @param {string} time - Move time field
 * @returns {ChargeMoveEffect|null}
 */
export function parseChargeMoveEffect(description, time) {
  if (!description) return null;

  const descLower = description.toLowerCase();

  // Check for recharge pattern (Hyper Beam): "must recharge", "recharge turn"
  if (/must\s+recharge/i.test(description) || /recharge\s+(?:next\s+)?turn/i.test(description)) {
    return {
      isCharge: false,
      grantsInvulnerability: false,
      invulnerableFrom: null,
      isRecharge: true
    };
  }

  // Check for charge pattern: "charges up", "first turn", "next turn attacks"
  if (/charges?\s+(?:up|first)/i.test(description) ||
      /first\s+turn.*(?:second\s+turn|next\s+turn)/i.test(description)) {
    // Check for invulnerability
    const hasInvuln = /(?:fly|dig|dive|phantom|shadow)/i.test(description) ||
                      /invulnerable|untargetable|can't\s+be\s+hit/i.test(description);

    return {
      isCharge: true,
      grantsInvulnerability: hasInvuln,
      invulnerableFrom: hasInvuln ? 'charge' : null,
      isRecharge: false
    };
  }

  return null;
}

/**
 * Feature 024 T080: Parse control effect from move description
 * Detects grapple, restrain, prevent flee/switch effects
 *
 * @param {string} description - Move description text
 * @returns {ControlEffect|null}
 */
export function parseControlEffect(description) {
  if (!description) return null;

  const descLower = description.toLowerCase();

  // Grapple pattern
  if (/grappled?/i.test(description) || /grabs?\s+(?:the\s+)?target/i.test(description)) {
    const dcMatch = description.match(/DC\s+(\d+)/i);
    return {
      type: 'grapple',
      durationRounds: null,
      escapeCheck: 'STR',
      escapeDC: dcMatch ? parseInt(dcMatch[1], 10) : null
    };
  }

  // Restrain pattern
  if (/restrained?/i.test(description) || /binds?\s+(?:the\s+)?target/i.test(description)) {
    const dcMatch = description.match(/DC\s+(\d+)/i);
    return {
      type: 'restrain',
      durationRounds: null,
      escapeCheck: 'STR',
      escapeDC: dcMatch ? parseInt(dcMatch[1], 10) : null
    };
  }

  // Prevent flee pattern
  if (/cannot\s+(?:flee|escape|switch|retreat)/i.test(description) ||
      /prevents?\s+(?:the\s+)?(?:target\s+)?(?:from\s+)?(?:fleeing|escaping|switching)/i.test(description)) {
    return {
      type: 'prevent_flee',
      durationRounds: 5, // Default combat duration
      escapeCheck: null,
      escapeDC: null
    };
  }

  return null;
}

/**
 * Feature 024: Parse auto-hit effect from move description
 * Task: T014
 *
 * Auto-hit moves bypass the attack roll entirely.
 * Examples: Aerial Ace, Swift, Aura Sphere, Feint Attack, Magical Leaf
 *
 * @param {string} description - Move description text
 * @returns {boolean} True if move auto-hits (bypasses attack roll)
 */
export function parseAutoHit(description) {
  if (!description) return false;

  const descLower = description.toLowerCase();

  // Pattern: "automatically hits" / "always hits" / "never misses"
  if (/automatically\s+hits/i.test(description) ||
      /always\s+hits/i.test(description) ||
      /never\s+misses?/i.test(description)) {
    return true;
  }

  // Pattern: "this attack cannot miss" / "this move cannot miss"
  if (/(?:this\s+)?(?:attack|move)\s+cannot\s+miss/i.test(description)) {
    return true;
  }

  // Pattern: "hits without making an attack roll"
  if (/hits?\s+without\s+(?:making\s+)?(?:an?\s+)?attack\s+roll/i.test(description)) {
    return true;
  }

  // Pattern: "does not require an attack roll"
  if (/does\s+not\s+require\s+(?:an?\s+)?attack\s+roll/i.test(description)) {
    return true;
  }

  // Pattern: "No attack roll is made" (5e style)
  if (/no\s+attack\s+roll\s+(?:is\s+)?(?:made|required|needed)/i.test(description)) {
    return true;
  }

  return false;
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
      multiHit: null,
      conditionalDamage: null,
      chargeMove: null,
      controlEffect: null,
      aoeEffect: null,
      statEffect: null,
      autoHit: false,
      hasEffects: false
    };
  }

  const healing = parseHealingEffect(description);
  const recoil = parseRecoilEffect(description);
  const acEffect = parseACEffect(description);
  const speedEffect = parseSpeedEffect(description);

  // Feature 024: All effect parsers now implemented
  const multiHit = parseMultiHitEffect(description);
  const conditionalDamage = parseConditionalDamageEffect(description);
  const chargeMove = parseChargeMoveEffect(description, move?.time);
  const controlEffect = parseControlEffect(description);

  // Feature 024 T041: Parse AoE effect from move range
  const aoeEffect = move?.range ? parseAoEEffect(move.range) : null;

  // Feature 024 T034: Parse stat effect from description
  const statEffect = parseStatEffect(description);

  // Feature 024: T014 - Auto-hit moves bypass attack roll
  const autoHit = parseAutoHit(description);

  const hasEffects = !!(healing || recoil || acEffect || speedEffect ||
                        multiHit || conditionalDamage || chargeMove ||
                        controlEffect || aoeEffect || statEffect || autoHit);

  return {
    healing,
    recoil,
    acEffect,
    speedEffect,
    multiHit,
    conditionalDamage,
    chargeMove,
    controlEffect,
    aoeEffect,
    statEffect,
    autoHit,
    hasEffects
  };
}

export default {
  parseHealingEffect,
  parseRecoilEffect,
  parseACEffect,
  parseSpeedEffect,
  parseStatEffect,
  parseAoEEffect,
  parseMultiHitEffect,
  parseConditionalDamageEffect,
  parseChargeMoveEffect,
  parseControlEffect,
  parseAutoHit,
  parseMoveEffects
};
