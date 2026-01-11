#!/usr/bin/env node
/**
 * Move Data Extraction Script
 * Extracts structured data from move descriptions into new fields:
 * - damage: { dice, modifier, damage_type, attack_type }
 * - save: { type, dc, on_fail, on_success }
 * - flavor: narrative text without mechanics
 * - extra_effects: complex effects as free-form text
 * - scaling: { level: dice } from higherLevels
 *
 * Feature: 028-move-data-extraction
 */

const fs = require('fs');
const path = require('path');

// Configuration
const MOVES_PATH = path.join(__dirname, '../Source/moves/moves.json');
const WARNINGS_PATH = path.join(__dirname, '../extraction-warnings.json');

// Valid values for validation
const VALID_ATTACK_TYPES = ['melee', 'ranged', 'save', 'auto', 'reaction', 'passive', 'self', 'hybrid'];
const VALID_SAVE_TYPES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
const DICE_PATTERN = /^\d+d\d+$/;

// CLI arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');

// Tracking
const warnings = [];
let processedCount = 0;
let warningCount = 0;
let errorCount = 0;

/**
 * T004: Parse attack type from description
 * Detects melee/ranged/save/auto/reaction/passive/self from description patterns
 * @param {string} description - Move description
 * @returns {string|null} Attack type or null
 */
function parseAttackType(description) {
  if (!description) return null;
  const desc = description.toLowerCase();

  // Self-damage (costs, recoil taken as part of using the move)
  // Check this first - "you take X damage" as a cost/reaction
  if (/you\s+(?:may\s+)?(?:use\s+your\s+reaction\s+to\s+)?take\s+\d+d\d+\s+(?:\w+\s+)?damage\s+(?:in\s+order\s+)?to/i.test(description)) {
    return 'self';
  }

  // Passive/Aura damage - triggers when creatures hit you or enter area
  // "Whenever a creature hits you" or "when a creature enters"
  if (/whenever\s+(?:a\s+)?creature\s+hits\s+you/i.test(description)) {
    return 'passive';
  }
  if (/when\s+(?:a\s+)?creature\s+(?:enters|begins)/i.test(description) &&
      /(?:take|takes)\s+\d+d\d+/i.test(description)) {
    return 'passive';
  }
  // Area damage on enter/start turn without attack roll
  if (/(?:enters?\s+the\s+area|begins?\s+their\s+turn\s+inside)/i.test(description) &&
      /(?:take|takes)\s+\d+d\d+/i.test(description) &&
      !/attack\s+roll/i.test(description)) {
    return 'passive';
  }

  // Reaction attacks - "use your reaction" or "as a reaction" with damage
  if (/(?:use\s+(?:your\s+|a\s+)?reaction|as\s+a\s+reaction)/i.test(description) &&
      /\d+d\d+.*?damage/i.test(description)) {
    // Check if it's a reaction counter-attack with attack roll
    if (/attack\s+roll/i.test(description)) {
      return 'reaction';
    }
    return 'reaction';
  }
  // "When hit by" + retaliate pattern
  if (/when\s+hit\s+(?:by|with)/i.test(description) &&
      /(?:retaliate|attack\s+roll)/i.test(description)) {
    return 'reaction';
  }

  // Auto-hit (guaranteed to hit / automatically hits/deals)
  if (/(?:is\s+)?guaranteed\s+to\s+hit/i.test(description)) {
    return 'auto';
  }
  if (/automatically\s+(?:hits?|deals?)/i.test(description)) {
    return 'auto';
  }
  if (/inflict(?:s|ing)?\s+\d+d\d+.*?damage\s+automatically/i.test(description)) {
    return 'auto';
  }
  if (/inflict(?:s|ing)?\s+\d+d\d+.*?damage/i.test(description) &&
      !/attack\s+roll/i.test(description) && !/save/i.test(description)) {
    return 'auto';
  }

  // Melee attack - explicit (including multi-attack: "Make two melee attacks")
  if (/make\s+(?:a|two|three|four|five|\d+)\s+melee\s+attack/i.test(description)) {
    return 'melee';
  }

  // Melee attack - "Roll a melee attack roll"
  if (/roll\s+(?:a\s+)?melee\s+attack\s+roll/i.test(description)) {
    return 'melee';
  }

  // Melee attack - "make a diving melee attack" (fly-style)
  if (/make\s+(?:a\s+)?(?:\w+\s+)?melee\s+attack/i.test(description)) {
    return 'melee';
  }

  // Melee attack - implicit ("You strike" + "on a hit")
  if (/you\s+strike\s+(?:a\s+)?(?:creature|target)/i.test(description) &&
      /on\s+a\s+(?:successful\s+)?hit/i.test(description)) {
    return 'melee';
  }

  // Melee attack - "make an attack roll" with melee in description
  if (/make\s+(?:a|an|two|three)\s+attack\s+roll/i.test(description) &&
      /melee/i.test(description)) {
    return 'melee';
  }

  // Ranged attack - explicit (including multi-attack)
  if (/make\s+(?:a|two|three|four|five|\d+)\s+ranged\s+attack/i.test(description)) {
    return 'ranged';
  }

  // Ranged attack - "roll a ranged attack"
  if (/roll\s+(?:a\s+)?ranged\s+attack/i.test(description)) {
    return 'ranged';
  }

  // Hybrid attack - "ranged or melee attack" or "melee or ranged attack"
  if (/(?:ranged\s+or\s+melee|melee\s+or\s+ranged)\s+attack/i.test(description)) {
    return 'hybrid';
  }

  // Save-based (no attack roll)
  if (/must\s+(?:make|succeed\s+(?:on\s+)?)\s*(?:a\s+)?(\w+)\s+sav(?:e|ing)/i.test(description)) {
    return 'save';
  }

  // Creatures must make a save (AOE pattern)
  if (/creatures?\s+(?:caught|in|within).*?must\s+make/i.test(description)) {
    return 'save';
  }

  // "makes a [STAT] saving throw" pattern (without "must")
  if (/makes?\s+(?:a\s+)?(?:STR|DEX|CON|INT|WIS|CHA)\s+sav(?:e|ing)/i.test(description)) {
    return 'save';
  }

  // "saving throw against" pattern
  if (/sav(?:e|ing)\s+(?:throw\s+)?against\s+(?:your\s+)?(?:Move\s+)?DC/i.test(description)) {
    return 'save';
  }

  // Auto-hit: "damages all creatures" pattern (AOE without save)
  if (/damages?\s+(?:all\s+)?creatures?\s+(?:in|within)/i.test(description) &&
      !/save/i.test(description)) {
    return 'auto';
  }

  // Auto-hit: "Each hit for X damage" (swift-like)
  if (/each\s+hit(?:s)?\s+for\s+\d+d\d+/i.test(description)) {
    return 'auto';
  }

  // Auto-hit: "dealing X damage" with no attack roll or save mentioned
  if (/dealing\s+\d+d\d+.*?damage/i.test(description) &&
      !/attack\s+roll/i.test(description) && !/attack\s+on/i.test(description) &&
      !/save/i.test(description) && !/on\s+a\s+hit/i.test(description)) {
    return 'auto';
  }

  return null;
}

/**
 * T005: Parse save information from description
 * @param {string} description - Move description
 * @returns {Object|null} Save info { type, dc, on_fail, on_success } or null
 */
function parseSaveInfo(description) {
  if (!description) return null;

  // Pattern: "[STAT] save" or "must make a [STAT] save"
  const saveTypeMatch = description.match(
    /(?:must\s+(?:make|succeed\s+on)\s+(?:a\s+)?)?(\w+)\s+sav(?:e|ing)(?:\s+throw)?/i
  );

  if (!saveTypeMatch) return null;

  let saveType = saveTypeMatch[1].toUpperCase();

  // Normalize full names to abbreviations
  const abbreviations = {
    'STRENGTH': 'STR', 'DEXTERITY': 'DEX', 'CONSTITUTION': 'CON',
    'INTELLIGENCE': 'INT', 'WISDOM': 'WIS', 'CHARISMA': 'CHA'
  };
  saveType = abbreviations[saveType] || saveType.substring(0, 3);

  if (!VALID_SAVE_TYPES.includes(saveType)) return null;

  // Determine on_fail and on_success
  let on_fail = 'full';
  let on_success = null;

  const desc = description.toLowerCase();

  // Check for "half as much on a success/save"
  if (/half\s+(?:as\s+much\s+)?(?:damage\s+)?(?:on\s+(?:a\s+)?)?(?:success|save|successful)/i.test(description)) {
    on_success = 'half';
  }

  // Check for "nothing on a success"
  if (/nothing\s+on\s+(?:a\s+)?(?:success|save)/i.test(description)) {
    on_success = 'none';
  }

  // Check for status effect on fail (not just damage)
  // Avoid matching common non-status words like "and", "the", "taking"
  const statusOnFail = description.match(
    /(?:on\s+(?:a\s+)?fail(?:ure)?|fails?\s+the\s+save)[,\s]+(?:the\s+target\s+)?(?:is\s+|becomes?\s+)?(burned|frozen|paralyzed|poisoned|asleep|confused|frightened|stunned|restrained|grappled|prone|blinded|deafened|charmed|incapacitated)/i
  );
  if (statusOnFail) {
    on_fail = statusOnFail[1].toLowerCase();
  }

  return {
    type: saveType,
    dc: 'Move DC',
    on_fail,
    on_success
  };
}

/**
 * T006: Parse damage information from description
 * @param {string} description - Move description
 * @param {string} moveType - Move's type (fire, water, etc.)
 * @param {string} moveRange - Move's range field (melee, 30ft, etc.)
 * @returns {Object|null} Damage info { dice, modifier, damage_type, attack_type, hit_count } or null
 */
function parseDamageInfo(description, moveType, moveRange) {
  if (!description) return null;

  // Pattern: "XdY [+ MOVE] [type] damage"
  const damageMatch = description.match(
    /(\d+d\d+)\s*(?:\+\s*MOVE)?\s*(?:(\w+)\s+)?damage/i
  );

  if (!damageMatch) return null;

  const dice = damageMatch[1].toLowerCase();

  // Check for modifier
  const hasModifier = /\d+d\d+\s*\+\s*MOVE/i.test(description);
  const modifier = hasModifier ? 'MOVE' : null;

  // Extract damage type - use captured group or fall back to move type
  let damage_type = damageMatch[2]?.toLowerCase() || moveType?.toLowerCase();

  // Validate damage type is not a non-type word
  const nonTypeWords = ['on', 'a', 'the', 'and', 'or', 'hit', 'fail', 'success', 'target'];
  if (nonTypeWords.includes(damage_type)) {
    damage_type = moveType?.toLowerCase();
  }

  // Get attack type from description
  let attack_type = parseAttackType(description);

  // Fallback: if no attack_type detected but has "attack roll" and range is melee, assume melee
  if (!attack_type && /(?:make|roll)\s+(?:a|an)\s+attack\s+roll/i.test(description)) {
    if (moveRange === 'melee') {
      attack_type = 'melee';
    } else if (moveRange && /^\d+\s*ft/i.test(moveRange)) {
      attack_type = 'ranged';
    }
  }

  // Parse hit count for multi-attacks
  const hit_count = parseHitCount(description);

  return {
    dice,
    modifier,
    damage_type: damage_type || null,
    attack_type,
    hit_count
  };
}

/**
 * Parse hit count from multi-attack descriptions
 * @param {string} description - Move description
 * @returns {number} Number of attack rolls (default 1)
 */
function parseHitCount(description) {
  if (!description) return 1;

  // Word-based patterns: "Make two melee attacks", "three ranged attacks"
  const wordMatch = description.match(
    /(?:make|roll)\s+(two|three|four|five)\s+(?:melee|ranged)?\s*attack/i
  );
  if (wordMatch) {
    const wordToNum = { 'two': 2, 'three': 3, 'four': 4, 'five': 5 };
    return wordToNum[wordMatch[1].toLowerCase()] || 1;
  }

  // Numeric patterns: "Make 2 attacks", "3 melee attacks"
  const numMatch = description.match(
    /(?:make|roll)\s+(\d+)\s+(?:melee|ranged)?\s*attack/i
  );
  if (numMatch) {
    return parseInt(numMatch[1], 10);
  }

  // "attacks twice" or "strike twice"
  if (/(?:attack|strike)s?\s+twice/i.test(description)) {
    return 2;
  }

  // "attacks three times"
  if (/(?:attack|strike)s?\s+three\s+times/i.test(description)) {
    return 3;
  }

  return 1;
}

/**
 * T007: Parse scaling from higherLevels text
 * @param {string} higherLevels - Higher levels description
 * @returns {Object|null} Scaling object { level: dice } or null
 */
function parseScaling(higherLevels) {
  if (!higherLevels) return null;

  const scaling = {};
  // Pattern: "XdY at level Z"
  const pattern = /(\d+d\d+)\s+at\s+level\s+(\d+)/gi;
  let match;

  while ((match = pattern.exec(higherLevels)) !== null) {
    const dice = match[1].toLowerCase();
    const level = match[2];
    scaling[level] = dice;
  }

  return Object.keys(scaling).length > 0 ? scaling : null;
}

/**
 * T008: Extract flavor text from description
 * Separates narrative text from mechanical notation
 * @param {string} description - Move description
 * @returns {string|null} Flavor text or null
 */
function extractFlavor(description) {
  if (!description) return null;

  // Check for [object Object] corruption
  if (description.includes('[object Object]')) {
    return null;
  }

  // Mechanical keywords that indicate end of flavor text
  const mechanicalPatterns = [
    /Make\s+(?:a\s+)?(?:\w+\s+)?(?:melee|ranged)\s+attack/i,
    /Roll\s+(?:a\s+)?(?:melee|ranged)\s+attack/i,
    /Each\s+creature/i,
    /(?:Any\s+)?creatures?\s+(?:in|within|caught)/i,
    /must\s+(?:make|succeed)/i,
    /\d+d\d+/,  // Dice notation
    /On\s+a\s+hit/i,
    /On\s+a\s+fail/i,
    /your\s+Move\s+DC/i,
    /\+\s*MOVE/i,
    /save\s+against/i,
    // Utility/reaction move patterns
    /When\s+you\s+(?:or|are)/i,  // Reaction triggers
    /When\s+(?:another\s+)?(?:a\s+)?creature/i,  // "When another creature"
    /When\s+(?:this\s+)?(?:activating|activated)/i,  // "When activating this move"
    /(?:you\s+)?(?:may\s+)?use\s+(?:a\s+)?(?:your\s+)?(?:reaction|bonus\s+action)/i,
    /impose\s+(?:dis)?advantage/i,
    /(?:has|have|gain)\s+(?:dis)?advantage/i,  // "has advantage on attack rolls"
    /(?:increase|decrease|add|reduce)\s+(?:your\s+)?(?:AC|movement|speed|HP)/i,
    /add\s+\+?\d+\s+to\s+(?:your\s+)?(?:attack|AC|damage)/i,  // "+1 to your attack rolls"
    /for\s+the\s+(?:next\s+)?(?:duration|minute|hour|round)/i,
    /until\s+(?:the\s+end|your\s+next|it\s+faints)/i,
    /Use\s+your\s+(?:action|attack\s+action)/i,
    /Use\s+this\s+reaction/i,
    /keep\s+track\s+of/i,
    /targeted\s+by\s+(?:a\s+)?(?:Move|attack)/i,
    /attack\s+rolls?/i,  // Generic "attack roll(s)" reference
    /saving\s+throw/i,
    /If\s+you\s+(?:are|have|keep)/i,  // Conditional mechanics
    /While\s+(?:worked|active|concentrat)/i,  // Status conditions
    /can\s+be\s+stacked/i  // Stacking mechanics
  ];

  // Split into sentences
  const sentences = description.match(/[^.!?]+[.!?]+/g) || [description];
  let flavorSentences = [];

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    let isMechanical = false;

    for (const pattern of mechanicalPatterns) {
      if (pattern.test(trimmed)) {
        isMechanical = true;
        break;
      }
    }

    if (isMechanical) break;
    flavorSentences.push(trimmed);
  }

  const flavor = flavorSentences.join(' ').trim();

  // Validate: flavor shouldn't contain dice or mechanical keywords
  if (!flavor || /\d+d\d+/.test(flavor) || /\+\s*MOVE/i.test(flavor)) {
    return null;
  }

  return flavor || null;
}

/**
 * T009: Extract extra effects from description
 * Captures complex effects that don't fit structured patterns
 * @param {string} description - Move description
 * @param {string} flavorText - Already extracted flavor (to exclude)
 * @returns {string|null} Extra effects or null
 */
function extractExtraEffects(description, flavorText) {
  if (!description) return null;

  // Check for [object Object] corruption
  if (description.includes('[object Object]')) {
    return null;
  }

  // Patterns for extra effects
  const extraEffectPatterns = [
    // Status on natural roll ("On a natural roll of 15" or "If the natural attack roll is 18 or more")
    /(?:on|if)\s+(?:a\s+)?(?:the\s+)?natural\s+(?:attack\s+)?roll\s+(?:of|is)\s+\d+[^.]+/gi,
    // Status on failed save by X
    /(?:targets?\s+)?(?:that\s+)?fail(?:s)?\s+(?:the\s+)?save\s+by\s+\d+[^.]+/gi,
    // Conditional damage
    /if\s+the\s+target\s+has\s+(?:already\s+)?taken\s+damage[^.]+/gi,
    // Double damage conditions
    /(?:double|twice)\s+(?:the\s+)?damage[^.]+/gi,
    // Multi-hit mechanics
    /(?:roll\s+a\s+d4|hit\s+again)[^.]+/gi,
    // AC modifications
    /AC\s+(?:is\s+)?(?:increased|decreased|reduced)[^.]+/gi,
    // Status conditions
    /(?:becomes?|is)\s+(?:burned|frozen|paralyzed|poisoned|asleep|confused)[^.]+/gi,
    // Movement effects
    /(?:push(?:ed)?|pull(?:ed)?|knock(?:ed)?)\s+(?:back\s+)?\d+\s*(?:ft|feet)/gi,
    // Healing/restoration
    /(?:half\s+)?(?:the\s+)?damage\s+(?:done\s+)?(?:is\s+)?(?:restored|healed)[^.]+/gi,
    // Concentration effects
    /concentration/gi,
    // Recoil damage
    /(?:takes?|suffers?)\s+\d+d\d+\s+(?:\w+\s+)?recoil/gi,
    // Critical hit modifications
    /critical\s+hit\s+on\s+(?:\d+|rolls?)/gi,
    // Reaction triggers (Baby-Doll Eyes, etc.)
    /When\s+you\s+(?:or\s+an\s+ally\s+)?[^.]+?(?:targeted|hit|damaged)[^.]+/gi,
    // Advantage/disadvantage
    /impose\s+(?:dis)?advantage\s+on\s+[^.]+/gi,
    /(?:has?|gains?|gets?)\s+(?:dis)?advantage\s+on\s+[^.]+/gi,
    // Movement speed modifications
    /(?:increase|decrease)\s+(?:your\s+)?(?:movement\s+)?speed\s+by\s+\d+[^.]+/gi,
    /movement\s+speed\s+(?:is\s+)?(?:increased|decreased|reduced|doubled|halved)[^.]+/gi,
    // Damage storage/counter (Bide-like)
    /keep\s+track\s+of\s+(?:all\s+)?damage[^.]+/gi,
    /striking\s+them\s+for\s+double[^.]+/gi,
    // Duration-based effects
    /for\s+the\s+duration[^.]+/gi,
    // Immunity effects
    /(?:is\s+)?immune\s+to\s+[^.]+/gi,
    // Stat modifications
    /(?:add|gain|get)\s+\+?\d+\s+to\s+(?:any\s+)?(?:attack|damage|save|check)[^.]+/gi,
    // Reaction usage
    /(?:you\s+)?may\s+use\s+(?:a\s+)?reaction\s+to\s+[^.]+/gi
  ];

  let extraEffects = [];

  for (const pattern of extraEffectPatterns) {
    const matches = description.match(pattern);
    if (matches) {
      extraEffects.push(...matches);
    }
  }

  // Remove duplicates and clean up
  extraEffects = [...new Set(extraEffects.map(e => e.trim()))];

  // Filter out anything that's already in flavor
  if (flavorText) {
    extraEffects = extraEffects.filter(e => !flavorText.includes(e));
  }

  // Look for complex Tri-Attack style status effect tables
  const statusTableMatch = description.match(
    /(?:must\s+)?roll\s+a\s+d\d+[^.]*(?::\s*)?(?:\d+\.\s*[^.]+\.?\s*)+/i
  );
  if (statusTableMatch) {
    extraEffects.push(statusTableMatch[0].trim());
  }

  if (extraEffects.length === 0) return null;

  return extraEffects.join(' ').trim() || null;
}

// ============================================================================
// Feature 029: Ambiguous Move Parsers
// ============================================================================

/**
 * T005: Parse recoil effect from move description
 * Detects recoil damage the user takes after attacking
 * @param {string} description - Move description
 * @returns {Object|null} Recoil info { fraction, percentage, type } or null
 */
function parseRecoilField(description) {
  if (!description) return null;

  const descLower = description.toLowerCase();

  // Must contain "recoil" keyword - key differentiator from save damage
  if (!descLower.includes('recoil')) {
    return null;
  }

  // Exclude false positives: "taking X damage on a failure" is save damage, not recoil
  if (/taking\s+\d+.*damage\s+on\s+a\s+fail/i.test(description)) {
    return null;
  }

  // Half recoil patterns: "taking half", "taking 1/2", "50%"
  if (/(?:taking|take)\s+(?:a\s+)?(?:half|1\/2)/i.test(description) ||
      /half\s+(?:of\s+)?(?:the\s+)?(?:total\s+)?damage.*recoil/i.test(description)) {
    return { fraction: 'half', percentage: 50, type: 'typeless' };
  }

  // Quarter recoil patterns: "taking a quarter", "taking 1/4", "25%"
  if (/(?:taking|take)\s+(?:a\s+)?(?:quarter|1\/4)/i.test(description) ||
      /quarter\s+(?:of\s+)?(?:the\s+)?(?:total\s+)?damage.*recoil/i.test(description)) {
    return { fraction: 'quarter', percentage: 25, type: 'typeless' };
  }

  // Third recoil (rare): "taking 1/3"
  if (/(?:taking|take)\s+(?:a\s+)?(?:third|1\/3)/i.test(description)) {
    return { fraction: 'third', percentage: 33, type: 'typeless' };
  }

  // Generic recoil mention without specific fraction - default to quarter
  if (/(?:recoil|serious\s+recoil)/i.test(description)) {
    return { fraction: 'quarter', percentage: 25, type: 'typeless' };
  }

  return null;
}

/**
 * T006: Parse level-based damage formula from description
 * Detects moves that use user/target level instead of dice
 * @param {string} description - Move description
 * @param {string} moveType - Move's type for damage_type
 * @returns {Object|null} Formula info { expression, damage_type, attack_type, variables } or null
 */
function parseFormulaField(description, moveType) {
  if (!description) return null;

  // Note: Use [\u0027\u2019] to match both ASCII apostrophe (') and curly apostrophe (')
  // \u0027 = ' (straight apostrophe), \u2019 = ' (right single quotation mark / curly apostrophe)
  // Pattern: "damage equal to 1d6 + the user's level" or "1d6 + user's level"
  const userLevelMatch = description.match(/(\d+d\d+)\s*\+\s*(?:the\s+)?user[\u0027\u2019]?s?\s+level/i);
  if (userLevelMatch) {
    const attackType = /melee\s+attack/i.test(description) ? 'melee' :
                       /ranged\s+attack/i.test(description) ? 'ranged' : 'melee';
    return {
      expression: `${userLevelMatch[1].toLowerCase()} + user_level`,
      damage_type: moveType?.toLowerCase() || null,
      attack_type: attackType,
      variables: ['user_level']
    };
  }

  // Pattern: "damage equal to the user's level" (no dice)
  if (/damage\s+equal\s+to\s+(?:the\s+)?user[\u0027\u2019]?s?\s+level/i.test(description)) {
    const attackType = /melee\s+attack/i.test(description) ? 'melee' :
                       /ranged\s+attack/i.test(description) ? 'ranged' : 'melee';
    return {
      expression: 'user_level',
      damage_type: moveType?.toLowerCase() || null,
      attack_type: attackType,
      variables: ['user_level']
    };
  }

  // Pattern for target's level (Foul Play style)
  const targetLevelMatch = description.match(/(\d+d\d+)\s*\+\s*(?:the\s+)?target[\u0027\u2019]?s?\s+level/i);
  if (targetLevelMatch) {
    const attackType = /melee\s+attack/i.test(description) ? 'melee' :
                       /ranged\s+attack/i.test(description) ? 'ranged' : 'melee';
    return {
      expression: `${targetLevelMatch[1].toLowerCase()} + target_level`,
      damage_type: moveType?.toLowerCase() || null,
      attack_type: attackType,
      variables: ['target_level']
    };
  }

  return null;
}

/**
 * T007: Parse OHKO move mechanics from description
 * Detects instant knockout moves that succeed on natural 20
 * Real OHKO moves: Fissure, Guillotine, Horn Drill, Sheer Cold
 * @param {string} description - Move description
 * @returns {Object|null} OHKO info { success_roll, level_restriction, immune_types, effect } or null
 */
function parseOHKOField(description) {
  if (!description) return null;

  const descLower = description.toLowerCase();

  // Pattern: "On a 20, the target [effect]" - must be targeting something
  // Must have d20 roll with specific success on 20 AND target a creature
  if (!/roll\s+a\s+d20/i.test(description) && !/on\s+a\s+20/i.test(description)) {
    return null;
  }

  // Must be targeting a creature (not self-effect)
  // Patterns: "choose a target", "target in range", "target creature", "a target creature"
  const hasTargetPattern = /choose\s+a\s+target/i.test(description) ||
                          /target\s+in\s+range/i.test(description) ||
                          /(?:a\s+)?target\s+creature/i.test(description) ||
                          /the\s+(?:head|body)\s+of\s+(?:a\s+)?target/i.test(description) ||
                          /through\s+(?:a\s+)?target\s+creature/i.test(description);
  if (!hasTargetPattern) {
    return null;
  }

  // Must mention true OHKO effect patterns:
  // - "falls into the crack" (Fissure)
  // - "vanishes into the abyss" (Fissure variant)
  // - "instantly cause the creature to faint" (Guillotine)
  // - "immediately faints" (Horn Drill)
  // - "the target faints" after "On a 20" (Sheer Cold)
  // - NOT general "faint" (could be self-faint prevention like Endure)
  // - NOT "explosion" effects
  const ohkoPatterns = [
    /on\s+a\s+20.*?(?:the\s+)?target\s+(?:falls?\s+into|vanish|is\s+instantly)/i,
    /falls?\s+into\s+(?:the\s+)?(?:crack|abyss)/i,
    /vanish(?:es)?\s+into\s+(?:the\s+)?abyss/i,
    /one[- ]?hit\s+(?:ko|knock\s*out)/i,
    /target\s+(?:is\s+)?instantly\s+(?:knocked?\s+out|defeated|ko)/i,
    // OHKO with faint pattern: "On a 20, [effect] faint"
    /on\s+a\s+20.*?(?:instantly\s+)?(?:cause|faint|immediately)/i,
    /on\s+a\s+20.*?the\s+(?:creature|target)\s+(?:is\s+)?(?:impaled\s+and\s+)?(?:immediately\s+)?faints/i
  ];

  const hasOHKOPattern = ohkoPatterns.some(pattern => pattern.test(description));
  if (!hasOHKOPattern) {
    return null;
  }

  // Exclude self-targeted or defensive moves
  if (/otherwise\s+cause\s+you\s+to\s+faint/i.test(description)) {
    return null; // Endure-type move
  }
  if (/you\s+(?:faint|are\s+knocked\s+out)/i.test(description)) {
    return null; // Self-KO moves like Explosion
  }
  // Exclude AOE OHKO effects (Explosion) - these are AOE damage, not single-target OHKO
  if (/all\s+creatures\s+within/i.test(description) && /explosion/i.test(description)) {
    return null;
  }

  const ohko = {
    success_roll: 20,
    level_restriction: null,
    immune_types: [],
    effect: 'Instant KO on success'
  };

  // Check for level restriction: "target's level is 10 more than your own"
  const levelMatch = description.match(/target'?s?\s+level\s+is\s+(\d+)\s+more\s+than/i);
  if (levelMatch) {
    ohko.level_restriction = {
      operator: 'lte',
      compare: 'target_level',
      offset: parseInt(levelMatch[1], 10)
    };
  }

  // Check for type immunities
  if (/flying\s+creature/i.test(description) || /targeting\s+a\s+flying/i.test(description)) {
    ohko.immune_types.push('flying');
  }

  // Extract effect description
  if (/falls?\s+into\s+(?:the\s+)?crack/i.test(description)) {
    ohko.effect = 'Target falls into crack and faints';
  } else if (/vanish/i.test(description)) {
    ohko.effect = 'Target vanishes into the abyss';
  }

  return ohko;
}

/**
 * T008: Parse two-turn move structure from description
 * Detects moves that span multiple turns with charging/invulnerability
 * @param {string} description - Move description
 * @param {string} duration - Move's duration field
 * @returns {Object|null} Two-turn info or null
 */
function parseTurnsField(description, duration) {
  if (!description) return null;

  const descLower = description.toLowerCase();

  // Check for charge/two-turn indicators
  const isChargeDuration = duration && /charge|2\s*round|1\s*round/i.test(duration);
  const hasChargeDescription = /(?:first|turn\s+1|on\s+your\s+next\s+turn|prepare|charge)/i.test(description);

  if (!isChargeDuration && !hasChargeDescription) {
    return null;
  }

  // Determine action type and invulnerability
  let turn1Action = 'charge';
  let invulnerable = false;
  let vulnerableTo = [];
  let acBonus = 0;
  let weatherSkip = null;

  // Burrow (Dig)
  if (/burrow|underground|dig/i.test(description)) {
    turn1Action = 'burrow';
    invulnerable = true;
    vulnerableTo = ['earthquake', 'magnitude', 'fissure'];
  }
  // Fly/Bounce
  else if (/fly|flying|bounce|leap.*air|dive.*creature/i.test(description)) {
    turn1Action = 'fly';
    invulnerable = true;
    vulnerableTo = ['thunder', 'sky-uppercut', 'smack-down', 'hurricane'];
  }
  // Dive (underwater)
  else if (/dive|underwater|beneath.*water/i.test(description)) {
    turn1Action = 'dive';
    invulnerable = true;
    vulnerableTo = ['surf', 'whirlpool'];
  }
  // Skull Bash (+AC)
  else if (/skull\s*bash|tucking|head/i.test(description) && /\+\s*(\d+)\s*(?:to\s+)?(?:your\s+)?ac/i.test(description)) {
    turn1Action = 'charge';
    const acMatch = description.match(/\+\s*(\d+)\s*(?:to\s+)?(?:your\s+)?ac/i);
    if (acMatch) {
      acBonus = parseInt(acMatch[1], 10);
    }
  }
  // Solar Beam (weather skip)
  else if (/solar|sunlight|gathering.*sun/i.test(description)) {
    turn1Action = 'charge';
    weatherSkip = 'sunny';
  }

  return {
    count: 2,
    turn1: {
      action: turn1Action,
      invulnerable: invulnerable,
      vulnerable_to: vulnerableTo,
      ac_bonus: acBonus,
      effect: null
    },
    turn2: {
      action: 'attack',
      damage: null
    },
    weather_skip: weatherSkip,
    interruptable: true
  };
}

/**
 * T009: Parse variable hit count from description
 * Detects multi-hit moves with rolled hit count
 * @param {string} description - Move description
 * @returns {Object|null} Hit roll info { dice, min_hits, max_hits, modifier, until_miss } or null
 */
function parseHitRollField(description) {
  if (!description) return null;

  // Pattern: "rolling 1d4 on a hit" for number of strikes
  const d4HitMatch = description.match(/rolling\s+(\d+d\d+).*(?:number|times|strikes|projectile)/i);
  if (d4HitMatch) {
    const diceMatch = d4HitMatch[1].match(/(\d+)d(\d+)/);
    if (diceMatch) {
      const count = parseInt(diceMatch[1], 10);
      const sides = parseInt(diceMatch[2], 10);
      return {
        dice: d4HitMatch[1].toLowerCase(),
        min_hits: count,
        max_hits: count * sides,
        modifier: 0,
        until_miss: false
      };
    }
  }

  // Pattern: "hits 2-5 times" or "strikes 2 to 5 times"
  const rangeMatch = description.match(/(?:hits?|strikes?)\s+(\d+)[-\s]+(?:to\s+)?(\d+)\s+times/i);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1], 10);
    const max = parseInt(rangeMatch[2], 10);
    return {
      dice: `1d${max - min + 1}`,
      min_hits: min,
      max_hits: max,
      modifier: min - 1,
      until_miss: false
    };
  }

  // Pattern: "continue until miss"
  if (/continue.*until.*miss/i.test(description)) {
    return {
      dice: null,
      min_hits: 1,
      max_hits: 10,
      modifier: 0,
      until_miss: true
    };
  }

  return null;
}

/**
 * T010: Parse conditional damage scaling from description
 * Detects HP-based damage multipliers (Flail, Reversal, Water Spout)
 * @param {string} description - Move description
 * @returns {Object|null} Conditional info { type, thresholds, inverse } or null
 */
function parseConditionalField(description) {
  if (!description) return null;

  const descLower = description.toLowerCase();

  // Pattern: "below 50%...double" and "10% or below...triple" (Flail/Reversal)
  if (/below\s+\d+%.*(?:double|triple)/i.test(description) ||
      /\d+%\s+or\s+below.*(?:double|triple)/i.test(description)) {

    const thresholds = [];

    // Extract 50% threshold
    const fiftyMatch = description.match(/below\s+50%.*?(double|triple)/i);
    if (fiftyMatch) {
      thresholds.push({
        hp_percent: 50,
        multiplier: fiftyMatch[1].toLowerCase() === 'double' ? 2 : 3,
        effect: `${fiftyMatch[1]} damage below 50% HP`
      });
    }

    // Extract 10% threshold
    const tenMatch = description.match(/(?:10%|at\s+10%)\s+or\s+below.*?(double|triple)/i);
    if (tenMatch) {
      thresholds.push({
        hp_percent: 10,
        multiplier: tenMatch[1].toLowerCase() === 'double' ? 2 : 3,
        effect: `${tenMatch[1]} damage at 10% HP or below`
      });
    }

    if (thresholds.length > 0) {
      // Sort by hp_percent ascending (lowest first for proper checking order)
      thresholds.sort((a, b) => a.hp_percent - b.hp_percent);
      return {
        type: 'user_hp_scaling',
        thresholds: thresholds,
        inverse: false
      };
    }
  }

  // Pattern: Water Spout/Eruption style - more HP = more damage (inverse)
  if (/(?:more|higher)\s+(?:hp|health).*(?:more|greater)\s+damage/i.test(description) ||
      /damage\s+(?:decreases?|reduces?|scales?).*(?:lower|less)\s+(?:hp|health)/i.test(description)) {
    return {
      type: 'user_hp_scaling',
      thresholds: [],
      inverse: true
    };
  }

  return null;
}

/**
 * T011: Parse stat override from description
 * Detects moves that use non-standard stats (Foul Play uses target's level)
 * @param {string} description - Move description
 * @returns {Object|null} Stat override info { use, instead_of, context } or null
 */
function parseStatOverrideField(description) {
  if (!description) return null;

  // Pattern: "uses the target's level" or "based on target's level"
  if (/(?:uses?|based\s+on)\s+(?:the\s+)?target'?s?\s+level/i.test(description)) {
    return {
      use: 'target_level',
      instead_of: 'user_level',
      context: 'formula'
    };
  }

  // Pattern: "uses the target's attack" or "based on target's attack stat"
  if (/(?:uses?|based\s+on)\s+(?:the\s+)?target'?s?\s+(?:attack|str)/i.test(description)) {
    return {
      use: 'target_attack',
      instead_of: 'user_attack',
      context: 'damage'
    };
  }

  // Pattern: Endeavor - "target HP is set equal to user's current HP"
  if (/target'?s?\s+(?:hp|health|hit\s+points?).*(?:set|equal|reduced)\s+to.*user'?s?/i.test(description) ||
      /set.*target'?s?\s+(?:hp|health).*(?:equal|same).*user/i.test(description)) {
    return {
      use: 'user_current_hp',
      instead_of: 'damage',
      context: 'hp_set'
    };
  }

  return null;
}

// ============================================================================
// End Feature 029 Parsers
// ============================================================================

/**
 * T010: Process all moves with extraction functions
 * @param {Array} moves - Array of move objects
 * @returns {Array} Processed moves with new fields
 */
function processMoves(moves) {
  const processed = [];

  for (const move of moves) {
    const processedMove = { ...move };

    try {
      // Extract damage info (T012)
      const damageInfo = parseDamageInfo(move.description, move.type, move.range);
      processedMove.damage = damageInfo;

      // Extract save info (T013)
      const saveInfo = parseSaveInfo(move.description);
      processedMove.save = saveInfo;

      // Extract flavor text (T019)
      const flavor = extractFlavor(move.description);
      processedMove.flavor = flavor;

      // Extract extra effects (T020)
      const extraEffects = extractExtraEffects(move.description, flavor);
      processedMove.extra_effects = extraEffects;

      // Extract scaling (T024)
      const scaling = parseScaling(move.higherLevels);
      processedMove.scaling = scaling;

      // Feature 029: Extract ambiguous move fields
      // Recoil (T005)
      const recoil = parseRecoilField(move.description);
      processedMove.recoil = recoil;

      // Formula - level-based damage (T006)
      const formula = parseFormulaField(move.description, move.type);
      processedMove.formula = formula;

      // OHKO (T007)
      const ohko = parseOHKOField(move.description);
      processedMove.ohko = ohko;

      // Two-turn moves (T008)
      const turns = parseTurnsField(move.description, move.duration);
      processedMove.turns = turns;

      // Variable hits (T009)
      const hitRoll = parseHitRollField(move.description);
      processedMove.hit_roll = hitRoll;

      // Conditional damage (T010)
      const conditional = parseConditionalField(move.description);
      processedMove.conditional = conditional;

      // Stat override (T011)
      const statOverride = parseStatOverrideField(move.description);
      processedMove.stat_override = statOverride;

      // Validation warnings
      validateMove(move.id, processedMove);

      processedCount++;

      if (VERBOSE) {
        logMoveDetails(processedMove);
      }

    } catch (err) {
      errorCount++;
      addWarning(move.id, 'error', `Processing error: ${err.message}`);
      processed.push(move); // Keep original on error
      continue;
    }

    processed.push(processedMove);
  }

  return processed;
}

/**
 * Validate extracted data for a move
 * @param {string} moveId - Move identifier
 * @param {Object} move - Processed move object
 */
function validateMove(moveId, move) {
  const desc = move.description;

  // T014: Validate damage.dice pattern
  if (move.damage?.dice && !DICE_PATTERN.test(move.damage.dice)) {
    addWarning(moveId, 'validation', `Invalid dice pattern: ${move.damage.dice}`, desc);
  }

  // T015: Validate damage.attack_type
  if (move.damage?.attack_type && !VALID_ATTACK_TYPES.includes(move.damage.attack_type)) {
    addWarning(moveId, 'validation', `Invalid attack_type: ${move.damage.attack_type}`, desc);
  }

  // T016: Validate save.type
  if (move.save?.type && !VALID_SAVE_TYPES.includes(move.save.type)) {
    addWarning(moveId, 'validation', `Invalid save type: ${move.save.type}`, desc);
  }

  // T017: Warn about ambiguous patterns
  if (move.description?.includes('[object Object]')) {
    addWarning(moveId, 'ambiguous', 'Description contains [object Object]', desc);
  }

  // T21: Validate flavor has no dice
  if (move.flavor && /\d+d\d+/.test(move.flavor)) {
    addWarning(moveId, 'validation', 'Flavor text contains dice notation', desc);
  }

  // T22: Validate flavor has no mechanical keywords (specific patterns, not just words)
  // "damage" alone is fine in narrative context like "embrace the damage"
  // Only warn on truly mechanical patterns
  const mechanicalFlavorPatterns = [
    /\d+d\d+\s+\w*\s*damage/i,      // "1d6 fire damage"
    /takes?\s+\d+\s*damage/i,        // "takes 5 damage"
    /damage\s+on\s+a\s+(?:hit|fail)/i, // "damage on a hit"
    /(?:DEX|STR|CON|INT|WIS|CHA)\s+save/i,  // "DEX save"
    /save\s+(?:against|DC)/i,        // "save against", "save DC"
    /attack\s+roll/i                 // "attack roll"
  ];
  if (move.flavor && mechanicalFlavorPatterns.some(p => p.test(move.flavor))) {
    addWarning(moveId, 'validation', 'Flavor text contains mechanical keywords', desc);
  }

  // T25: Validate scaling keys are numeric
  if (move.scaling) {
    for (const key of Object.keys(move.scaling)) {
      if (isNaN(parseInt(key, 10))) {
        addWarning(moveId, 'validation', `Non-numeric scaling level: ${key}`, desc);
      }
    }
  }

  // T26: Validate scaling values match dice pattern
  if (move.scaling) {
    for (const [level, dice] of Object.entries(move.scaling)) {
      if (!DICE_PATTERN.test(dice)) {
        addWarning(moveId, 'validation', `Invalid scaling dice at level ${level}: ${dice}`, desc);
      }
    }
  }

  // Check for damage without attack_type
  if (move.damage?.dice && !move.damage.attack_type) {
    addWarning(moveId, 'incomplete', 'Has damage but no attack_type detected', desc);
  }

  // Feature 029: Validate new ambiguous move fields (T012)

  // Validate recoil field
  if (move.recoil) {
    const validFractions = ['quarter', 'third', 'half'];
    if (!validFractions.includes(move.recoil.fraction)) {
      addWarning(moveId, 'validation', `Invalid recoil fraction: ${move.recoil.fraction}`, desc);
    }
    if (move.recoil.type !== 'typeless') {
      addWarning(moveId, 'validation', `Unexpected recoil type: ${move.recoil.type}`, desc);
    }
  }

  // Validate formula field
  if (move.formula) {
    const validVariables = ['user_level', 'target_level', 'weight_diff'];
    for (const v of move.formula.variables || []) {
      if (!validVariables.includes(v)) {
        addWarning(moveId, 'validation', `Invalid formula variable: ${v}`, desc);
      }
    }
  }

  // Validate OHKO field
  if (move.ohko) {
    if (move.ohko.success_roll !== 20) {
      addWarning(moveId, 'validation', `Unusual OHKO success roll: ${move.ohko.success_roll}`, desc);
    }
  }

  // Validate turns field
  if (move.turns) {
    if (move.turns.count !== 2) {
      addWarning(moveId, 'validation', `Unexpected turn count: ${move.turns.count}`, desc);
    }
    const validActions = ['charge', 'burrow', 'fly', 'dive', 'vanish', 'attack'];
    if (!validActions.includes(move.turns.turn1?.action)) {
      addWarning(moveId, 'validation', `Invalid turn1 action: ${move.turns.turn1?.action}`, desc);
    }
  }

  // Validate hit_roll field
  if (move.hit_roll) {
    if (move.hit_roll.min_hits < 1) {
      addWarning(moveId, 'validation', `Invalid min_hits: ${move.hit_roll.min_hits}`, desc);
    }
    if (move.hit_roll.max_hits < move.hit_roll.min_hits) {
      addWarning(moveId, 'validation', `max_hits (${move.hit_roll.max_hits}) < min_hits (${move.hit_roll.min_hits})`, desc);
    }
  }

  // Validate conditional field
  if (move.conditional) {
    const validTypes = ['user_hp_scaling', 'target_hp_scaling'];
    if (!validTypes.includes(move.conditional.type)) {
      addWarning(moveId, 'validation', `Invalid conditional type: ${move.conditional.type}`, desc);
    }
  }

  // Validate stat_override field
  if (move.stat_override) {
    const validContexts = ['formula', 'damage', 'hp_set'];
    if (!validContexts.includes(move.stat_override.context)) {
      addWarning(moveId, 'validation', `Invalid stat_override context: ${move.stat_override.context}`, desc);
    }
  }
}

/**
 * Add a warning for tracking
 * @param {string} moveId - Move identifier
 * @param {string} type - Warning type
 * @param {string} message - Warning message
 * @param {string} [description] - Move description for reference
 */
function addWarning(moveId, type, message, description) {
  const warning = { moveId, type, message };
  if (description) {
    warning.description = description;
  }
  warnings.push(warning);
  warningCount++;
  if (VERBOSE) {
    console.log(`[WARN] ${moveId} - ${message}`);
  }
}

/**
 * Log move details in verbose mode
 * @param {Object} move - Processed move
 */
function logMoveDetails(move) {
  console.log(`[INFO] Processed: ${move.id}`);
  if (move.damage) {
    console.log(`  - damage: ${move.damage.dice}${move.damage.modifier ? ' + ' + move.damage.modifier : ''} ${move.damage.damage_type || ''} (${move.damage.attack_type || 'unknown'})`);
  } else {
    console.log('  - damage: none');
  }
  if (move.save) {
    console.log(`  - save: ${move.save.type} (fail: ${move.save.on_fail}, success: ${move.save.on_success || 'none'})`);
  } else {
    console.log('  - save: none');
  }
  if (move.flavor) {
    console.log(`  - flavor: "${move.flavor.substring(0, 60)}${move.flavor.length > 60 ? '...' : ''}"`);
  }
  if (move.extra_effects) {
    console.log(`  - extra_effects: "${move.extra_effects.substring(0, 60)}${move.extra_effects.length > 60 ? '...' : ''}"`);
  }
  if (move.scaling) {
    console.log(`  - scaling: ${JSON.stringify(move.scaling)}`);
  }
  console.log('');
}

/**
 * T028: Write processed moves to JSON file
 * @param {Array} moves - Processed moves
 * @param {string} outputPath - Output file path
 */
function writeOutput(moves, outputPath) {
  if (DRY_RUN) {
    console.log('\n[DRY RUN] Would write to:', outputPath);
    console.log(`[DRY RUN] ${moves.length} moves would be written`);
    return;
  }

  fs.writeFileSync(outputPath, JSON.stringify(moves, null, 2));
  console.log(`\nOutput written to: ${outputPath}`);
}

/**
 * T030: Write warnings to JSON file
 * @param {Array} warningList - List of warnings
 * @param {string} outputPath - Output file path
 */
function writeWarnings(warningList, outputPath) {
  if (warningList.length === 0) {
    console.log('No warnings to write.');
    return;
  }

  if (DRY_RUN) {
    console.log(`[DRY RUN] Would write ${warningList.length} warnings to: ${outputPath}`);
    return;
  }

  fs.writeFileSync(outputPath, JSON.stringify(warningList, null, 2));
  console.log(`Warnings saved to: ${outputPath}`);
}

/**
 * T029: Print summary statistics
 */
function printSummary() {
  console.log('\nSummary');
  console.log('=======');
  console.log(`Total moves processed: ${processedCount}`);
  console.log(`Warnings: ${warningCount}`);
  console.log(`Errors: ${errorCount}`);

  if (warnings.length > 0) {
    // Group warnings by type
    const byType = {};
    for (const w of warnings) {
      byType[w.type] = (byType[w.type] || 0) + 1;
    }
    console.log('\nWarnings by type:');
    for (const [type, count] of Object.entries(byType)) {
      console.log(`  ${type}: ${count}`);
    }
  }
}

/**
 * Main entry point
 */
function main() {
  console.log('Move Data Extraction');
  console.log('====================');

  if (DRY_RUN) {
    console.log('[DRY RUN MODE - No files will be modified]\n');
  }

  // Load moves
  console.log(`Loading moves from: ${MOVES_PATH}`);
  const movesData = fs.readFileSync(MOVES_PATH, 'utf8');
  const moves = JSON.parse(movesData);
  console.log(`Found ${moves.length} moves to process\n`);

  // Process all moves
  console.log('Processing moves...\n');
  const processedMoves = processMoves(moves);

  // Print summary
  printSummary();

  // Write output
  writeOutput(processedMoves, MOVES_PATH);

  // Write warnings
  writeWarnings(warnings, WARNINGS_PATH);

  console.log('\nExtraction complete!');

  // Exit with error code if there were errors
  if (errorCount > 0) {
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

// Export for testing
module.exports = {
  parseAttackType,
  parseSaveInfo,
  parseDamageInfo,
  parseScaling,
  extractFlavor,
  extractExtraEffects,
  processMoves,
  // Feature 029 exports
  parseRecoilField,
  parseFormulaField,
  parseOHKOField,
  parseTurnsField,
  parseHitRollField,
  parseConditionalField,
  parseStatOverrideField
};
