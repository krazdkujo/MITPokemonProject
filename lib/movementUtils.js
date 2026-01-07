/**
 * Movement Utilities
 * Client-safe movement functions for grid-based combat
 *
 * Feature: 023-movement-test-harness
 * Extracted from combatSimulator.js to avoid fs dependency on client
 */

import {
  getManhattanDistance,
  toGridNotation,
  getValidMoveTargets
} from './gridUtils.js';

/**
 * Execute movement for a combatant
 * Task: T014, T019, T037, T041
 *
 * @param {Object} simulation - Active simulation instance
 * @param {string} combatant_id - ID of combatant to move
 * @param {Object} targetPosition - { col, row } destination
 * @param {Array} occupiedPositions - List of occupied {col, row} positions
 * @returns {Object} Movement result with log entry
 */
export function executeMovement(simulation, combatant_id, targetPosition, occupiedPositions = []) {
  // Find the combatant
  const combatant = simulation.combatant1.combatant_id === combatant_id
    ? simulation.combatant1
    : simulation.combatant2.combatant_id === combatant_id
      ? simulation.combatant2
      : null;

  if (!combatant) {
    return { success: false, error: 'Combatant not found' };
  }

  // Check if already moved
  if (combatant.has_moved_this_turn) {
    return { success: false, error: 'Already moved this turn' };
  }

  // Get current position
  const fromPosition = combatant.position;
  if (!fromPosition) {
    return { success: false, error: 'Combatant has no position' };
  }

  // Calculate distance
  const distance = getManhattanDistance(fromPosition, targetPosition);

  // Get walking speed (default 6 cells = 30ft)
  const walkingSpeed = combatant.walking_speed || 6;
  const movementRemaining = combatant.movement_remaining !== undefined
    ? combatant.movement_remaining
    : walkingSpeed;

  // Validate movement
  if (distance > movementRemaining) {
    return {
      success: false,
      error: `Target too far (${distance} cells, only ${movementRemaining} remaining)`
    };
  }

  // Check if target is occupied
  const isOccupied = occupiedPositions.some(
    p => p.col === targetPosition.col && p.row === targetPosition.row
  );
  if (isOccupied) {
    return { success: false, error: 'Target cell is occupied' };
  }

  // Execute movement
  const fromNotation = toGridNotation(fromPosition.col, fromPosition.row);
  const toNotation = toGridNotation(targetPosition.col, targetPosition.row);

  // Update combatant state (T019)
  combatant.position = { col: targetPosition.col, row: targetPosition.row };
  combatant.movement_remaining = movementRemaining - distance;
  combatant.has_moved_this_turn = true;

  // Generate log entry (T037)
  const logEntry = {
    type: 'movement',
    turnNumber: simulation.currentTurn,
    timestamp: Date.now(),
    actor: combatant.name,
    target: null,
    details: {
      from_position: { ...fromPosition, notation: fromNotation },
      to_position: { ...targetPosition, notation: toNotation },
      distance_moved: distance,
      movement_before: movementRemaining,
      movement_after: combatant.movement_remaining
    },
    formatted: `▶ ${combatant.name.toUpperCase()} moves ${fromNotation} → ${toNotation}\n  ├─ Distance: ${distance} cells (${distance * 5} ft)\n  └─ Movement remaining: ${combatant.movement_remaining}/${walkingSpeed} cells`
  };

  return {
    success: true,
    logEntry,
    combatant,
    distance,
    fromPosition,
    toPosition: targetPosition
  };
}

/**
 * Get valid movement targets for a combatant
 * Task: T041 (verbose logging)
 *
 * @param {Object} combatant - Combatant to get targets for
 * @param {Array} occupiedPositions - List of occupied {col, row} positions
 * @returns {Object} { targets, walkingSpeed, movementRemaining }
 */
export function getMovementTargets(combatant, occupiedPositions = []) {
  const walkingSpeed = combatant.walking_speed || 6;
  const movementRemaining = combatant.movement_remaining !== undefined
    ? combatant.movement_remaining
    : walkingSpeed;

  if (!combatant.position || combatant.has_moved_this_turn) {
    return { targets: [], walkingSpeed, movementRemaining: 0 };
  }

  const targets = getValidMoveTargets(combatant.position, movementRemaining, occupiedPositions);

  return {
    targets,
    walkingSpeed,
    movementRemaining
  };
}

export default {
  executeMovement,
  getMovementTargets
};
