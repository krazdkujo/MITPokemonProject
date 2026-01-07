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

/**
 * Get all cells within Manhattan distance range of a position
 * Feature: 018-combat-enhancements (T028)
 *
 * @param {{ col: number, row: number }} position - Center position
 * @param {number} range - Maximum distance in cells
 * @param {number} gridSize - Size of the grid (default 10)
 * @param {boolean} includeSelf - Whether to include the center position (default false)
 * @returns {Array<{col: number, row: number}>} Array of cells within range
 */
export function getCellsInRange(position, range, gridSize = 10, includeSelf = false) {
  const cells = [];

  if (!position || range < 0) return cells;

  for (let col = 0; col < gridSize; col++) {
    for (let row = 0; row < gridSize; row++) {
      const distance = Math.abs(col - position.col) + Math.abs(row - position.row);

      // Skip the actor's own cell unless includeSelf is true
      if (distance === 0 && !includeSelf) continue;

      // Skip cells outside range
      if (distance > range) continue;

      cells.push({ col, row });
    }
  }

  return cells;
}

/**
 * Get valid attack targets within move range
 * Feature: 018-combat-enhancements (T028)
 *
 * @param {{ col: number, row: number }} attackerPosition - Attacker's position
 * @param {number} moveRange - Move's range in cells
 * @param {Array<Object>} opponentCombatants - Array of opponent combatants
 * @returns {Array<{col: number, row: number, combatant_id: string, distance: number}>} Valid targets
 */
export function getValidAttackTargetsInRange(attackerPosition, moveRange, opponentCombatants) {
  if (!attackerPosition || moveRange < 0) return [];

  return opponentCombatants
    .filter(c => {
      if (c.current_hp <= 0 || !c.position) return false;
      const distance = getManhattanDistance(attackerPosition, c.position);
      return distance <= moveRange;
    })
    .map(c => ({
      col: c.position.col,
      row: c.position.row,
      combatant_id: c.combatant_id,
      distance: getManhattanDistance(attackerPosition, c.position)
    }));
}

/**
 * Feature 024 T042: Get all targets in a cone AoE
 * Cones extend from origin in a direction, widening as they extend
 *
 * @param {{ col: number, row: number }} origin - Cone origin point
 * @param {'north'|'south'|'east'|'west'|'ne'|'nw'|'se'|'sw'} direction - Direction of cone
 * @param {number} sizeFt - Size of cone in feet
 * @param {Array<Object>} combatants - Array of combatants with position
 * @returns {Array<Object>} Combatants in the cone
 */
export function getConeTargets(origin, direction, sizeFt, combatants) {
  const sizeCells = feetToCells(sizeFt);
  const targets = [];

  // Direction vectors
  const dirVectors = {
    north: { dx: 0, dy: -1 },
    south: { dx: 0, dy: 1 },
    east: { dx: 1, dy: 0 },
    west: { dx: -1, dy: 0 },
    ne: { dx: 1, dy: -1 },
    nw: { dx: -1, dy: -1 },
    se: { dx: 1, dy: 1 },
    sw: { dx: -1, dy: 1 }
  };

  const dir = dirVectors[direction] || dirVectors.north;

  for (const combatant of combatants) {
    if (!combatant.position || combatant.current_hp <= 0) continue;

    // Calculate relative position from origin
    const relCol = combatant.position.col - origin.col;
    const relRow = combatant.position.row - origin.row;

    // Distance along cone direction
    let distAlongDir = 0;
    let perpDist = 0;

    if (dir.dx !== 0 && dir.dy !== 0) {
      // Diagonal direction - use Chebyshev distance
      const maxDist = Math.max(Math.abs(relCol), Math.abs(relRow));
      // Check if in the right quadrant
      const inQuadrant = Math.sign(relCol) === dir.dx && Math.sign(relRow) === dir.dy;
      if (!inQuadrant && (relCol !== 0 || relRow !== 0)) continue;
      distAlongDir = maxDist;
    } else if (dir.dx !== 0) {
      // East or West
      distAlongDir = relCol * dir.dx;
      perpDist = Math.abs(relRow);
    } else {
      // North or South
      distAlongDir = relRow * dir.dy;
      perpDist = Math.abs(relCol);
    }

    // Must be in front of origin
    if (distAlongDir <= 0) continue;

    // Must be within cone length
    if (distAlongDir > sizeCells) continue;

    // Cone widens at 1:1 ratio - perpendicular distance must be <= distance along
    if (perpDist > distAlongDir) continue;

    targets.push(combatant);
  }

  return targets;
}

/**
 * Feature 024 T043: Get all targets in a line AoE
 * Lines extend from origin in a direction with a specified width
 *
 * @param {{ col: number, row: number }} origin - Line origin point
 * @param {'north'|'south'|'east'|'west'|'ne'|'nw'|'se'|'sw'} direction - Direction of line
 * @param {number} lengthFt - Length of line in feet
 * @param {number} widthFt - Width of line in feet (default 5ft = 1 cell)
 * @param {Array<Object>} combatants - Array of combatants with position
 * @returns {Array<Object>} Combatants in the line
 */
export function getLineTargets(origin, direction, lengthFt, widthFt, combatants) {
  const lengthCells = feetToCells(lengthFt);
  const widthCells = Math.max(1, feetToCells(widthFt));
  const halfWidth = Math.floor(widthCells / 2);
  const targets = [];

  const dirVectors = {
    north: { dx: 0, dy: -1 },
    south: { dx: 0, dy: 1 },
    east: { dx: 1, dy: 0 },
    west: { dx: -1, dy: 0 },
    ne: { dx: 1, dy: -1 },
    nw: { dx: -1, dy: -1 },
    se: { dx: 1, dy: 1 },
    sw: { dx: -1, dy: 1 }
  };

  const dir = dirVectors[direction] || dirVectors.north;

  for (const combatant of combatants) {
    if (!combatant.position || combatant.current_hp <= 0) continue;

    const relCol = combatant.position.col - origin.col;
    const relRow = combatant.position.row - origin.row;

    let distAlongDir = 0;
    let perpDist = 0;

    if (dir.dx !== 0 && dir.dy !== 0) {
      // Diagonal line
      const dotProduct = relCol * dir.dx + relRow * dir.dy;
      if (dotProduct <= 0) continue;
      distAlongDir = Math.max(Math.abs(relCol), Math.abs(relRow));
      // For diagonals, check if roughly along the diagonal
      const onDiagonal = Math.abs(Math.abs(relCol) - Math.abs(relRow)) <= halfWidth;
      if (!onDiagonal) continue;
    } else if (dir.dx !== 0) {
      distAlongDir = relCol * dir.dx;
      perpDist = Math.abs(relRow);
    } else {
      distAlongDir = relRow * dir.dy;
      perpDist = Math.abs(relCol);
    }

    if (distAlongDir <= 0) continue;
    if (distAlongDir > lengthCells) continue;
    if (perpDist > halfWidth) continue;

    targets.push(combatant);
  }

  return targets;
}

/**
 * Feature 024 T044: Get all targets in a radius AoE
 * Radius is centered on a point and affects all within distance
 *
 * @param {{ col: number, row: number }} center - Center of radius
 * @param {number} radiusFt - Radius in feet
 * @param {Array<Object>} combatants - Array of combatants with position
 * @returns {Array<Object>} Combatants in the radius
 */
export function getRadiusTargets(center, radiusFt, combatants) {
  const radiusCells = feetToCells(radiusFt);
  const targets = [];

  for (const combatant of combatants) {
    if (!combatant.position || combatant.current_hp <= 0) continue;

    const distance = getManhattanDistance(center, combatant.position);

    if (distance <= radiusCells) {
      targets.push(combatant);
    }
  }

  return targets;
}

export { COLUMNS };
