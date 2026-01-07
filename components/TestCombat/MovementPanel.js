/**
 * MovementPanel Component
 * Displays movement statistics for selected Pokemon
 *
 * Feature: 023-movement-test-harness
 * Task: T029-T035
 */

import React from 'react';

/**
 * MovementPanel - Shows movement stats and controls for selected Pokemon
 *
 * @param {Object} props
 * @param {Object|null} props.selectedCombatant - TestCombatant object with position/movement data
 * @param {Object|null} props.movementState - { walking_speed, movement_remaining, has_moved_this_turn, walking_speed_feet }
 * @param {number} props.validMoveTargets - Count of valid move destinations
 * @param {function} props.onMoveClick - Enter move mode
 * @param {function} props.onCancelMove - Exit move mode
 * @param {boolean} props.moveMode - Currently in move mode
 * @param {boolean} props.disabled - Disable during battle execution
 */
export default function MovementPanel({
  selectedCombatant = null,
  movementState = null,
  validMoveTargets = 0,
  onMoveClick,
  onCancelMove,
  moveMode = false,
  disabled = false
}) {
  // T032: Determine movement status text
  const getMovementStatus = () => {
    if (!movementState) return 'No Pokemon selected';

    if (movementState.movement_remaining === 0) {
      return 'No movement remaining';
    }
    if (movementState.has_moved_this_turn) {
      return 'Already moved this turn';
    }
    return 'Ready to move';
  };

  // Get status color
  const getStatusColor = () => {
    if (!movementState) return '#888';
    if (movementState.has_moved_this_turn || movementState.movement_remaining === 0) {
      return '#f44336'; // Red
    }
    return '#4CAF50'; // Green
  };

  // If no combatant selected, show minimal panel
  if (!selectedCombatant) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>Movement</div>
        <div style={styles.emptyState}>
          Click a Pokemon on the grid to view movement stats
        </div>
      </div>
    );
  }

  const walkingSpeedCells = movementState?.walking_speed || 0;
  const walkingSpeedFeet = movementState?.walking_speed_feet || (walkingSpeedCells * 5);
  const movementRemaining = movementState?.movement_remaining || 0;

  return (
    <div style={styles.container}>
      <div style={styles.header}>Movement</div>

      {/* T030: Pokemon name */}
      <div style={styles.pokemonName}>
        {selectedCombatant.name || 'Unknown Pokemon'}
      </div>

      {/* T030: Walking speed display */}
      <div style={styles.statRow}>
        <span style={styles.statLabel}>Walking Speed:</span>
        <span style={styles.statValue}>
          {walkingSpeedCells} cells ({walkingSpeedFeet} ft)
        </span>
      </div>

      {/* T031: Remaining movement display */}
      <div style={styles.statRow}>
        <span style={styles.statLabel}>Remaining:</span>
        <span style={styles.statValue}>
          {movementRemaining}/{walkingSpeedCells} cells
        </span>
      </div>

      {/* T032: Movement status */}
      <div style={styles.statusRow}>
        <span style={styles.statusLabel}>Status:</span>
        <span style={{ ...styles.statusValue, color: getStatusColor() }}>
          {getMovementStatus()}
        </span>
      </div>

      {/* Valid targets count when in move mode */}
      {moveMode && (
        <div style={styles.targetInfo}>
          {validMoveTargets} valid destination{validMoveTargets !== 1 ? 's' : ''}
        </div>
      )}

      {/* T033: Control buttons */}
      <div style={styles.buttonRow}>
        {!moveMode ? (
          <button
            style={{
              ...styles.moveButton,
              opacity: disabled || movementState?.has_moved_this_turn ? 0.5 : 1,
              cursor: disabled || movementState?.has_moved_this_turn ? 'not-allowed' : 'pointer'
            }}
            onClick={onMoveClick}
            disabled={disabled || movementState?.has_moved_this_turn}
          >
            Move Pokemon
          </button>
        ) : (
          <button
            style={styles.cancelButton}
            onClick={onCancelMove}
          >
            Cancel
          </button>
        )}
      </div>

      {/* T043: Show disabled state for paralyzed/restrained */}
      {movementState?.movement_remaining === 0 && movementState?.walking_speed > 0 && (
        <div style={styles.warningText}>
          Movement impaired (paralyzed/restrained)
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '12px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '8px'
  },
  header: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #333'
  },
  emptyState: {
    fontSize: '12px',
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '16px 0'
  },
  pokemonName: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: '12px'
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  statLabel: {
    fontSize: '12px',
    color: '#888'
  },
  statValue: {
    fontSize: '12px',
    color: '#fff',
    fontFamily: 'monospace'
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingTop: '8px',
    borderTop: '1px solid #333'
  },
  statusLabel: {
    fontSize: '12px',
    color: '#888'
  },
  statusValue: {
    fontSize: '12px',
    fontWeight: 'bold'
  },
  targetInfo: {
    fontSize: '11px',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: '8px'
  },
  buttonRow: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center'
  },
  moveButton: {
    flex: 1,
    padding: '10px 16px',
    backgroundColor: '#4CAF50',
    border: 'none',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease'
  },
  cancelButton: {
    flex: 1,
    padding: '10px 16px',
    backgroundColor: 'transparent',
    border: '1px solid #666',
    borderRadius: '4px',
    color: '#888',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease'
  },
  warningText: {
    fontSize: '10px',
    color: '#FFC107',
    textAlign: 'center',
    marginTop: '8px',
    fontStyle: 'italic'
  }
};
