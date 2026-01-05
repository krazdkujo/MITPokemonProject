/**
 * PP Tracker Utility
 * Manages Power Point (PP) consumption for Pokemon moves
 *
 * Feature: 007-combat-engine
 */

const { getMoveById } = require('./pokemonData');
const { rollDice } = require('./diceRoller');

/**
 * Initialize PP tracking object for a set of moves
 * Loads max PP from Source data for each move
 *
 * @param {string[]} knownMoves - Array of move IDs
 * @returns {Object} Object mapping move ID to current PP { moveId: currentPP }
 */
function initializePP(knownMoves) {
  if (!knownMoves || !Array.isArray(knownMoves)) {
    return {};
  }

  const ppObject = {};
  for (const moveId of knownMoves) {
    const move = getMoveById(moveId);
    if (move) {
      ppObject[moveId] = move.pp || 20; // Default to 20 if PP not specified
    }
  }
  return ppObject;
}

/**
 * Check if a move can be used (has PP remaining)
 *
 * @param {Object} movePP - PP tracking object
 * @param {string} moveId - Move ID to check
 * @returns {boolean} True if PP > 0
 */
function canUseMove(movePP, moveId) {
  if (!movePP || movePP[moveId] === undefined) {
    return false;
  }
  return movePP[moveId] > 0;
}

/**
 * Consume PP for a move
 * Decrements PP by 1 and returns updated PP object
 *
 * @param {Object} movePP - PP tracking object
 * @param {string} moveId - Move ID to consume PP for
 * @returns {{ updatedPP: Object, consumed: boolean }}
 */
function consumePP(movePP, moveId) {
  if (!movePP || movePP[moveId] === undefined) {
    return { updatedPP: movePP, consumed: false };
  }

  if (movePP[moveId] <= 0) {
    return { updatedPP: movePP, consumed: false };
  }

  const updatedPP = { ...movePP };
  updatedPP[moveId] = movePP[moveId] - 1;

  return { updatedPP, consumed: true };
}

/**
 * Check if a Pokemon must use Struggle (all moves at 0 PP)
 *
 * @param {Object} movePP - PP tracking object
 * @returns {boolean} True if all moves have 0 PP
 */
function mustUseStruggle(movePP) {
  if (!movePP || Object.keys(movePP).length === 0) {
    return true;
  }

  return Object.values(movePP).every(pp => pp <= 0);
}

/**
 * Get available moves (moves with PP > 0)
 *
 * @param {Object} movePP - PP tracking object
 * @returns {string[]} Array of move IDs that can still be used
 */
function getAvailableMoves(movePP) {
  if (!movePP) {
    return [];
  }

  return Object.entries(movePP)
    .filter(([_, pp]) => pp > 0)
    .map(([moveId, _]) => moveId);
}

/**
 * Get the Struggle move definition
 * Struggle is a typeless move used when all PP is exhausted
 * T022: Per Pokemon 5e rules, Struggle has NO recoil damage
 *
 * @returns {Object} Struggle move object
 */
function getStruggleMove() {
  return {
    id: 'struggle',
    name: 'Struggle',
    type: 'typeless',
    power: 'str', // Uses STR for attack
    time: '1 action',
    range: 'Melee',
    // T022: Updated description - no recoil in 5e
    description: 'A desperate attack used when all PP is exhausted.',
    pp: null, // Infinite - no PP cost
    damageDice: '1d4',
    // T022: No recoil in Pokemon 5e
    recoilDice: null,
    isStruggle: true
  };
}

/**
 * Calculate Struggle recoil damage
 * @deprecated T022: Per Pokemon 5e rules, Struggle has no recoil
 * @returns {number} Always returns 0
 */
function calculateStruggleRecoil() {
  // T022: Per Pokemon 5e rules, Struggle has no recoil
  return 0;
}

/**
 * Apply Struggle recoil to a combatant
 * @deprecated T022: Per Pokemon 5e rules, Struggle has no recoil
 * @param {Object} combatant - The combatant using Struggle
 * @returns {{ recoilDamage: number, hpBefore: number, hpAfter: number }}
 */
function applyStruggleRecoil(combatant) {
  // T022: Per Pokemon 5e rules, Struggle has no recoil
  const hpBefore = combatant.current_hp;
  return {
    recoilDamage: 0,
    hpBefore,
    hpAfter: combatant.current_hp
  };
}

/**
 * Restore PP for a specific move
 *
 * @param {Object} movePP - PP tracking object
 * @param {string} moveId - Move ID to restore
 * @param {number} amount - Amount to restore (or null for full restore)
 * @returns {Object} Updated PP object
 */
function restorePP(movePP, moveId, amount = null) {
  if (!movePP || movePP[moveId] === undefined) {
    return movePP;
  }

  const move = getMoveById(moveId);
  const maxPP = move?.pp || 20;

  const updatedPP = { ...movePP };

  if (amount === null) {
    // Full restore
    updatedPP[moveId] = maxPP;
  } else {
    // Partial restore (cap at max)
    updatedPP[moveId] = Math.min(maxPP, movePP[moveId] + amount);
  }

  return updatedPP;
}

/**
 * Restore all PP for all moves
 *
 * @param {Object} movePP - PP tracking object
 * @returns {Object} Updated PP object with all moves at max PP
 */
function restoreAllPP(movePP) {
  if (!movePP) {
    return {};
  }

  const updatedPP = {};
  for (const moveId of Object.keys(movePP)) {
    const move = getMoveById(moveId);
    const maxPP = move?.pp || 20;
    updatedPP[moveId] = maxPP;
  }

  return updatedPP;
}

module.exports = {
  initializePP,
  canUseMove,
  consumePP,
  mustUseStruggle,
  getAvailableMoves,
  getStruggleMove,
  calculateStruggleRecoil,
  applyStruggleRecoil,
  restorePP,
  restoreAllPP
};
