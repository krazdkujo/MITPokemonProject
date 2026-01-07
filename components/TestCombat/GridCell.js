/**
 * GridCell Component
 * Individual cell in the battle grid with visual states for highlighting and occupancy
 *
 * Feature: 023-movement-test-harness
 * Task: T003, T005, T010-T012
 */

import React, { useState } from 'react';

/**
 * GridCell - A single cell in the 10x10 battle grid
 *
 * @param {Object} props
 * @param {number} props.col - Column index (0-9)
 * @param {number} props.row - Row index (0-9)
 * @param {string} props.notation - Grid notation (e.g., "A1", "J10")
 * @param {string} props.occupantType - 'empty' | 'pokemon' | 'trainer'
 * @param {Object|null} props.occupantData - { name, owner, combatant } for occupied cells
 * @param {boolean} props.isHighlighted - Whether cell should show highlight
 * @param {string|null} props.highlightType - 'move' | 'attack' | 'selected' | null
 * @param {boolean} props.isSelected - Whether this cell is selected
 * @param {boolean} props.isDeploymentZone - Whether cell is in deployment zone
 * @param {boolean} props.hasKeyboardCursor - Whether cell has keyboard focus cursor (T044)
 * @param {function} props.onClick - Click handler
 * @param {function} props.onMouseEnter - Mouse enter handler
 * @param {function} props.onMouseLeave - Mouse leave handler
 * @param {boolean} props.disabled - Whether interactions are disabled
 */
export default function GridCell({
  col,
  row,
  notation,
  occupantType = 'empty',
  occupantData = null,
  isHighlighted = false,
  highlightType = null,
  isSelected = false,
  isDeploymentZone = false,
  hasKeyboardCursor = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  disabled = false
}) {
  // Determine cell background color based on state
  const getCellBackground = () => {
    if (isSelected) {
      return 'rgba(33, 150, 243, 0.5)'; // Blue for selected
    }
    // T026: Attack highlight on occupied cell (valid target) - brighter
    if (isHighlighted && highlightType === 'attack' && occupantType === 'pokemon') {
      return 'rgba(244, 67, 54, 0.6)'; // Brighter red for valid target
    }
    if (occupantType === 'pokemon' && occupantData) {
      return occupantData.owner === 'player' ? '#4CAF50' : '#f44336'; // Green/Red
    }
    if (isHighlighted) {
      if (highlightType === 'move') {
        return 'rgba(76, 175, 80, 0.3)'; // Green tint for movement
      }
      if (highlightType === 'attack') {
        return 'rgba(244, 67, 54, 0.3)'; // Red tint for attack range
      }
    }
    if (isDeploymentZone) {
      return 'rgba(255, 255, 255, 0.05)';
    }
    return '#1a1a1a'; // Default empty
  };

  // Determine cell border color
  const getCellBorder = () => {
    // T044: Keyboard cursor takes priority
    if (hasKeyboardCursor) {
      return '2px solid #fff'; // White border for keyboard cursor
    }
    if (isSelected) {
      return '2px solid #2196F3'; // Blue border for selected
    }
    if (occupantType === 'pokemon' && occupantData) {
      return occupantData.owner === 'player' ? '2px solid #66BB6A' : '2px solid #EF5350';
    }
    if (isHighlighted) {
      if (highlightType === 'move') {
        return '2px solid #4CAF50';
      }
      if (highlightType === 'attack') {
        return '2px solid #f44336';
      }
    }
    return '1px solid #333';
  };

  // Get display text for occupant
  const getOccupantDisplay = () => {
    if (occupantType === 'pokemon' && occupantData?.name) {
      // Show first 3 characters of Pokemon name
      return occupantData.name.substring(0, 3).toUpperCase();
    }
    if (occupantType === 'trainer') {
      return 'T';
    }
    return '';
  };

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const handleMouseEnter = () => {
    if (!disabled && onMouseEnter) {
      onMouseEnter();
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
    if (!disabled && onMouseLeave) {
      onMouseLeave();
    }
  };

  // Tooltip state
  const [showTooltip, setShowTooltip] = useState(false);

  const handleMouseEnterWithTooltip = () => {
    if (occupantType === 'pokemon' && occupantData?.combatant) {
      setShowTooltip(true);
    }
    handleMouseEnter();
  };

  // Format stats for tooltip
  const getTooltipContent = () => {
    if (!occupantData?.combatant) return null;
    const c = occupantData.combatant;
    const attrs = c.attributes || {};
    return (
      <div style={styles.tooltip}>
        <div style={styles.tooltipHeader}>
          <span style={styles.tooltipName}>{c.name}</span>
          <span style={styles.tooltipLevel}>Lv.{c.level}</span>
        </div>
        <div style={styles.tooltipTypes}>
          {c.type?.map(t => (
            <span key={t} style={{...styles.tooltipType, backgroundColor: getTypeColor(t)}}>{t}</span>
          ))}
        </div>
        <div style={styles.tooltipStats}>
          <div style={styles.tooltipHp}>
            HP: {c.current_hp}/{c.max_hp}
          </div>
          <div style={styles.tooltipAc}>AC: {c.ac}</div>
        </div>
        <div style={styles.tooltipAttributes}>
          <span>STR: {attrs.str || 10}</span>
          <span>DEX: {attrs.dex || 10}</span>
          <span>CON: {attrs.con || 10}</span>
        </div>
        <div style={styles.tooltipAttributes}>
          <span>INT: {attrs.int || 10}</span>
          <span>WIS: {attrs.wis || 10}</span>
          <span>CHA: {attrs.cha || 10}</span>
        </div>
        <div style={styles.tooltipMovement}>
          Speed: {(c.walking_speed || 6) * 5}ft ({c.movement_remaining ?? c.walking_speed ?? 6} cells left)
        </div>
        {c.known_moves && c.known_moves.length > 0 && (
          <div style={styles.tooltipMoves}>
            <div style={styles.tooltipMovesLabel}>Moves:</div>
            {c.known_moves.map(m => (
              <div key={m.id} style={styles.tooltipMove}>
                {m.name} (PP: {c.move_pp?.[m.id] ?? m.pp ?? '?'})
              </div>
            ))}
          </div>
        )}
        {c.status_effects && c.status_effects.length > 0 && (
          <div style={styles.tooltipStatus}>
            Status: {c.status_effects.map(s => s.status_type).join(', ')}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        ...styles.cell,
        backgroundColor: getCellBackground(),
        border: getCellBorder(),
        cursor: disabled ? 'default' : 'pointer',
        position: 'relative'
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnterWithTooltip}
      onMouseLeave={handleMouseLeave}
    >
      <span style={styles.occupant}>{getOccupantDisplay()}</span>
      {showTooltip && getTooltipContent()}
    </div>
  );
}

// Get color for Pokemon type
function getTypeColor(type) {
  const colors = {
    Normal: '#A8A878', Fire: '#F08030', Water: '#6890F0', Electric: '#F8D030',
    Grass: '#78C850', Ice: '#98D8D8', Fighting: '#C03028', Poison: '#A040A0',
    Ground: '#E0C068', Flying: '#A890F0', Psychic: '#F85888', Bug: '#A8B820',
    Rock: '#B8A038', Ghost: '#705898', Dragon: '#7038F8', Dark: '#705848',
    Steel: '#B8B8D0', Fairy: '#EE99AC'
  };
  return colors[type] || '#888';
}

const styles = {
  cell: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    transition: 'background-color 0.15s ease, border-color 0.15s ease'
  },
  occupant: {
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#fff',
    textShadow: '0 0 2px rgba(0,0,0,0.8)'
  },
  tooltip: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#1a1a1a',
    border: '1px solid #444',
    borderRadius: '6px',
    padding: '10px',
    minWidth: '180px',
    zIndex: 1000,
    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
    marginBottom: '8px',
    pointerEvents: 'none'
  },
  tooltipHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
    borderBottom: '1px solid #333',
    paddingBottom: '6px'
  },
  tooltipName: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#fff'
  },
  tooltipLevel: {
    fontSize: '12px',
    color: '#4CAF50',
    fontWeight: 'bold'
  },
  tooltipTypes: {
    display: 'flex',
    gap: '4px',
    marginBottom: '6px'
  },
  tooltipType: {
    padding: '2px 6px',
    borderRadius: '3px',
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase'
  },
  tooltipStats: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px',
    fontSize: '12px'
  },
  tooltipHp: {
    color: '#4CAF50'
  },
  tooltipAc: {
    color: '#2196F3'
  },
  tooltipAttributes: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px',
    color: '#aaa',
    marginBottom: '2px'
  },
  tooltipMovement: {
    fontSize: '11px',
    color: '#FFC107',
    marginTop: '4px',
    marginBottom: '4px'
  },
  tooltipMoves: {
    marginTop: '6px',
    paddingTop: '6px',
    borderTop: '1px solid #333'
  },
  tooltipMovesLabel: {
    fontSize: '10px',
    color: '#888',
    marginBottom: '4px'
  },
  tooltipMove: {
    fontSize: '11px',
    color: '#ddd',
    marginBottom: '2px'
  },
  tooltipStatus: {
    marginTop: '6px',
    fontSize: '11px',
    color: '#f44336',
    fontStyle: 'italic'
  }
};
