/**
 * Move Range Utilities
 * Parse move range strings and calculate cell distances for grid-based combat
 *
 * Feature: 018-combat-enhancements
 */

/**
 * Parse a move's range string into structured range data
 * Conversion: 1 grid cell = 5 feet (standard D&D/5e scale)
 *
 * @param {string} rangeString - Raw range from Source moves.json
 * @returns {{ cells: number, type: string, isAoe: boolean }}
 */
export function parseRange(rangeString) {
  if (!rangeString) {
    return { cells: 6, type: 'ranged', isAoe: false };
  }

  const normalized = rangeString.toLowerCase().trim();

  // Self-targeting moves
  if (normalized === 'self') {
    return { cells: 0, type: 'self', isAoe: false };
  }

  // Melee moves (adjacent only)
  if (normalized === 'melee') {
    return { cells: 1, type: 'melee', isAoe: false };
  }

  // Variable range (default to 6 cells)
  if (normalized === 'varies') {
    return { cells: 6, type: 'ranged', isAoe: false };
  }

  // Direct distance pattern: "Xft" (e.g., "30ft", "50ft", "80ft")
  const directMatch = normalized.match(/^(\d+)ft$/);
  if (directMatch) {
    const feet = parseInt(directMatch[1], 10);
    return {
      cells: Math.ceil(feet / 5),
      type: 'ranged',
      isAoe: false
    };
  }

  // Area of Effect pattern: "self (Xft cone/line/radius)"
  const aoeMatch = normalized.match(/^self\s*\((\d+)ft\s+(cone|line|radius)\)$/);
  if (aoeMatch) {
    const feet = parseInt(aoeMatch[1], 10);
    const aoeType = aoeMatch[2];
    return {
      cells: Math.ceil(feet / 5),
      type: aoeType,
      isAoe: true
    };
  }

  // Default fallback for unknown patterns
  return { cells: 6, type: 'ranged', isAoe: false };
}

/**
 * Get move range data with computed cells from a move object
 *
 * @param {Object} move - Move object with range property
 * @returns {Object} Move with added range_cells, range_type, is_aoe properties
 */
export function getMoveWithRange(move) {
  if (!move) return null;

  const rangeData = parseRange(move.range);

  return {
    ...move,
    range_cells: rangeData.cells,
    range_type: rangeData.type,
    is_aoe: rangeData.isAoe
  };
}

/**
 * Batch process moves to add range data
 *
 * @param {Array<Object>} moves - Array of move objects
 * @returns {Array<Object>} Moves with range data added
 */
export function getMovesWithRanges(moves) {
  if (!Array.isArray(moves)) return [];
  return moves.map(getMoveWithRange).filter(Boolean);
}

/**
 * Check if a target position is within a move's range from actor position
 *
 * @param {{ col: number, row: number }} actorPosition - Actor's grid position
 * @param {{ col: number, row: number }} targetPosition - Target's grid position
 * @param {number} rangeCells - Move's range in cells
 * @returns {boolean} True if target is in range
 */
export function isInRange(actorPosition, targetPosition, rangeCells) {
  if (!actorPosition || !targetPosition) return false;

  // Self-targeting moves (range 0) only hit the actor's cell
  if (rangeCells === 0) {
    return actorPosition.col === targetPosition.col &&
           actorPosition.row === targetPosition.row;
  }

  // Calculate Manhattan distance
  const distance = Math.abs(targetPosition.col - actorPosition.col) +
                   Math.abs(targetPosition.row - actorPosition.row);

  return distance <= rangeCells;
}

/**
 * Get default range for a move based on its power attribute
 * Physical moves (STR-based) default to melee (1 cell)
 * Special moves (non-STR) default to ranged (6 cells)
 *
 * @param {Object} move - Move object with power property
 * @returns {number} Default range in cells
 */
export function getDefaultRange(move) {
  if (!move || !move.power) return 6;

  // Status moves (power: "none") default to self or ranged
  if (move.power === 'none') {
    return 0; // Self-targeting by default
  }

  // If power includes 'str' as primary, likely melee
  if (Array.isArray(move.power) && move.power[0] === 'str') {
    return 1;
  }

  return 6;
}
