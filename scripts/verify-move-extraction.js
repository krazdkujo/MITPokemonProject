#!/usr/bin/env node
/**
 * Move Extraction Verification Script
 * Spot-checks specific moves to verify extraction accuracy
 *
 * Usage:
 *   node scripts/verify-move-extraction.js --move tri-attack
 *   node scripts/verify-move-extraction.js --move absorb
 *   node scripts/verify-move-extraction.js --all
 *
 * Feature: 028-move-data-extraction
 */

const fs = require('fs');
const path = require('path');

const MOVES_PATH = path.join(__dirname, '../Source/moves/moves.json');

// CLI arguments
const args = process.argv.slice(2);
const moveFlag = args.indexOf('--move');
const moveId = moveFlag !== -1 ? args[moveFlag + 1] : null;
const showAll = args.includes('--all');
const showStats = args.includes('--stats');

/**
 * Load moves from JSON file
 */
function loadMoves() {
  const data = fs.readFileSync(MOVES_PATH, 'utf8');
  return JSON.parse(data);
}

/**
 * Display detailed move information
 */
function displayMove(move) {
  console.log(`\nMove: ${move.name} (${move.id})`);
  console.log('='.repeat(40));
  console.log(`Type: ${move.type}`);
  console.log(`Power: ${Array.isArray(move.power) ? move.power.join(', ') : move.power}`);
  console.log(`Range: ${move.range}`);
  console.log(`Time: ${move.time}`);
  console.log(`PP: ${move.pp}`);
  console.log('');

  console.log('DESCRIPTION (original):');
  console.log(`  "${move.description}"`);
  console.log('');

  if (move.higherLevels) {
    console.log('HIGHER LEVELS (original):');
    console.log(`  "${move.higherLevels}"`);
    console.log('');
  }

  console.log('EXTRACTED FIELDS:');

  if (move.damage) {
    console.log('  damage:');
    console.log(`    dice: ${move.damage.dice}`);
    console.log(`    modifier: ${move.damage.modifier || 'none'}`);
    console.log(`    damage_type: ${move.damage.damage_type || 'none'}`);
    console.log(`    attack_type: ${move.damage.attack_type || 'unknown'}`);
  } else {
    console.log('  damage: null (non-damaging move)');
  }

  if (move.save) {
    console.log('  save:');
    console.log(`    type: ${move.save.type}`);
    console.log(`    dc: ${move.save.dc}`);
    console.log(`    on_fail: ${move.save.on_fail}`);
    console.log(`    on_success: ${move.save.on_success || 'none'}`);
  } else {
    console.log('  save: null (no saving throw)');
  }

  if (move.flavor) {
    console.log(`  flavor: "${move.flavor}"`);
  } else {
    console.log('  flavor: null');
  }

  if (move.extra_effects) {
    console.log(`  extra_effects: "${move.extra_effects}"`);
  } else {
    console.log('  extra_effects: null');
  }

  if (move.scaling) {
    console.log('  scaling:');
    for (const [level, dice] of Object.entries(move.scaling)) {
      console.log(`    level ${level}: ${dice}`);
    }
  } else {
    console.log('  scaling: null');
  }

  console.log('');
}

/**
 * Show statistics about extracted fields
 */
function showStatistics(moves) {
  const stats = {
    total: moves.length,
    withDamage: 0,
    withSave: 0,
    withFlavor: 0,
    withExtraEffects: 0,
    withScaling: 0,
    attackTypes: { melee: 0, ranged: 0, save: 0, auto: 0, unknown: 0 },
    saveTypes: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 }
  };

  for (const move of moves) {
    if (move.damage) {
      stats.withDamage++;
      const at = move.damage.attack_type || 'unknown';
      stats.attackTypes[at] = (stats.attackTypes[at] || 0) + 1;
    }
    if (move.save) {
      stats.withSave++;
      stats.saveTypes[move.save.type]++;
    }
    if (move.flavor) stats.withFlavor++;
    if (move.extra_effects) stats.withExtraEffects++;
    if (move.scaling) stats.withScaling++;
  }

  console.log('\nExtraction Statistics');
  console.log('=====================');
  console.log(`Total moves: ${stats.total}`);
  console.log(`With damage: ${stats.withDamage} (${((stats.withDamage / stats.total) * 100).toFixed(1)}%)`);
  console.log(`With save: ${stats.withSave} (${((stats.withSave / stats.total) * 100).toFixed(1)}%)`);
  console.log(`With flavor: ${stats.withFlavor} (${((stats.withFlavor / stats.total) * 100).toFixed(1)}%)`);
  console.log(`With extra_effects: ${stats.withExtraEffects} (${((stats.withExtraEffects / stats.total) * 100).toFixed(1)}%)`);
  console.log(`With scaling: ${stats.withScaling} (${((stats.withScaling / stats.total) * 100).toFixed(1)}%)`);

  console.log('\nAttack Types:');
  for (const [type, count] of Object.entries(stats.attackTypes)) {
    if (count > 0) {
      console.log(`  ${type}: ${count}`);
    }
  }

  console.log('\nSave Types:');
  for (const [type, count] of Object.entries(stats.saveTypes)) {
    if (count > 0) {
      console.log(`  ${type}: ${count}`);
    }
  }
}

/**
 * Test specific moves mentioned in the spec
 */
function runTestCases(moves) {
  const testCases = [
    { id: 'absorb', expectDamage: true, expectAttackType: 'melee', expectScaling: true },
    { id: 'acid', expectDamage: true, expectAttackType: 'save', expectSave: true, expectSaveType: 'DEX' },
    { id: 'aerial-ace', expectDamage: true, expectAttackType: 'auto' },
    { id: 'agility', expectDamage: false },
    { id: 'tri-attack', expectDamage: true, expectSave: true, expectExtraEffects: true, expectScaling: true }
  ];

  console.log('\nTest Cases');
  console.log('==========');

  let passed = 0;
  let failed = 0;

  for (const test of testCases) {
    const move = moves.find(m => m.id === test.id);
    if (!move) {
      console.log(`[SKIP] ${test.id} - not found`);
      continue;
    }

    let testPassed = true;
    const failures = [];

    if (test.expectDamage !== undefined) {
      const hasDamage = move.damage !== null;
      if (hasDamage !== test.expectDamage) {
        testPassed = false;
        failures.push(`damage: expected ${test.expectDamage}, got ${hasDamage}`);
      }
    }

    if (test.expectAttackType) {
      if (move.damage?.attack_type !== test.expectAttackType) {
        testPassed = false;
        failures.push(`attack_type: expected ${test.expectAttackType}, got ${move.damage?.attack_type}`);
      }
    }

    if (test.expectSave !== undefined) {
      const hasSave = move.save !== null;
      if (hasSave !== test.expectSave) {
        testPassed = false;
        failures.push(`save: expected ${test.expectSave}, got ${hasSave}`);
      }
    }

    if (test.expectSaveType) {
      if (move.save?.type !== test.expectSaveType) {
        testPassed = false;
        failures.push(`save.type: expected ${test.expectSaveType}, got ${move.save?.type}`);
      }
    }

    if (test.expectScaling !== undefined) {
      const hasScaling = move.scaling !== null;
      if (hasScaling !== test.expectScaling) {
        testPassed = false;
        failures.push(`scaling: expected ${test.expectScaling}, got ${hasScaling}`);
      }
    }

    if (test.expectExtraEffects !== undefined) {
      const hasExtra = move.extra_effects !== null;
      if (hasExtra !== test.expectExtraEffects) {
        testPassed = false;
        failures.push(`extra_effects: expected ${test.expectExtraEffects}, got ${hasExtra}`);
      }
    }

    if (testPassed) {
      console.log(`[PASS] ${test.id}`);
      passed++;
    } else {
      console.log(`[FAIL] ${test.id}`);
      for (const f of failures) {
        console.log(`       - ${f}`);
      }
      failed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

/**
 * Main entry point
 */
function main() {
  const moves = loadMoves();

  if (moveId) {
    // Show specific move
    const move = moves.find(m => m.id === moveId || m.name.toLowerCase() === moveId.toLowerCase());
    if (move) {
      displayMove(move);
    } else {
      console.error(`Move not found: ${moveId}`);
      process.exit(1);
    }
  } else if (showStats) {
    showStatistics(moves);
  } else if (showAll) {
    for (const move of moves.slice(0, 20)) { // First 20 for brevity
      displayMove(move);
    }
    console.log(`... and ${moves.length - 20} more moves`);
  } else {
    // Run test cases by default
    const success = runTestCases(moves);
    showStatistics(moves);
    process.exit(success ? 0 : 1);
  }
}

main();
