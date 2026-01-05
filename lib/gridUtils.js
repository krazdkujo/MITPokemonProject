/**
 * Grid Coordinate Utilities
 * Helper functions for 10x10 battle grid coordinate management
 *
 * Feature: 015-combat-arena
 */

// Column labels A-J (index 0-9)
const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

/**
 * Convert zero-indexed column and row to grid notation (e.g., "A5", "J10")
 * @param {number} col - Column index (0-9)
 * @param {number} row - Row index (0-9)
 * @returns {string} Grid notation (e.g., "A1", "J10")
 */
export function toGridNotation(col, row) {
  if (!isValidPosition(col, row)) {
    throw new Error(`Invalid position: col=${col}, row=${row}`);
  }
  return `${COLUMNS[col]}${row + 1}`;
}

/**
 * Convert grid notation to zero-indexed column and row
 * @param {string} notation - Grid notation (e.g., "A5", "J10")
 * @returns {{ col: number, row: number }} Zero-indexed position
 */
export function fromGridNotation(notation) {
  if (!notation || typeof notation !== 'string' || notation.length < 2) {
    throw new Error(`Invalid grid notation: ${notation}`);
  }

  const colLetter = notation[0].toUpperCase();
  const rowStr = notation.slice(1);
  const col = COLUMNS.indexOf(colLetter);
  const row = parseInt(rowStr, 10) - 1;

  if (col === -1 || isNaN(row) || !isValidPosition(col, row)) {
    throw new Error(`Invalid grid notation: ${notation}`);
  }

  return { col, row };
}

/**
 * Calculate Manhattan distance between two positions
 * @param {{ col: number, row: number }} pos1 - First position
 * @param {{ col: number, row: number }} pos2 - Second position
 * @returns {number} Manhattan distance
 */
export function getManhattanDistance(pos1, pos2) {
  return Math.abs(pos1.col - pos2.col) + Math.abs(pos1.row - pos2.row);
}

/**
 * Check if a position is valid on the 10x10 grid
 * @param {number} col - Column index
 * @param {number} row - Row index
 * @returns {boolean} True if valid
 */
export function isValidPosition(col, row) {
  return (
    Number.isInteger(col) &&
    Number.isInteger(row) &&
    col >= 0 &&
    col < 10 &&
    row >= 0 &&
    row < 10
  );
}

/**
 * Get all valid move targets within a maximum distance
 * @param {{ col: number, row: number }} position - Starting position
 * @param {number} maxDistance - Maximum Manhattan distance (default: 6 for standard movement)
 * @param {Array<{ col: number, row: number }>} occupiedPositions - Positions that cannot be moved to
 * @returns {Array<{ col: number, row: number, notation: string, distance: number }>} Valid target positions
 */
export function getValidMoveTargets(position, maxDistance = 6, occupiedPositions = []) {
  const valid = [];

  for (let col = 0; col < 10; col++) {
    for (let row = 0; row < 10; row++) {
      const distance = getManhattanDistance(position, { col, row });

      // Skip same position
      if (distance === 0) continue;

      // Skip if out of range
      if (distance > maxDistance) continue;

      // Skip if occupied
      const isOccupied = occupiedPositions.some(
        p => p.col === col && p.row === row
      );
      if (isOccupied) continue;

      valid.push({
        col,
        row,
        notation: toGridNotation(col, row),
        distance
      });
    }
  }

  // Sort by distance (closest first)
  return valid.sort((a, b) => a.distance - b.distance);
}

/**
 * Check if a position is in the player deployment zone (rows 1-2, indices 0-1)
 * @param {number} row - Row index
 * @returns {boolean} True if in player deployment zone
 */
export function isPlayerDeploymentZone(row) {
  return row === 0 || row === 1;
}

/**
 * Check if a position is in the opponent deployment zone (rows 9-10, indices 8-9)
 * @param {number} row - Row index
 * @returns {boolean} True if in opponent deployment zone
 */
export function isOpponentDeploymentZone(row) {
  return row === 8 || row === 9;
}

/**
 * Get the fixed trainer positions
 * @returns {{ player: { col: number, row: number, notation: string }, opponent: { col: number, row: number, notation: string } }}
 */
export function getTrainerPositions() {
  return {
    player: { col: 0, row: 4, notation: 'A5' },
    opponent: { col: 9, row: 4, notation: 'J5' }
  };
}

/**
 * Initialize an empty 10x10 grid
 * @returns {Array<Array<Object>>} 10x10 grid of GridCell objects
 */
export function initializeGrid() {
  const grid = [];
  const trainerPositions = getTrainerPositions();

  for (let row = 0; row < 10; row++) {
    const rowCells = [];
    for (let col = 0; col < 10; col++) {
      const isPlayerTrainer = col === trainerPositions.player.col && row === trainerPositions.player.row;
      const isOpponentTrainer = col === trainerPositions.opponent.col && row === trainerPositions.opponent.row;

      rowCells.push({
        position: { col, row },
        notation: toGridNotation(col, row),
        occupant_type: isPlayerTrainer ? 'trainer' : isOpponentTrainer ? 'trainer' : 'empty',
        occupant_id: isPlayerTrainer ? 'player_trainer' : isOpponentTrainer ? 'opponent_trainer' : null,
        is_deployment_zone: isPlayerDeploymentZone(row),
        is_highlighted: false,
        highlight_type: null
      });
    }
    grid.push(rowCells);
  }

  return grid;
}

/**
 * Get all valid attack targets (all opponent Pokemon with HP > 0)
 * Unlimited range for initial implementation
 * @param {Array<Object>} opponentCombatants - Array of opponent combatants
 * @returns {Array<{ combatant_id: string, position: { col: number, row: number }, notation: string }>} Valid targets
 */
export function getValidAttackTargets(opponentCombatants) {
  return opponentCombatants
    .filter(c => c.current_hp > 0 && c.position)
    .map(c => ({
      combatant_id: c.combatant_id,
      position: c.position,
      notation: c.position ? toGridNotation(c.position.col, c.position.row) : null
    }));
}

/**
 * Convert feet to grid cells
 * Per Pokemon 5e rules: 1 cell = 5 feet
 * @param {number} feet - Distance in feet
 * @returns {number} Distance in cells (rounded down)
 */
export function feetToCells(feet) {
  return Math.floor(feet / 5);
}

/**
 * Convert grid cells to feet
 * Per Pokemon 5e rules: 1 cell = 5 feet
 * @param {number} cells - Distance in cells
 * @returns {number} Distance in feet
 */
export function cellsToFeet(cells) {
  return cells * 5;
}

export { COLUMNS };
