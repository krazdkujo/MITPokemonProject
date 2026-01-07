/**
 * RangeIndicator Component
 * Displays attack range information for a selected move
 *
 * Feature: 023-movement-test-harness
 * Task: T022, T027
 */

import React from 'react';

/**
 * RangeIndicator - Shows attack range info for selected move
 *
 * @param {Object} props
 * @param {Object|null} props.selectedMove - { id, name, range_cells, type }
 * @param {Object|null} props.attackerPosition - { col, row }
 * @param {Array} props.validTargets - [{ combatant_id, name, position, distance }]
 * @param {Array} props.cellsInRange - [{ col, row }]
 * @param {boolean} props.visible - Whether to show the indicator
 * @param {function} props.onTargetClick - (combatant_id) => void
 */
export default function RangeIndicator({
  selectedMove = null,
  attackerPosition = null,
  validTargets = [],
  cellsInRange = [],
  visible = false,
  onTargetClick
}) {
  if (!visible || !selectedMove) {
    return null;
  }

  const rangeInFeet = selectedMove.range_cells * 5;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.moveName}>{selectedMove.name}</span>
        <span style={styles.moveType}>({selectedMove.type})</span>
      </div>

      {/* T027: Display range info text */}
      <div style={styles.rangeInfo}>
        Range: {selectedMove.range_cells} cells ({rangeInFeet} ft)
      </div>

      {/* Target count */}
      <div style={styles.targetInfo}>
        {validTargets.length > 0 ? (
          <span style={styles.hasTargets}>
            {validTargets.length} target{validTargets.length !== 1 ? 's' : ''} in range
          </span>
        ) : (
          <span style={styles.noTargets}>No targets in range</span>
        )}
      </div>

      {/* Valid targets list */}
      {validTargets.length > 0 && (
        <div style={styles.targetList}>
          {validTargets.map(target => (
            <button
              key={target.combatant_id}
              style={styles.targetButton}
              onClick={() => onTargetClick?.(target.combatant_id)}
            >
              {target.name} ({target.distance} cells)
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '12px',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    border: '1px solid #f44336',
    borderRadius: '8px',
    marginTop: '8px'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px'
  },
  moveName: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#fff'
  },
  moveType: {
    fontSize: '12px',
    color: '#888'
  },
  rangeInfo: {
    fontSize: '12px',
    color: '#f44336',
    marginBottom: '4px'
  },
  targetInfo: {
    fontSize: '12px',
    marginBottom: '8px'
  },
  hasTargets: {
    color: '#4CAF50'
  },
  noTargets: {
    color: '#888'
  },
  targetList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  targetButton: {
    padding: '8px 12px',
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    border: '1px solid #f44336',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background-color 0.15s ease'
  }
};
