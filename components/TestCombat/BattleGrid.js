/**
 * BattleGrid Component
 * Visual 10x10 grid showing Pokemon positions and highlights
 *
 * Feature: 023-movement-test-harness
 * Task: T004, T006
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import GridCell from './GridCell';

// Grid constants - defined outside component to prevent re-creation
const COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const ROW_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

/**
 * BattleGrid - 10x10 visual grid for battle positions
 *
 * @param {Object} props
 * @param {Array<Array>} props.cells - 10x10 grid of cell data
 * @param {Object} props.combatants - { player: TestCombatant[], opponent: TestCombatant[] }
 * @param {Object} props.highlightedCells - { movement: Set<string>, attack: Set<string> }
 * @param {string|null} props.selectedCombatantId - Currently selected Pokemon's combatant_id
 * @param {function} props.onCellClick - (col, row, notation) => void
 * @param {function} props.onCellHover - (col, row, notation) => void
 * @param {function} props.onCellLeave - () => void
 * @param {boolean} props.showCoordinates - Show A-J and 1-10 labels (default: true)
 * @param {boolean} props.showDeploymentZones - Highlight deployment zones (default: false)
 * @param {boolean} props.disabled - Disable interactions (default: false)
 */
export default function BattleGrid({
  cells,
  combatants = { player: [], opponent: [] },
  highlightedCells = { movement: new Set(), attack: new Set() },
  selectedCombatantId = null,
  onCellClick,
  onCellHover,
  onCellLeave,
  showCoordinates = true,
  showDeploymentZones = false,
  disabled = false
}) {
  // T044: Keyboard navigation state
  const [keyboardCursor, setKeyboardCursor] = useState({ col: 0, row: 0 });
  const [keyboardActive, setKeyboardActive] = useState(false);
  const gridRef = useRef(null);

  // Convert col, row to notation (e.g., "A1")
  const toNotation = useCallback((col, row) => {
    return `${COL_LABELS[col]}${row + 1}`;
  }, []);

  // Find occupant at position
  const getOccupantAt = (col, row) => {
    const allCombatants = [...(combatants.player || []), ...(combatants.opponent || [])];
    for (const c of allCombatants) {
      if (c.position && c.position.col === col && c.position.row === row) {
        return {
          type: 'pokemon',
          data: {
            name: c.name,
            owner: c.owner,
            combatant_id: c.combatant_id,
            combatant: c  // Pass full combatant for tooltip
          }
        };
      }
    }
    return { type: 'empty', data: null };
  };

  // Check if cell is highlighted
  const getHighlightInfo = (col, row) => {
    const notation = toNotation(col, row);
    if (highlightedCells.movement?.has(notation)) {
      return { isHighlighted: true, type: 'move' };
    }
    if (highlightedCells.attack?.has(notation)) {
      return { isHighlighted: true, type: 'attack' };
    }
    return { isHighlighted: false, type: null };
  };

  // Check if cell is selected (contains selected Pokemon)
  const isCellSelected = (col, row) => {
    if (!selectedCombatantId) return false;
    const occupant = getOccupantAt(col, row);
    return occupant.type === 'pokemon' && occupant.data?.combatant_id === selectedCombatantId;
  };

  // Check if cell is in deployment zone
  const isDeploymentZone = (row) => {
    if (!showDeploymentZones) return false;
    return row <= 1 || row >= 8; // Rows 0-1 (player) and 8-9 (opponent)
  };

  // Handle cell click
  const handleCellClick = (col, row) => {
    if (onCellClick) {
      onCellClick(col, row, toNotation(col, row));
    }
  };

  // Handle cell hover
  const handleCellHover = (col, row) => {
    if (onCellHover) {
      onCellHover(col, row, toNotation(col, row));
    }
  };

  // Handle cell leave
  const handleCellLeave = () => {
    if (onCellLeave) {
      onCellLeave();
    }
  };

  // T044: Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (disabled) return;

    const key = e.key;
    let newCol = keyboardCursor.col;
    let newRow = keyboardCursor.row;

    switch (key) {
      case 'ArrowUp':
        e.preventDefault();
        newRow = Math.max(0, keyboardCursor.row - 1);
        setKeyboardActive(true);
        break;
      case 'ArrowDown':
        e.preventDefault();
        newRow = Math.min(9, keyboardCursor.row + 1);
        setKeyboardActive(true);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        newCol = Math.max(0, keyboardCursor.col - 1);
        setKeyboardActive(true);
        break;
      case 'ArrowRight':
        e.preventDefault();
        newCol = Math.min(9, keyboardCursor.col + 1);
        setKeyboardActive(true);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (keyboardActive && onCellClick) {
          onCellClick(keyboardCursor.col, keyboardCursor.row, toNotation(keyboardCursor.col, keyboardCursor.row));
        }
        return;
      default:
        return;
    }

    setKeyboardCursor({ col: newCol, row: newRow });
    if (onCellHover) {
      onCellHover(newCol, newRow, toNotation(newCol, newRow));
    }
  }, [disabled, keyboardCursor, keyboardActive, onCellClick, onCellHover, toNotation]);

  // T044: Check if cell has keyboard cursor
  const hasKeyboardCursor = (col, row) => {
    return keyboardActive && keyboardCursor.col === col && keyboardCursor.row === row;
  };

  // T044: Handle grid focus/blur
  const handleGridFocus = () => {
    setKeyboardActive(true);
  };

  const handleGridBlur = () => {
    setKeyboardActive(false);
  };

  return (
    <div
      ref={gridRef}
      style={styles.container}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      onFocus={handleGridFocus}
      onBlur={handleGridBlur}
      role="grid"
      aria-label="Battle grid"
    >
      {/* Column labels */}
      {showCoordinates && (
        <div style={styles.colLabels}>
          <div style={styles.cornerSpacer} />
          {COL_LABELS.map((label, idx) => (
            <div key={`col-${idx}`} style={styles.colLabel}>
              {label}
            </div>
          ))}
        </div>
      )}

      {/* Grid rows */}
      <div style={styles.gridContainer}>
        {ROW_LABELS.map((rowLabel, rowIdx) => (
          <div key={`row-${rowIdx}`} style={styles.gridRow}>
            {/* Row label */}
            {showCoordinates && (
              <div style={styles.rowLabel}>{rowLabel}</div>
            )}

            {/* Cells */}
            {COL_LABELS.map((_, colIdx) => {
              const occupant = getOccupantAt(colIdx, rowIdx);
              const highlight = getHighlightInfo(colIdx, rowIdx);

              return (
                <GridCell
                  key={`cell-${colIdx}-${rowIdx}`}
                  col={colIdx}
                  row={rowIdx}
                  notation={toNotation(colIdx, rowIdx)}
                  occupantType={occupant.type}
                  occupantData={occupant.data}
                  isHighlighted={highlight.isHighlighted}
                  highlightType={highlight.type}
                  isSelected={isCellSelected(colIdx, rowIdx)}
                  isDeploymentZone={isDeploymentZone(rowIdx)}
                  hasKeyboardCursor={hasKeyboardCursor(colIdx, rowIdx)}
                  onClick={() => handleCellClick(colIdx, rowIdx)}
                  onMouseEnter={() => handleCellHover(colIdx, rowIdx)}
                  onMouseLeave={handleCellLeave}
                  disabled={disabled}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'inline-block',
    backgroundColor: '#0d0d0d',
    padding: '8px',
    borderRadius: '8px',
    border: '1px solid #333',
    outline: 'none',
    // Focus indicator handled by keyboard cursor
  },
  colLabels: {
    display: 'flex',
    marginBottom: '4px'
  },
  cornerSpacer: {
    width: '24px',
    height: '20px'
  },
  colLabel: {
    width: '40px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#888',
    fontWeight: 'bold'
  },
  gridContainer: {
    display: 'flex',
    flexDirection: 'column'
  },
  gridRow: {
    display: 'flex'
  },
  rowLabel: {
    width: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    color: '#888',
    fontWeight: 'bold'
  }
};
