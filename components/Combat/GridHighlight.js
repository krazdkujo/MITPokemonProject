/**
 * GridHighlight Component
 * Visual overlay for highlighting valid movement and targeting cells on the combat grid
 *
 * Feature: 018-combat-enhancements
 */

import React from 'react';
import styles from './GridHighlight.module.css';

/**
 * GridHighlight Component
 * Renders overlay cells to show valid movement destinations or attack targets
 *
 * @param {Object} props
 * @param {Array<{col: number, row: number}>} props.movementCells - Cells valid for movement
 * @param {Array<{col: number, row: number}>} props.targetingCells - Cells valid for targeting
 * @param {Array<{col: number, row: number}>} props.aoeCells - Cells in area of effect
 * @param {number} props.cellSize - Size of each grid cell in pixels
 * @param {Function} props.onCellClick - Handler for clicking a highlighted cell
 * @param {string} props.mode - Current mode: 'movement', 'targeting', or null
 */
export default function GridHighlight({
  movementCells = [],
  targetingCells = [],
  aoeCells = [],
  cellSize = 50,
  onCellClick,
  mode
}) {
  const handleCellClick = (cell, type) => {
    if (onCellClick) {
      onCellClick(cell, type);
    }
  };

  return (
    <div className={styles.highlightLayer} aria-label="Grid highlight overlay">
      {/* Movement highlights (blue) */}
      {mode === 'movement' && movementCells.map((cell, idx) => (
        <div
          key={`move-${idx}`}
          className={`${styles.cell} ${styles.movement}`}
          style={{
            left: cell.col * cellSize,
            top: cell.row * cellSize,
            width: cellSize,
            height: cellSize
          }}
          onClick={() => handleCellClick(cell, 'movement')}
          role="button"
          aria-label={`Move to column ${cell.col + 1}, row ${cell.row + 1}`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleCellClick(cell, 'movement');
            }
          }}
        />
      ))}

      {/* Targeting highlights (red/orange) */}
      {mode === 'targeting' && targetingCells.map((cell, idx) => (
        <div
          key={`target-${idx}`}
          className={`${styles.cell} ${styles.targeting}`}
          style={{
            left: cell.col * cellSize,
            top: cell.row * cellSize,
            width: cellSize,
            height: cellSize
          }}
          onClick={() => handleCellClick(cell, 'targeting')}
          role="button"
          aria-label={`Target column ${cell.col + 1}, row ${cell.row + 1}`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleCellClick(cell, 'targeting');
            }
          }}
        />
      ))}

      {/* AoE highlights (purple) */}
      {aoeCells.map((cell, idx) => (
        <div
          key={`aoe-${idx}`}
          className={`${styles.cell} ${styles.aoe}`}
          style={{
            left: cell.col * cellSize,
            top: cell.row * cellSize,
            width: cellSize,
            height: cellSize
          }}
          aria-label={`Area of effect at column ${cell.col + 1}, row ${cell.row + 1}`}
        />
      ))}
    </div>
  );
}

/**
 * Utility: Get all cells within Manhattan distance of a position
 *
 * @param {{ col: number, row: number }} position - Center position
 * @param {number} range - Maximum distance in cells
 * @param {number} gridSize - Size of the grid (assumes square grid)
 * @param {Set<string>} occupiedCells - Set of "col,row" strings for occupied cells
 * @returns {Array<{col: number, row: number}>} Array of valid cells
 */
export function getCellsInRange(position, range, gridSize = 10, occupiedCells = new Set()) {
  const cells = [];

  if (!position || range < 0) return cells;

  for (let col = 0; col < gridSize; col++) {
    for (let row = 0; row < gridSize; row++) {
      const distance = Math.abs(col - position.col) + Math.abs(row - position.row);

      // Skip the actor's own cell for movement, but include for self-targeting
      if (distance === 0 && range > 0) continue;

      // Skip cells outside range
      if (distance > range) continue;

      // Skip occupied cells (for movement only)
      const cellKey = `${col},${row}`;
      if (occupiedCells.has(cellKey)) continue;

      cells.push({ col, row });
    }
  }

  return cells;
}
