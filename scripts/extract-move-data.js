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
const VALID_ATTACK_TYPES = ['melee', 'ranged', 'save', 'auto'];
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
 * Detects melee/ranged/save/auto from description patterns
 * @param {string} description - Move description
 * @returns {string|null} Attack type or null
 */
function parseAttackType(description) {
  if (!description) return null;
  const desc = description.toLowerCase();

  // Auto-hit (guaranteed to hit / automatically hits/deals)
  if (/(?:is\s+)?guaranteed\s+to\s+hit/i.test(description)) {
    return 'auto';
  }
  if (/automatically\s+(?:hits?|deals?)/i.test(description)) {
    return 'auto';
  }
  if (/inflict\s+\d+d\d+.*?damage/i.test(description) &&
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
 * @returns {Object|null} Damage info { dice, modifier, damage_type, attack_type } or null
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

  return {
    dice,
    modifier,
    damage_type: damage_type || null,
    attack_type
  };
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
    /Make\s+a\s+(?:melee|ranged)\s+attack/i,
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
    /(?:you\s+)?(?:may\s+)?use\s+(?:a\s+)?(?:your\s+)?(?:reaction|bonus\s+action)/i,
    /impose\s+(?:dis)?advantage/i,
    /(?:increase|decrease|add|reduce)\s+(?:your\s+)?(?:AC|movement|speed|HP)/i,
    /for\s+the\s+duration/i,
    /until\s+(?:the\s+end|your\s+next|it\s+faints)/i,
    /Use\s+your\s+(?:action|attack\s+action)/i,
    /keep\s+track\s+of/i,
    /targeted\s+by\s+(?:a\s+)?(?:Move|attack)/i
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
  // T014: Validate damage.dice pattern
  if (move.damage?.dice && !DICE_PATTERN.test(move.damage.dice)) {
    addWarning(moveId, 'validation', `Invalid dice pattern: ${move.damage.dice}`);
  }

  // T015: Validate damage.attack_type
  if (move.damage?.attack_type && !VALID_ATTACK_TYPES.includes(move.damage.attack_type)) {
    addWarning(moveId, 'validation', `Invalid attack_type: ${move.damage.attack_type}`);
  }

  // T016: Validate save.type
  if (move.save?.type && !VALID_SAVE_TYPES.includes(move.save.type)) {
    addWarning(moveId, 'validation', `Invalid save type: ${move.save.type}`);
  }

  // T017: Warn about ambiguous patterns
  if (move.description?.includes('[object Object]')) {
    addWarning(moveId, 'ambiguous', 'Description contains [object Object]');
  }

  // T21: Validate flavor has no dice
  if (move.flavor && /\d+d\d+/.test(move.flavor)) {
    addWarning(moveId, 'validation', 'Flavor text contains dice notation');
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
    addWarning(moveId, 'validation', 'Flavor text contains mechanical keywords');
  }

  // T25: Validate scaling keys are numeric
  if (move.scaling) {
    for (const key of Object.keys(move.scaling)) {
      if (isNaN(parseInt(key, 10))) {
        addWarning(moveId, 'validation', `Non-numeric scaling level: ${key}`);
      }
    }
  }

  // T26: Validate scaling values match dice pattern
  if (move.scaling) {
    for (const [level, dice] of Object.entries(move.scaling)) {
      if (!DICE_PATTERN.test(dice)) {
        addWarning(moveId, 'validation', `Invalid scaling dice at level ${level}: ${dice}`);
      }
    }
  }

  // Check for damage without attack_type
  if (move.damage?.dice && !move.damage.attack_type) {
    addWarning(moveId, 'incomplete', 'Has damage but no attack_type detected');
  }
}

/**
 * Add a warning for tracking
 * @param {string} moveId - Move identifier
 * @param {string} type - Warning type
 * @param {string} message - Warning message
 */
function addWarning(moveId, type, message) {
  warnings.push({ moveId, type, message });
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
  processMoves
};
