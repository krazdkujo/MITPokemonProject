/**
 * Unit Tests for Feature 029: Ambiguous Move Implementation
 *
 * Tests cover:
 * - US1: Recoil Damage
 * - US2: OHKO Moves
 * - US3: Level-Based Damage (Formula Moves)
 * - US6: Conditional Damage Scaling
 *
 * Run with: node tests/ambiguousMoves.test.js
 */

import { createSimulation, runToCompletion } from '../lib/combatSimulator.js';
import {
  checkOHKOLevelRestriction,
  checkOHKOTypeImmunity,
  calculateConditionalMultiplier,
  isChargingMove,
  initiateTwoTurnMove,
  checkInvulnerability
} from '../lib/battleEngine.js';
import { evaluateFormula, evaluateFormulaWithRng } from '../lib/formulaEvaluator.js';
import { getMoveById } from '../lib/pokemonData.js';

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, fn) {
  try {
    fn();
    results.passed++;
    results.tests.push({ name, status: 'PASS' });
    console.log(`  [PASS] ${name}`);
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'FAIL', error: error.message });
    console.log(`  [FAIL] ${name}`);
    console.log(`         ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertInRange(value, min, max, message) {
  if (value < min || value > max) {
    throw new Error(message || `Expected ${value} to be between ${min} and ${max}`);
  }
}

// ============================================
// US1: Recoil Damage Tests
// ============================================
console.log('\n=== US1: Recoil Damage Tests ===');

test('Recoil field exists on Double-Edge', () => {
  const move = getMoveById('double-edge');
  assert(move, 'Double-Edge move not found');
  assert(move.recoil, 'Double-Edge should have recoil field');
  assertEqual(move.recoil.percentage, 25, 'Double-Edge recoil should be 25% (quarter)');
});

test('Recoil field exists on Head-Smash', () => {
  const move = getMoveById('head-smash');
  assert(move, 'Head-Smash move not found');
  assert(move.recoil, 'Head-Smash should have recoil field');
  assertEqual(move.recoil.percentage, 25, 'Head-Smash recoil should be 25% (quarter)');
});

test('Recoil field exists on Take-Down', () => {
  const move = getMoveById('take-down');
  assert(move, 'Take-Down move not found');
  assert(move.recoil, 'Take-Down should have recoil field');
  assertEqual(move.recoil.percentage, 25, 'Take-Down recoil should be 25%');
});

// ============================================
// US2: OHKO Move Tests
// ============================================
console.log('\n=== US2: OHKO Move Tests ===');

test('OHKO field exists on Fissure', () => {
  const move = getMoveById('fissure');
  assert(move, 'Fissure move not found');
  assert(move.ohko, 'Fissure should have ohko field');
  assertEqual(move.ohko.success_roll, 20, 'Fissure should require natural 20');
});

test('OHKO field exists on Guillotine', () => {
  const move = getMoveById('guillotine');
  assert(move, 'Guillotine move not found');
  assert(move.ohko, 'Guillotine should have ohko field');
  assertEqual(move.ohko.success_roll, 20, 'Guillotine should require natural 20');
});

test('OHKO level restriction blocks higher level targets', () => {
  const attacker = { level: 5 };
  const defender = { level: 10 };
  const ohko = {
    level_restriction: {
      operator: 'lte',
      compare: 'target_level',
      offset: 0
    }
  };

  const result = checkOHKOLevelRestriction(attacker, defender, ohko);
  assert(result.blocked, 'OHKO should be blocked when target level > user level');
});

test('OHKO level restriction allows equal level targets', () => {
  const attacker = { level: 10 };
  const defender = { level: 10 };
  const ohko = {
    level_restriction: {
      operator: 'lte',
      compare: 'target_level',
      offset: 0
    }
  };

  const result = checkOHKOLevelRestriction(attacker, defender, ohko);
  assert(!result.blocked, 'OHKO should not be blocked when target level = user level');
});

test('OHKO type immunity blocks Ghost against Fissure', () => {
  const defender = { type: ['ghost'] };
  const ohko = { immune_types: ['ghost'] };

  const result = checkOHKOTypeImmunity(defender, ohko);
  assert(result.immune, 'Ghost types should be immune to Ground OHKO');
});

test('OHKO type immunity allows Normal type against Fissure', () => {
  const defender = { type: ['normal'] };
  const ohko = { immune_types: ['ghost'] };

  const result = checkOHKOTypeImmunity(defender, ohko);
  assert(!result.immune, 'Normal types should not be immune to Fissure');
});

// ============================================
// US3: Level-Based Damage Tests (Formula)
// ============================================
console.log('\n=== US3: Level-Based Damage Tests (Formula) ===');

test('Formula field exists on Seismic-Toss', () => {
  const move = getMoveById('seismic-toss');
  assert(move, 'Seismic-Toss move not found');
  assert(move.formula, 'Seismic-Toss should have formula field');
  assert(move.formula.expression.includes('user_level'), 'Formula should use user_level');
});

test('Formula field exists on Night-Shade', () => {
  const move = getMoveById('night-shade');
  assert(move, 'Night-Shade move not found');
  assert(move.formula, 'Night-Shade should have formula field');
  assert(move.formula.expression.includes('user_level'), 'Formula should use user_level');
});

test('Formula field exists on Foul-Play', () => {
  const move = getMoveById('foul-play');
  assert(move, 'Foul-Play move not found');
  assert(move.formula, 'Foul-Play should have formula field');
  assert(move.formula.expression.includes('target_level'), 'Formula should use target_level');
});

test('evaluateFormula calculates 1d6 + user_level correctly', () => {
  const context = { user_level: 10, target_level: 5 };
  const result = evaluateFormula('1d6 + user_level', context);

  // Result should be dice (1-6) + 10 = 11-16
  assertInRange(result.total, 11, 16, 'Formula result should be in range 11-16');
  assert(result.breakdown.includes('user_level(10)'), 'Breakdown should show user_level substitution');
});

test('evaluateFormula calculates 2d8 + target_level correctly', () => {
  const context = { user_level: 10, target_level: 15 };
  const result = evaluateFormula('2d8 + target_level', context);

  // Result should be dice (2-16) + 15 = 17-31
  assertInRange(result.total, 17, 31, 'Formula result should be in range 17-31');
  assert(result.breakdown.includes('target_level(15)'), 'Breakdown should show target_level substitution');
});

test('evaluateFormulaWithRng uses provided roll function', () => {
  const context = { user_level: 10, target_level: 5 };
  // Always roll 4 on any die
  const rollFn = () => 4;

  const result = evaluateFormulaWithRng('1d6 + user_level', context, rollFn);
  assertEqual(result.total, 14, 'Result should be 4 (dice) + 10 (level) = 14');
});

test('Formula move in combat simulation deals level-based damage', () => {
  const sim = createSimulation({
    pokemon1: { id: 'machamp', level: 15, moves: ['seismic-toss'] },
    pokemon2: { id: 'pikachu', level: 5 },
    seed: 99999,
    maxTurns: 2
  });

  const result = runToCompletion(sim);

  // Find formula move usage in log
  const formulaEntry = result.log.find(e =>
    e.details?.is_formula_move || e.formatted?.includes('Formula:')
  );

  assert(formulaEntry, 'Should find formula move in combat log');
});

// ============================================
// US6: Conditional Damage Tests
// ============================================
console.log('\n=== US6: Conditional Damage Tests ===');

test('Conditional field exists on Flail', () => {
  const move = getMoveById('flail');
  assert(move, 'Flail move not found');
  assert(move.conditional, 'Flail should have conditional field');
  assertEqual(move.conditional.type, 'user_hp_scaling', 'Flail should use user HP scaling');
});

test('Conditional field exists on Reversal', () => {
  const move = getMoveById('reversal');
  assert(move, 'Reversal move not found');
  assert(move.conditional, 'Reversal should have conditional field');
  assert(move.conditional.thresholds.length > 0, 'Reversal should have HP thresholds');
});

test('calculateConditionalMultiplier returns 3x at 10% HP', () => {
  const attacker = { current_hp: 10, max_hp: 100 };
  const defender = { current_hp: 50, max_hp: 50 };
  const conditional = {
    type: 'user_hp_scaling',
    thresholds: [
      { hp_percent: 10, multiplier: 3 },
      { hp_percent: 50, multiplier: 2 }
    ]
  };

  const result = calculateConditionalMultiplier(attacker, defender, conditional);
  assertEqual(result.multiplier, 3, 'Should return 3x multiplier at 10% HP');
  assertEqual(result.hpPercent, 10, 'Should report 10% HP');
});

test('calculateConditionalMultiplier returns 2x at 40% HP', () => {
  const attacker = { current_hp: 40, max_hp: 100 };
  const defender = { current_hp: 50, max_hp: 50 };
  const conditional = {
    type: 'user_hp_scaling',
    thresholds: [
      { hp_percent: 10, multiplier: 3 },
      { hp_percent: 50, multiplier: 2 }
    ]
  };

  const result = calculateConditionalMultiplier(attacker, defender, conditional);
  assertEqual(result.multiplier, 2, 'Should return 2x multiplier at 40% HP');
  assertEqual(result.hpPercent, 40, 'Should report 40% HP');
});

test('calculateConditionalMultiplier returns 1x at 80% HP', () => {
  const attacker = { current_hp: 80, max_hp: 100 };
  const defender = { current_hp: 50, max_hp: 50 };
  const conditional = {
    type: 'user_hp_scaling',
    thresholds: [
      { hp_percent: 10, multiplier: 3 },
      { hp_percent: 50, multiplier: 2 }
    ]
  };

  const result = calculateConditionalMultiplier(attacker, defender, conditional);
  assertEqual(result.multiplier, 1, 'Should return 1x multiplier at 80% HP (no threshold matched)');
});

// ============================================
// US4: Two-Turn Move Tests
// ============================================
console.log('\n=== US4: Two-Turn Move Tests ===');

test('Turns field exists on Dig', () => {
  const move = getMoveById('dig');
  assert(move, 'Dig move not found');
  assert(move.turns, 'Dig should have turns field');
  assertEqual(move.turns.count, 2, 'Dig should be a 2-turn move');
  assertEqual(move.turns.turn1.action, 'burrow', 'Dig turn 1 action should be burrow');
  assert(move.turns.turn1.invulnerable, 'Dig should grant invulnerability');
});

test('Turns field exists on Solar-Beam', () => {
  const move = getMoveById('solar-beam');
  assert(move, 'Solar-Beam move not found');
  assert(move.turns, 'Solar-Beam should have turns field');
  assertEqual(move.turns.count, 2, 'Solar-Beam should be a 2-turn move');
  assertEqual(move.turns.turn1.action, 'charge', 'Solar-Beam turn 1 action should be charge');
  assert(!move.turns.turn1.invulnerable, 'Solar-Beam should not grant invulnerability');
  assertEqual(move.turns.weather_skip, 'sunny', 'Solar-Beam should skip charge in sunny weather');
});

test('initiateTwoTurnMove sets up charging state', () => {
  const attacker = { name: 'Dugtrio', charging_move: null };
  const move = getMoveById('dig');

  const result = initiateTwoTurnMove(attacker, move, 1);

  assert(result.charging, 'Result should indicate charging');
  assert(result.invulnerable, 'Dig should set invulnerable');
  assertEqual(result.action, 'burrow', 'Action should be burrow');
  assert(attacker.charging_move, 'Attacker should have charging_move set');
  assertEqual(attacker.charging_move.moveId, 'dig', 'Charging move ID should be dig');
});

test('checkInvulnerability blocks attacks when underground', () => {
  const defender = {
    is_invulnerable: true,
    invulnerable_until: 'dig',
    vulnerable_to: ['earthquake', 'magnitude', 'fissure'],
    charging_move: { action: 'burrow' }
  };
  const normalMove = { id: 'tackle', name: 'Tackle' };

  const result = checkInvulnerability(defender, normalMove);
  assert(result.invulnerable, 'Normal moves should miss underground targets');
  assert(result.reason.includes('underground'), 'Reason should mention underground');
});

test('checkInvulnerability allows Earthquake to hit underground', () => {
  const defender = {
    is_invulnerable: true,
    invulnerable_until: 'dig',
    vulnerable_to: ['earthquake', 'magnitude', 'fissure'],
    charging_move: { action: 'burrow' }
  };
  const earthquakeMove = { id: 'earthquake', name: 'Earthquake' };

  const result = checkInvulnerability(defender, earthquakeMove);
  assert(!result.invulnerable, 'Earthquake should hit underground targets');
});

test('isChargingMove returns true when charging', () => {
  const chargingPokemon = { charging_move: { moveId: 'dig' } };
  const normalPokemon = { charging_move: null };

  assert(isChargingMove(chargingPokemon), 'Should return true when charging');
  assert(!isChargingMove(normalPokemon), 'Should return false when not charging');
});

// ============================================
// Integration Tests
// ============================================
console.log('\n=== Integration Tests ===');

test('Combat simulation runs without errors (OHKO move)', () => {
  const sim = createSimulation({
    pokemon1: { id: 'dugtrio', level: 10, moves: ['fissure'] },
    pokemon2: { id: 'pikachu', level: 8 },
    seed: 12345,
    maxTurns: 3
  });

  const result = runToCompletion(sim);
  assert(result.winner, 'Combat should have a winner or draw');
  assert(result.log.length > 0, 'Combat log should not be empty');
});

test('Combat simulation runs without errors (Formula move)', () => {
  const sim = createSimulation({
    pokemon1: { id: 'gengar', level: 12, moves: ['night-shade'] },
    pokemon2: { id: 'rattata', level: 5 },
    seed: 54321,
    maxTurns: 3
  });

  const result = runToCompletion(sim);
  assert(result.winner, 'Combat should have a winner or draw');
  assert(result.log.length > 0, 'Combat log should not be empty');
});

// ============================================
// Final Summary
// ============================================
console.log('\n' + '='.repeat(60));
console.log('TEST SUMMARY');
console.log('='.repeat(60));
console.log(`Total: ${results.passed + results.failed}`);
console.log(`Passed: ${results.passed}`);
console.log(`Failed: ${results.failed}`);
console.log('='.repeat(60));

if (results.failed > 0) {
  console.log('\nFailed Tests:');
  results.tests
    .filter(t => t.status === 'FAIL')
    .forEach(t => console.log(`  - ${t.name}: ${t.error}`));
}

// Exit with error code if tests failed
process.exit(results.failed > 0 ? 1 : 0);
