/**
 * ControlPanel Component
 * Battle control buttons and mode toggle for combat testing
 *
 * Feature: 021-combat-test-harness
 * Task: T009
 */

import { useState } from 'react';

/**
 * ControlPanel - Battle control buttons and settings
 *
 * @param {Object} props
 * @param {string} props.battleState - Current state: 'idle', 'ready', 'running', 'paused', 'ended'
 * @param {string} props.mode - Current mode: 'step' or 'auto'
 * @param {number} props.speed - Auto-run speed in ms (100-2000)
 * @param {number} props.seed - RNG seed (optional, displays generated seed after battle)
 * @param {function} props.onStart - Callback when Start Battle clicked
 * @param {function} props.onNextTurn - Callback when Next Turn clicked
 * @param {function} props.onReset - Callback when Reset clicked
 * @param {function} props.onModeChange - Callback when mode toggled
 * @param {function} props.onSpeedChange - Callback when speed slider changes
 * @param {function} props.onSeedChange - Callback when seed input changes
 * @param {function} props.onPause - Callback when pause clicked in auto mode
 * @param {function} props.onResume - Callback when resume clicked
 */
export default function ControlPanel({
  battleState = 'idle',
  mode = 'step',
  speed = 500,
  seed = null,
  onStart,
  onNextTurn,
  onReset,
  onModeChange,
  onSpeedChange,
  onSeedChange,
  onPause,
  onResume
}) {
  const [seedInput, setSeedInput] = useState('');

  const handleSeedInputChange = (e) => {
    setSeedInput(e.target.value);
    if (onSeedChange) {
      const value = e.target.value ? parseInt(e.target.value, 10) : null;
      onSeedChange(isNaN(value) ? null : value);
    }
  };

  const canStart = battleState === 'ready';
  const canNextTurn = battleState === 'running' && mode === 'step';
  const canPause = battleState === 'running' && mode === 'auto';
  const canResume = battleState === 'paused' && mode === 'auto';
  const canReset = battleState !== 'idle';
  const isRunning = battleState === 'running' || battleState === 'paused';

  return (
    <div style={styles.container}>
      {/* Mode Toggle */}
      <div style={styles.section}>
        <label style={styles.sectionLabel}>Mode</label>
        <div style={styles.modeToggle}>
          <button
            style={{
              ...styles.modeButton,
              ...(mode === 'step' ? styles.modeButtonActive : {})
            }}
            onClick={() => onModeChange && onModeChange('step')}
            disabled={isRunning}
          >
            Step-by-Step
          </button>
          <button
            style={{
              ...styles.modeButton,
              ...(mode === 'auto' ? styles.modeButtonActive : {})
            }}
            onClick={() => onModeChange && onModeChange('auto')}
            disabled={isRunning}
          >
            Auto-Run
          </button>
        </div>
      </div>

      {/* Speed Slider (only for auto mode) */}
      {mode === 'auto' && (
        <div style={styles.section}>
          <label style={styles.sectionLabel}>
            Speed: {speed}ms per turn
          </label>
          <input
            type="range"
            min="100"
            max="2000"
            step="100"
            value={speed}
            onChange={(e) => onSpeedChange && onSpeedChange(parseInt(e.target.value, 10))}
            disabled={isRunning}
            style={styles.slider}
          />
          <div style={styles.sliderLabels}>
            <span>Fast</span>
            <span>Slow</span>
          </div>
        </div>
      )}

      {/* Seed Input */}
      <div style={styles.section}>
        <label style={styles.sectionLabel}>
          Seed (optional)
        </label>
        <input
          type="text"
          placeholder="Random seed..."
          value={seedInput}
          onChange={handleSeedInputChange}
          disabled={isRunning}
          style={styles.seedInput}
        />
        {seed !== null && battleState === 'ended' && (
          <div style={styles.seedHint}>
            Used seed: {seed}
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div style={styles.buttonGroup}>
        {/* Start Button */}
        <button
          style={{
            ...styles.button,
            ...styles.buttonStart,
            ...(canStart ? {} : styles.buttonDisabled)
          }}
          onClick={onStart}
          disabled={!canStart}
        >
          Start Battle
        </button>

        {/* Step Mode: Next Turn Button */}
        {mode === 'step' && (
          <button
            style={{
              ...styles.button,
              ...styles.buttonNext,
              ...(canNextTurn ? {} : styles.buttonDisabled)
            }}
            onClick={onNextTurn}
            disabled={!canNextTurn}
          >
            Next Turn
          </button>
        )}

        {/* Auto Mode: Pause/Resume Buttons */}
        {mode === 'auto' && battleState === 'running' && (
          <button
            style={{
              ...styles.button,
              ...styles.buttonPause
            }}
            onClick={onPause}
          >
            Pause
          </button>
        )}
        {mode === 'auto' && battleState === 'paused' && (
          <button
            style={{
              ...styles.button,
              ...styles.buttonResume
            }}
            onClick={onResume}
          >
            Resume
          </button>
        )}

        {/* Reset Button */}
        <button
          style={{
            ...styles.button,
            ...styles.buttonReset,
            ...(canReset ? {} : styles.buttonDisabled)
          }}
          onClick={onReset}
          disabled={!canReset}
        >
          Reset
        </button>
      </div>

      {/* Battle State Indicator */}
      <div style={styles.stateIndicator}>
        <span style={styles.stateLabel}>Status:</span>
        <span style={{
          ...styles.stateValue,
          color: getStateColor(battleState)
        }}>
          {getStateLabel(battleState)}
        </span>
      </div>
    </div>
  );
}

function getStateLabel(state) {
  const labels = {
    idle: 'Select Pokemon',
    ready: 'Ready to Battle',
    running: 'Battle in Progress',
    paused: 'Paused',
    ended: 'Battle Ended'
  };
  return labels[state] || state;
}

function getStateColor(state) {
  const colors = {
    idle: '#888',
    ready: '#4CAF50',
    running: '#2196F3',
    paused: '#FFC107',
    ended: '#9C27B0'
  };
  return colors[state] || '#888';
}

const styles = {
  container: {
    padding: '16px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '8px'
  },
  section: {
    marginBottom: '16px'
  },
  sectionLabel: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    color: '#aaa'
  },
  modeToggle: {
    display: 'flex',
    gap: '8px'
  },
  modeButton: {
    flex: 1,
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#2a2a2a',
    color: '#888',
    border: '1px solid #444',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  modeButtonActive: {
    backgroundColor: '#3a3a3a',
    color: '#fff',
    borderColor: '#4CAF50'
  },
  slider: {
    width: '100%',
    cursor: 'pointer'
  },
  sliderLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#666'
  },
  seedInput: {
    width: '100%',
    padding: '8px',
    fontSize: '14px',
    backgroundColor: '#2a2a2a',
    color: '#fff',
    border: '1px solid #444',
    borderRadius: '4px',
    boxSizing: 'border-box'
  },
  seedHint: {
    marginTop: '4px',
    fontSize: '12px',
    color: '#888',
    fontFamily: 'monospace'
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px'
  },
  button: {
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  buttonStart: {
    backgroundColor: '#4CAF50',
    color: '#fff'
  },
  buttonNext: {
    backgroundColor: '#2196F3',
    color: '#fff'
  },
  buttonPause: {
    backgroundColor: '#FFC107',
    color: '#000'
  },
  buttonResume: {
    backgroundColor: '#4CAF50',
    color: '#fff'
  },
  buttonReset: {
    backgroundColor: '#f44336',
    color: '#fff'
  },
  buttonDisabled: {
    backgroundColor: '#333',
    color: '#666',
    cursor: 'not-allowed'
  },
  stateIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px',
    backgroundColor: '#0d0d0d',
    borderRadius: '4px'
  },
  stateLabel: {
    fontSize: '12px',
    color: '#888'
  },
  stateValue: {
    fontSize: '14px',
    fontWeight: 'bold'
  }
};
